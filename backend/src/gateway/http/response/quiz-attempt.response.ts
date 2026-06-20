import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionContentType } from '../../../modules/questions/entity/question.entity';
import { QuizAttemptStatus } from '../../../modules/quiz-attempts/entity/quiz-attempt.entity';
import { QuizStatus } from '../../../modules/quizzes/entity/quiz.entity';
import { QuizCourseResponse } from './quiz.response';

export class QuizAttemptQuizResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000601', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'Final Exam' })
  title: string;

  @ApiProperty({ example: 45 })
  durationMinutes: number;

  @ApiPropertyOptional({ nullable: true })
  startsAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  endsAt: Date | null;

  @ApiProperty({ enum: QuizStatus, example: QuizStatus.PUBLISHED })
  status: QuizStatus;

  @ApiProperty({ type: QuizCourseResponse })
  course: QuizCourseResponse;
}

export class QuestionAnswerResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000901', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  attemptId: number;

  @ApiProperty({ example: 1 })
  questionId: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  selectedOptionId: number | null;

  @ApiPropertyOptional({ enum: QuestionContentType, nullable: true })
  answerContentType: QuestionContentType | null;

  @ApiPropertyOptional({ example: 'My answer.', nullable: true })
  answerContent: unknown;

  @ApiPropertyOptional({ nullable: true })
  answerImageUrl: string | null;

  @ApiPropertyOptional({ example: '1.00', nullable: true })
  score: string | null;

  @ApiPropertyOptional({ example: true, nullable: true })
  isCorrect: boolean | null;

  @ApiPropertyOptional({ nullable: true })
  gradedAt: Date | null;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  updatedAt: Date;
}

export class QuizAttemptResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '00000000-0000-4000-8000-000000000901', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  quizId: number;

  @ApiProperty({ example: 1 })
  studentId: number;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  startedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ enum: QuizAttemptStatus, example: QuizAttemptStatus.IN_PROGRESS })
  status: QuizAttemptStatus;

  @ApiPropertyOptional({ example: '8.50', nullable: true })
  score: string | null;

  @ApiPropertyOptional({ type: QuizAttemptQuizResponse })
  quiz?: QuizAttemptQuizResponse;

  @ApiProperty({ type: [QuestionAnswerResponse] })
  answers: QuestionAnswerResponse[];

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-20T08:45:00.000Z' })
  updatedAt: Date;
}
