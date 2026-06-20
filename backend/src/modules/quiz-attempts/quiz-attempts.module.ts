import { Module } from '@nestjs/common';
import { WebsocketModule } from '../../gateway/websocket/websocket.module';
import { QuizAttemptRepository } from './entity/quiz-attempt.repository';
import { QuizAttemptsService } from './service/quiz-attempts.service';

@Module({
  imports: [WebsocketModule],
  providers: [QuizAttemptRepository, QuizAttemptsService],
  exports: [QuizAttemptsService],
})
export class QuizAttemptsModule {}
