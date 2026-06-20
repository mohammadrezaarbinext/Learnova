import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';
import { JsonValue, QuestionContentType, toJsonValue, toNullableJsonValue } from '../../questions/entity/question.entity';

export enum QuizAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  EXPIRED = 'EXPIRED',
}

export type QuizAttemptQuizEntity = {
  id: number;
  uuid: string;
  courseId: number;
  title: string;
  durationMinutes: number;
  startsAt: Date | null;
  endsAt: Date | null;
  status: string;
  course: {
    id: number;
    uuid: string;
    teacherId: number;
    title: string;
  };
};

const quizAttemptStatusMap: Record<string, QuizAttemptStatus | undefined> = {
  [QuizAttemptStatus.IN_PROGRESS]: QuizAttemptStatus.IN_PROGRESS,
  [QuizAttemptStatus.SUBMITTED]: QuizAttemptStatus.SUBMITTED,
  [QuizAttemptStatus.GRADED]: QuizAttemptStatus.GRADED,
  [QuizAttemptStatus.EXPIRED]: QuizAttemptStatus.EXPIRED,
};

@Entity('QuestionAnswer')
export class QuestionAnswerEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  attemptId!: number;

  @Index()
  @Column({ type: 'int' })
  questionId!: number;

  @Column({ type: 'int', nullable: true })
  selectedOptionId!: number | null;

  @Column({ type: 'enum', enum: QuestionContentType, nullable: true })
  answerContentType!: QuestionContentType | null;

  @Column({ type: 'jsonb', nullable: true })
  answerContent!: JsonValue | null;

  @Column({ nullable: true, length: 500 })
  answerImageUrl!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score!: string | null;

  @Column({ type: 'boolean', nullable: true })
  isCorrect!: boolean | null;

  @Column({ nullable: true })
  gradedAt!: Date | null;
}

@Entity('QuizAttempt')
export class QuizAttemptEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  quizId!: number;

  @Index()
  @Column({ type: 'int' })
  studentId!: number;

  @Column()
  startedAt!: Date;

  @Column({ nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'enum', enum: QuizAttemptStatus, default: QuizAttemptStatus.IN_PROGRESS })
  status!: QuizAttemptStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  score!: string | null;

  quiz?: QuizAttemptQuizEntity;
  answers!: QuestionAnswerEntity[];
}

export type QuestionAnswerResponseEntity = QuestionAnswerEntity;
export type QuizAttemptResponseEntity = QuizAttemptEntity;

type DecimalLike = { toString(): string };

type QuestionAnswerPersistence = Omit<
  QuestionAnswerEntity,
  'answerContentType' | 'answerContent' | 'score'
> & {
  answerContentType?: string | null;
  answerContent?: unknown;
  score?: DecimalLike | string | number | null;
};

type QuizAttemptPersistence = Omit<QuizAttemptEntity, 'status' | 'score' | 'answers'> & {
  status: string;
  score?: DecimalLike | string | number | null;
  answers?: QuestionAnswerPersistence[];
};

export function serializeQuizAttempt(attempt: QuizAttemptEntity): QuizAttemptResponseEntity {
  return {
    id: attempt.id,
    uuid: attempt.uuid,
    quizId: attempt.quizId,
    studentId: attempt.studentId,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    status: attempt.status,
    score: attempt.score,
    quiz: attempt.quiz,
    answers: attempt.answers.map(serializeQuestionAnswer),
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
}

export function serializeQuestionAnswer(answer: QuestionAnswerEntity): QuestionAnswerResponseEntity {
  return {
    id: answer.id,
    uuid: answer.uuid,
    attemptId: answer.attemptId,
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    answerContentType: answer.answerContentType,
    answerContent: answer.answerContent,
    answerImageUrl: answer.answerImageUrl,
    score: answer.score,
    isCorrect: answer.isCorrect,
    gradedAt: answer.gradedAt,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  };
}

export function toQuizAttemptStatus(value: string): QuizAttemptStatus {
  const status = quizAttemptStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported quiz attempt status: ${value}`);
  }

  return status;
}

export function toQuizAttemptEntity(attempt: QuizAttemptPersistence): QuizAttemptEntity {
  return {
    id: attempt.id,
    uuid: attempt.uuid,
    quizId: attempt.quizId,
    studentId: attempt.studentId,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    status: toQuizAttemptStatus(attempt.status),
    score: attempt.score === null || attempt.score === undefined ? null : attempt.score.toString(),
    quiz: attempt.quiz,
    answers: attempt.answers?.map(toQuestionAnswerEntity) ?? [],
    createdAt: attempt.createdAt,
    updatedAt: attempt.updatedAt,
  };
}

export function toQuestionAnswerEntity(answer: QuestionAnswerPersistence): QuestionAnswerEntity {
  return {
    id: answer.id,
    uuid: answer.uuid,
    attemptId: answer.attemptId,
    questionId: answer.questionId,
    selectedOptionId: answer.selectedOptionId,
    answerContentType: answer.answerContentType ? (answer.answerContentType as QuestionContentType) : null,
    answerContent: toNullableJsonValue(answer.answerContent),
    answerImageUrl: answer.answerImageUrl,
    score: answer.score === null || answer.score === undefined ? null : answer.score.toString(),
    isCorrect: answer.isCorrect,
    gradedAt: answer.gradedAt,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  };
}

export function normalizeAnswerContent(value: unknown): JsonValue | null {
  return value === undefined || value === null ? null : toJsonValue(value);
}
