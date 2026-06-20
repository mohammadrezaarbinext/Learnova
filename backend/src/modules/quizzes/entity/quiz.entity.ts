import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';
import { QuestionEntity, QuestionResponseEntity, serializeQuestion } from '../../questions/entity/question.entity';

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export type QuizCourseEntity = {
  id: number;
  uuid: string;
  teacherId: number;
  title: string;
};

const quizStatusMap: Record<string, QuizStatus | undefined> = {
  [QuizStatus.DRAFT]: QuizStatus.DRAFT,
  [QuizStatus.PUBLISHED]: QuizStatus.PUBLISHED,
  [QuizStatus.ARCHIVED]: QuizStatus.ARCHIVED,
};

@Entity('Quiz')
export class QuizEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  courseId!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  durationMinutes!: number;

  @Column({ nullable: true })
  startsAt!: Date | null;

  @Column({ nullable: true })
  endsAt!: Date | null;

  @Column({ type: 'enum', enum: QuizStatus, default: QuizStatus.DRAFT })
  status!: QuizStatus;

  course?: QuizCourseEntity;
  questions?: QuestionEntity[];
}

export type QuizResponseEntity = Omit<QuizEntity, 'questions'> & {
  questions?: QuestionResponseEntity[];
};

export type DeleteQuizEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

type QuizPersistence = Omit<QuizEntity, 'status' | 'questions'> & {
  status: string;
  questions?: QuestionEntity[];
};

export function serializeQuiz(quiz: QuizEntity, includeCorrectAnswer = false): QuizResponseEntity {
  return {
    id: quiz.id,
    uuid: quiz.uuid,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    durationMinutes: quiz.durationMinutes,
    startsAt: quiz.startsAt,
    endsAt: quiz.endsAt,
    status: quiz.status,
    course: quiz.course,
    questions: quiz.questions?.map((question) => serializeQuestion(question, includeCorrectAnswer)),
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

export function toQuizStatus(value: string): QuizStatus {
  const status = quizStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported quiz status: ${value}`);
  }

  return status;
}

export function toQuizEntity(quiz: QuizPersistence): QuizEntity {
  return {
    id: quiz.id,
    uuid: quiz.uuid,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    durationMinutes: quiz.durationMinutes,
    startsAt: quiz.startsAt,
    endsAt: quiz.endsAt,
    status: toQuizStatus(quiz.status),
    course: quiz.course,
    questions: quiz.questions,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}
