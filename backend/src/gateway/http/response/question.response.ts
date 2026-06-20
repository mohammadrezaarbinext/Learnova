import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JsonValue, QuestionContentType, QuestionType } from '../../../modules/questions/entity/question.entity';

export class QuestionOptionResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000801', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  questionId: number;

  @ApiProperty({ enum: QuestionContentType, example: QuestionContentType.TEXT })
  contentType: QuestionContentType;

  @ApiProperty({ example: 'Option A' })
  content: JsonValue;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiPropertyOptional({ example: true, description: 'Only returned for teacher/admin.' })
  isCorrect?: boolean;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  updatedAt: Date;
}

export class QuestionResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000701', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  quizId: number;

  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  type: QuestionType;

  @ApiProperty({ enum: QuestionContentType, example: QuestionContentType.TEXT })
  contentType: QuestionContentType;

  @ApiProperty({ example: 'What is NestJS?' })
  content: JsonValue;

  @ApiPropertyOptional({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: '1.00', description: 'Decimal string.' })
  points: string;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiPropertyOptional({ example: 'A', description: 'Only returned for teacher/admin.' })
  answerKey?: JsonValue | null;

  @ApiProperty({ type: [QuestionOptionResponse] })
  options: QuestionOptionResponse[];

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  updatedAt: Date;
}
