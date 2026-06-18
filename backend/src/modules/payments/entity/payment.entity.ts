import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';
import { CourseLevel, CourseStatus, toCourseLevel, toCourseStatus } from '../../courses/entity/course.entity';
import { EnrollmentEntity } from '../../enrollments/entity/enrollment.entity';

export enum PaymentRequestStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

export enum PaymentTransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentProvider {
  MOCK = 'MOCK',
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export type PaymentCourseEntity = {
  id: number;
  uuid: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  price: string;
  level: CourseLevel;
  status: CourseStatus;
  teacherId: number;
  createdAt: Date;
  updatedAt: Date;
};

const paymentRequestStatusMap: Record<string, PaymentRequestStatus | undefined> = {
  [PaymentRequestStatus.PENDING]: PaymentRequestStatus.PENDING,
  [PaymentRequestStatus.SUCCESS]: PaymentRequestStatus.SUCCESS,
  [PaymentRequestStatus.FAILED]: PaymentRequestStatus.FAILED,
  [PaymentRequestStatus.CANCELED]: PaymentRequestStatus.CANCELED,
};

const paymentTransactionStatusMap: Record<string, PaymentTransactionStatus | undefined> = {
  [PaymentTransactionStatus.SUCCESS]: PaymentTransactionStatus.SUCCESS,
  [PaymentTransactionStatus.FAILED]: PaymentTransactionStatus.FAILED,
};

const paymentProviderMap: Record<string, PaymentProvider | undefined> = {
  [PaymentProvider.MOCK]: PaymentProvider.MOCK,
};

@Entity('PaymentTransaction')
export class PaymentTransactionEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  paymentRequestId!: number;

  @Index()
  @Column({ type: 'int' })
  userId!: number;

  @Index()
  @Column({ type: 'int' })
  courseId!: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Column({ length: 10, default: 'IRT' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentTransactionStatus,
  })
  status!: PaymentTransactionStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.MOCK,
  })
  provider!: PaymentProvider;

  @Column({ nullable: true, length: 200 })
  providerAuthority!: string | null;

  @Column({ nullable: true, length: 200 })
  providerReferenceId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawRequest!: JsonValue | null;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse!: JsonValue | null;
}

@Entity('PaymentRequest')
export class PaymentRequestEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  userId!: number;

  @Index()
  @Column({ type: 'int' })
  courseId!: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount!: string;

  @Column({ length: 10, default: 'IRT' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: PaymentRequestStatus,
    default: PaymentRequestStatus.PENDING,
  })
  status!: PaymentRequestStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.MOCK,
  })
  provider!: PaymentProvider;

  @Column({ nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: JsonValue | null;

  course?: PaymentCourseEntity;

  transactions!: PaymentTransactionEntity[];
}

export type PurchaseCourseEntity = {
  message: string;
  alreadyEnrolled: boolean;
  payment: PaymentRequestEntity | null;
  enrollment: EnrollmentEntity;
};

type DecimalLike = { toString(): string };

type PaymentCoursePersistence = Omit<PaymentCourseEntity, 'price' | 'level' | 'status'> & {
  price: DecimalLike | string | number;
  level: string;
  status: string;
};

type PaymentTransactionPersistence = Omit<
  PaymentTransactionEntity,
  'amount' | 'status' | 'provider' | 'rawRequest' | 'rawResponse'
> & {
  amount: DecimalLike | string | number;
  status: string;
  provider: string;
  rawRequest?: unknown;
  rawResponse?: unknown;
};

type PaymentRequestPersistence = Omit<
  PaymentRequestEntity,
  'amount' | 'status' | 'provider' | 'metadata' | 'course' | 'transactions'
> & {
  amount: DecimalLike | string | number;
  status: string;
  provider: string;
  metadata?: unknown;
  course?: PaymentCoursePersistence | null;
  transactions?: PaymentTransactionPersistence[];
};

export function toPaymentRequestStatus(value: string): PaymentRequestStatus {
  const status = paymentRequestStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported payment request status: ${value}`);
  }

  return status;
}

export function toPaymentTransactionStatus(value: string): PaymentTransactionStatus {
  const status = paymentTransactionStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported payment transaction status: ${value}`);
  }

  return status;
}

export function toPaymentProvider(value: string): PaymentProvider {
  const provider = paymentProviderMap[value];
  if (!provider) {
    throw new Error(`Unsupported payment provider: ${value}`);
  }

  return provider;
}

export function toPaymentRequestEntity(payment: PaymentRequestPersistence): PaymentRequestEntity {
  return {
    id: payment.id,
    uuid: payment.uuid,
    userId: payment.userId,
    courseId: payment.courseId,
    amount: payment.amount?.toString?.() ?? String(payment.amount),
    currency: payment.currency,
    status: toPaymentRequestStatus(payment.status),
    provider: toPaymentProvider(payment.provider),
    description: payment.description,
    metadata: toNullableJsonValue(payment.metadata),
    course: payment.course ? toPaymentCourseEntity(payment.course) : undefined,
    transactions: payment.transactions?.map(toPaymentTransactionEntity) ?? [],
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export function toPaymentTransactionEntity(transaction: PaymentTransactionPersistence): PaymentTransactionEntity {
  return {
    id: transaction.id,
    uuid: transaction.uuid,
    paymentRequestId: transaction.paymentRequestId,
    userId: transaction.userId,
    courseId: transaction.courseId,
    amount: transaction.amount?.toString?.() ?? String(transaction.amount),
    currency: transaction.currency,
    status: toPaymentTransactionStatus(transaction.status),
    provider: toPaymentProvider(transaction.provider),
    providerAuthority: transaction.providerAuthority,
    providerReferenceId: transaction.providerReferenceId,
    rawRequest: toNullableJsonValue(transaction.rawRequest),
    rawResponse: toNullableJsonValue(transaction.rawResponse),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

function toPaymentCourseEntity(course: PaymentCoursePersistence): PaymentCourseEntity {
  return {
    id: course.id,
    uuid: course.uuid,
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    price: course.price?.toString?.() ?? String(course.price),
    level: toCourseLevel(course.level),
    status: toCourseStatus(course.status),
    teacherId: course.teacherId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function toNullableJsonValue(value: unknown): JsonValue | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!isJsonValue(value)) {
    throw new Error('Unsupported JSON value in payment persistence data');
  }

  return value;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) {
    return true;
  }

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (valueType === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonValue);
  }

  return false;
}
