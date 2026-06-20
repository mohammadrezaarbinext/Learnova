import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QUIZ_ATTEMPT_CHANNEL, QuizSocketService } from './quiz-socket.service';

type QuizRoomPayload = {
  attemptUuid: string;
};

type SocketChannelPayload = {
  channel?: string;
  attemptUuid?: string;
};

@WebSocketGateway({
  cors: true,
  namespace: 'quiz',
})
export class QuizGateway {
  private readonly logger = new Logger(QuizGateway.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  @WebSocketServer()
  private server: Server;

  constructor(private readonly quizSocketService: QuizSocketService) {}

  @SubscribeMessage('socket:join')
  async joinChannel(@MessageBody() payload: SocketChannelPayload, @ConnectedSocket() socket: Socket) {
    if (payload?.channel !== QUIZ_ATTEMPT_CHANNEL || !payload.attemptUuid) {
      socket.emit('socket:error', {
        message: 'Unsupported socket channel',
        channel: payload?.channel,
      });
      return;
    }

    await this.joinAttempt(payload, socket);
  }

  @SubscribeMessage('socket:leave')
  async leaveChannel(@MessageBody() payload: SocketChannelPayload, @ConnectedSocket() socket: Socket) {
    if (payload?.channel !== QUIZ_ATTEMPT_CHANNEL || !payload.attemptUuid) {
      return;
    }

    await this.leaveAttempt(payload, socket);
  }

  @SubscribeMessage('quiz:join')
  async join(@MessageBody() payload: QuizRoomPayload, @ConnectedSocket() socket: Socket) {
    await this.joinAttempt({ channel: QUIZ_ATTEMPT_CHANNEL, attemptUuid: payload?.attemptUuid }, socket);
  }

  @SubscribeMessage('quiz:leave')
  async leave(@MessageBody() payload: QuizRoomPayload, @ConnectedSocket() socket: Socket) {
    await this.leaveAttempt({ channel: QUIZ_ATTEMPT_CHANNEL, attemptUuid: payload?.attemptUuid }, socket);
  }

  emitTimer(attemptUuid: string, remainingSeconds: number) {
    this.server?.to(this.quizSocketService.roomName(attemptUuid)).emit('quiz:timer', {
      channel: QUIZ_ATTEMPT_CHANNEL,
      attemptUuid,
      remainingSeconds,
    });
  }

  emitExpired(attemptUuid: string) {
    this.server?.to(this.quizSocketService.roomName(attemptUuid)).emit('quiz:expired', {
      channel: QUIZ_ATTEMPT_CHANNEL,
      attemptUuid,
    });
  }

  emitSubmitted(attemptUuid: string) {
    this.server?.to(this.quizSocketService.roomName(attemptUuid)).emit('quiz:submitted', {
      channel: QUIZ_ATTEMPT_CHANNEL,
      attemptUuid,
    });
  }

  private async joinAttempt(payload: SocketChannelPayload, socket: Socket) {
    if (!payload?.attemptUuid) {
      return;
    }

    const state = await this.quizSocketService.getAttemptState(payload.attemptUuid);
    if (!state) {
      socket.emit('socket:error', {
        channel: QUIZ_ATTEMPT_CHANNEL,
        attemptUuid: payload.attemptUuid,
        message: 'Quiz attempt not found',
      });
      return;
    }

    socket.join(state.room);
    socket.emit('socket:joined', {
      channel: QUIZ_ATTEMPT_CHANNEL,
      room: state.room,
      attemptUuid: state.attemptUuid,
    });
    socket.emit('quiz:state', state);
    this.startTimer(socket, state.attemptUuid);
    this.logger.log(`Socket joined ${state.room}`);
  }

  private async leaveAttempt(payload: SocketChannelPayload, socket: Socket) {
    if (!payload?.attemptUuid) {
      return;
    }

    const room = this.quizSocketService.roomName(payload.attemptUuid);
    socket.leave(room);
    this.stopTimer(socket.id, payload.attemptUuid);
    socket.emit('socket:left', {
      channel: QUIZ_ATTEMPT_CHANNEL,
      room,
      attemptUuid: payload.attemptUuid,
    });
    this.logger.log(`Socket left ${room}`);
  }

  private startTimer(socket: Socket, attemptUuid: string) {
    const key = this.timerKey(socket.id, attemptUuid);
    this.stopTimer(socket.id, attemptUuid);

    const timer = setInterval(async () => {
      const state = await this.quizSocketService.getAttemptState(attemptUuid);
      if (!state) {
        this.stopTimer(socket.id, attemptUuid);
        return;
      }

      socket.emit('quiz:timer', {
        channel: QUIZ_ATTEMPT_CHANNEL,
        attemptUuid: state.attemptUuid,
        remainingSeconds: state.remainingSeconds,
        serverTime: state.serverTime,
      });

      if (state.expired) {
        socket.emit('quiz:expired', {
          channel: QUIZ_ATTEMPT_CHANNEL,
          attemptUuid: state.attemptUuid,
        });
        this.stopTimer(socket.id, attemptUuid);
      }
    }, 1000);

    socket.once('disconnect', () => this.stopTimer(socket.id, attemptUuid));
    this.timers.set(key, timer);
  }

  private stopTimer(socketId: string, attemptUuid: string) {
    const key = this.timerKey(socketId, attemptUuid);
    const timer = this.timers.get(key);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(key);
    }
  }

  private timerKey(socketId: string, attemptUuid: string): string {
    return `${socketId}:${attemptUuid}`;
  }
}
