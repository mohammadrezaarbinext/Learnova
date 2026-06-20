import { Module } from '@nestjs/common';
import { QuizRepository } from './entity/quiz.repository';
import { QuizzesService } from './service/quizzes.service';

@Module({
  providers: [QuizRepository, QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
