import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DESCRIPTIVE = 'DESCRIPTIVE',
}

export enum QuestionContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  RICH_TEXT = 'RICH_TEXT',
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

const questionTypeMap: Record<string, QuestionType | undefined> = {
  [QuestionType.MULTIPLE_CHOICE]: QuestionType.MULTIPLE_CHOICE,
  [QuestionType.DESCRIPTIVE]: QuestionType.DESCRIPTIVE,
};

const questionContentTypeMap: Record<string, QuestionContentType | undefined> = {
  [QuestionContentType.TEXT]: QuestionContentType.TEXT,
  [QuestionContentType.IMAGE]: QuestionContentType.IMAGE,
  [QuestionContentType.RICH_TEXT]: QuestionContentType.RICH_TEXT,
};

@Entity('QuestionOption')
export class QuestionOptionEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  questionId!: number;

  @Column({ type: 'enum', enum: QuestionContentType, default: QuestionContentType.TEXT })
  contentType!: QuestionContentType;

  @Column({ type: 'jsonb' })
  content!: JsonValue;

  @Column({ nullable: true, length: 500 })
  imageUrl!: string | null;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column({ type: 'boolean', default: false })
  isCorrect!: boolean;
}

@Entity('Question')
export class QuestionEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  quizId!: number;

  @Column({ type: 'enum', enum: QuestionType })
  type!: QuestionType;

  @Column({ type: 'enum', enum: QuestionContentType, default: QuestionContentType.TEXT })
  contentType!: QuestionContentType;

  @Column({ type: 'jsonb' })
  content!: JsonValue;

  @Column({ nullable: true, length: 500 })
  imageUrl!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  points!: string;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column({ type: 'jsonb', nullable: true })
  answerKey!: JsonValue | null;

  options!: QuestionOptionEntity[];
}

export type QuestionOptionResponseEntity = Omit<QuestionOptionEntity, 'isCorrect'> & {
  isCorrect?: boolean;
};

export type QuestionResponseEntity = Omit<QuestionEntity, 'answerKey' | 'options'> & {
  answerKey?: JsonValue | null;
  options: QuestionOptionResponseEntity[];
};

export type DeleteQuestionEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

type DecimalLike = { toString(): string };

type QuestionOptionPersistence = Omit<QuestionOptionEntity, 'contentType' | 'content'> & {
  contentType: string;
  content: unknown;
};

type QuestionPersistence = Omit<QuestionEntity, 'type' | 'contentType' | 'content' | 'points' | 'answerKey' | 'options'> & {
  type: string;
  contentType: string;
  content: unknown;
  points: DecimalLike | string | number;
  answerKey?: unknown;
  options?: QuestionOptionPersistence[];
};

export function serializeQuestion(question: QuestionEntity, includeCorrectAnswer: boolean): QuestionResponseEntity {
  return {
    id: question.id,
    uuid: question.uuid,
    quizId: question.quizId,
    type: question.type,
    contentType: question.contentType,
    content: question.content,
    imageUrl: question.imageUrl,
    points: question.points,
    orderIndex: question.orderIndex,
    ...(includeCorrectAnswer ? { answerKey: question.answerKey } : {}),
    options: question.options.map((option) => serializeQuestionOption(option, includeCorrectAnswer)),
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

export function serializeQuestionOption(
  option: QuestionOptionEntity,
  includeCorrectAnswer: boolean,
): QuestionOptionResponseEntity {
  return {
    id: option.id,
    uuid: option.uuid,
    questionId: option.questionId,
    contentType: option.contentType,
    content: option.content,
    imageUrl: option.imageUrl,
    orderIndex: option.orderIndex,
    ...(includeCorrectAnswer ? { isCorrect: option.isCorrect } : {}),
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
  };
}

export function toQuestionType(value: string): QuestionType {
  const type = questionTypeMap[value];
  if (!type) {
    throw new Error(`Unsupported question type: ${value}`);
  }

  return type;
}

export function toQuestionContentType(value: string): QuestionContentType {
  const type = questionContentTypeMap[value];
  if (!type) {
    throw new Error(`Unsupported question content type: ${value}`);
  }

  return type;
}

export function toQuestionEntity(question: QuestionPersistence): QuestionEntity {
  return {
    id: question.id,
    uuid: question.uuid,
    quizId: question.quizId,
    type: toQuestionType(question.type),
    contentType: toQuestionContentType(question.contentType),
    content: toJsonValue(question.content),
    imageUrl: question.imageUrl,
    points: question.points?.toString?.() ?? String(question.points),
    orderIndex: question.orderIndex,
    answerKey: toNullableJsonValue(question.answerKey),
    options: question.options?.map(toQuestionOptionEntity) ?? [],
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
  };
}

export function toQuestionOptionEntity(option: QuestionOptionPersistence): QuestionOptionEntity {
  return {
    id: option.id,
    uuid: option.uuid,
    questionId: option.questionId,
    contentType: toQuestionContentType(option.contentType),
    content: toJsonValue(option.content),
    imageUrl: option.imageUrl,
    orderIndex: option.orderIndex,
    isCorrect: option.isCorrect,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt,
  };
}

export function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    (typeof value === 'object' && value !== null)
  ) {
    return value as JsonValue;
  }

  throw new Error('Unsupported JSON value in question data');
}

export function toNullableJsonValue(value: unknown): JsonValue | null {
  if (value === undefined || value === null) {
    return null;
  }

  return toJsonValue(value);
}
