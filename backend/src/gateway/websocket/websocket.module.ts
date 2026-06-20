import { Module } from '@nestjs/common';
import { QuizGateway } from './quiz.gateway';
import { QuizSocketService } from './quiz-socket.service';

@Module({
  providers: [QuizGateway, QuizSocketService],
  exports: [QuizGateway, QuizSocketService],
})
export class WebsocketModule {}
