import { PartialType } from '@nestjs/swagger';
import { CreateQuestionRequest } from './create-question.request';

export class UpdateQuestionRequest extends PartialType(CreateQuestionRequest) {}
