import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizStatus } from '../../../modules/quizzes/entity/quiz.entity';
import { QuestionResponse } from './question.response';

export class QuizCourseResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000101', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 2 })
  teacherId: number;

  @ApiProperty({ example: 'NestJS Foundations' })
  title: string;
}

export class QuizResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000601', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'Final Exam' })
  title: string;

  @ApiPropertyOptional({ example: 'Final exam for this course.', nullable: true })
  description: string | null;

  @ApiProperty({ example: 45 })
  durationMinutes: number;

  @ApiPropertyOptional({ example: '2026-06-20T08:00:00.000Z', nullable: true })
  startsAt: Date | null;

  @ApiPropertyOptional({ example: '2026-06-27T08:00:00.000Z', nullable: true })
  endsAt: Date | null;

  @ApiProperty({ enum: QuizStatus, example: QuizStatus.PUBLISHED })
  status: QuizStatus;

  @ApiPropertyOptional({ type: QuizCourseResponse })
  course?: QuizCourseResponse;

  @ApiPropertyOptional({ type: [QuestionResponse] })
  questions?: QuestionResponse[];

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  updatedAt: Date;
}

export class DeleteQuizResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000601', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: true })
  deleted: true;
}
