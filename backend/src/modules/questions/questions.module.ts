import { Module } from '@nestjs/common';
import { QuestionRepository } from './entity/question.repository';
import { QuestionsService } from './service/questions.service';

@Module({
  providers: [QuestionRepository, QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
