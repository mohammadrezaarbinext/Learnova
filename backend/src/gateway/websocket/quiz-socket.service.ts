import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export const QUIZ_ATTEMPT_CHANNEL = 'quiz:attempt';

export type QuizAttemptSocketState = {
  channel: typeof QUIZ_ATTEMPT_CHANNEL;
  room: string;
  attemptUuid: string;
  quizUuid: string;
  quizTitle: string;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  durationMinutes: number;
  endsAt: Date | null;
  expiresAt: Date | null;
  remainingSeconds: number;
  expired: boolean;
  serverTime: Date;
};

@Injectable()
export class QuizSocketService {
  constructor(private readonly prisma: PrismaService) {}

  roomName(attemptUuid: string): string {
    return `${QUIZ_ATTEMPT_CHANNEL}:${attemptUuid}`;
  }

  async getAttemptState(attemptUuid: string): Promise<QuizAttemptSocketState | null> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { uuid: attemptUuid },
      select: {
        uuid: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        quiz: {
          select: {
            uuid: true,
            title: true,
            durationMinutes: true,
            endsAt: true,
          },
        },
      },
    });

    if (!attempt) {
      return null;
    }

    const serverTime = new Date();
    const durationExpiresAt = attempt.quiz.durationMinutes
      ? new Date(attempt.startedAt.getTime() + attempt.quiz.durationMinutes * 60 * 1000)
      : null;
    const expiresAt = this.minDate(durationExpiresAt, attempt.quiz.endsAt);
    const remainingSeconds = expiresAt ? Math.max(Math.floor((expiresAt.getTime() - serverTime.getTime()) / 1000), 0) : 0;

    return {
      channel: QUIZ_ATTEMPT_CHANNEL,
      room: this.roomName(attempt.uuid),
      attemptUuid: attempt.uuid,
      quizUuid: attempt.quiz.uuid,
      quizTitle: attempt.quiz.title,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationMinutes: attempt.quiz.durationMinutes,
      endsAt: attempt.quiz.endsAt,
      expiresAt,
      remainingSeconds,
      expired: Boolean(expiresAt && remainingSeconds <= 0),
      serverTime,
    };
  }

  private minDate(first: Date | null, second: Date | null): Date | null {
    if (!first) {
      return second;
    }

    if (!second) {
      return first;
    }

    return first.getTime() <= second.getTime() ? first : second;
  }
}
