import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JsonValue,
  PaymentProvider,
  PaymentRequestStatus,
  PaymentTransactionStatus,
} from '../../../modules/payments/entity/payment.entity';
import { CourseResponse } from './course.response';
import { EnrollmentResponse } from './enrollment.response';

export class PaymentTransactionResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  paymentRequestId: number;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: '250000.00', description: 'Decimal string.' })
  amount: string;

  @ApiProperty({ example: 'IRT' })
  currency: string;

  @ApiProperty({ enum: PaymentTransactionStatus, example: PaymentTransactionStatus.SUCCESS })
  status: PaymentTransactionStatus;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.MOCK })
  provider: PaymentProvider;

  @ApiPropertyOptional({ example: 'MOCK-AUTH-17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', nullable: true })
  providerAuthority: string | null;

  @ApiPropertyOptional({ example: 'MOCK-REF-17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', nullable: true })
  providerReferenceId: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  rawRequest: JsonValue | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  rawResponse: JsonValue | null;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}

export class PaymentRequestResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: '250000.00', description: 'Decimal string.' })
  amount: string;

  @ApiProperty({ example: 'IRT' })
  currency: string;

  @ApiProperty({ enum: PaymentRequestStatus, example: PaymentRequestStatus.SUCCESS })
  status: PaymentRequestStatus;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.MOCK })
  provider: PaymentProvider;

  @ApiPropertyOptional({ example: 'Mock payment for course NestJS Foundations', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata: JsonValue | null;

  @ApiPropertyOptional({ type: CourseResponse })
  course?: CourseResponse;

  @ApiProperty({ type: [PaymentTransactionResponse] })
  transactions: PaymentTransactionResponse[];

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}

export class PurchaseCourseResponse {
  @ApiProperty({ example: 'Course purchased successfully with mock payment' })
  message: string;

  @ApiProperty({ example: false })
  alreadyEnrolled: boolean;

  @ApiPropertyOptional({ type: PaymentRequestResponse, nullable: true })
  payment: PaymentRequestResponse | null;

  @ApiProperty({ type: EnrollmentResponse })
  enrollment: EnrollmentResponse;
}
