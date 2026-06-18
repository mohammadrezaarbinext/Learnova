import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { serializeEnrollment } from '../../enrollments/entity/enrollment.entity';
import {
  PaymentProvider,
  PaymentRequestEntity,
  PaymentRequestStatus,
  PaymentTransactionStatus,
  toPaymentRequestEntity,
} from './payment.entity';

export type PurchaseCourseRepositoryResult =
  | { type: 'COURSE_NOT_FOUND' }
  | {
      type: 'ALREADY_ENROLLED';
      enrollment: ReturnType<typeof serializeEnrollment>;
      payment: PaymentRequestEntity | null;
    }
  | {
      type: 'PURCHASED';
      enrollment: ReturnType<typeof serializeEnrollment>;
      payment: PaymentRequestEntity;
    };

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: number): Promise<PaymentRequestEntity[]> {
    return this.prisma.paymentRequest.findMany({
      where: { userId },
      include: paymentRequestInclude,
      orderBy: { createdAt: 'desc' },
    }).then((payments) => payments.map(toPaymentRequestEntity));
  }

  findByUuid(uuid: string): Promise<PaymentRequestEntity | null> {
    return this.prisma.paymentRequest.findUnique({
      where: { uuid },
      include: paymentRequestInclude,
    }).then((payment) => (payment ? toPaymentRequestEntity(payment) : null));
  }

  purchaseCourse(courseUuid: string, userId: number): Promise<PurchaseCourseRepositoryResult> {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { uuid: courseUuid },
        select: {
          id: true,
          uuid: true,
          title: true,
          price: true,
        },
      });

      if (!course) {
        return { type: 'COURSE_NOT_FOUND' };
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId: userId, courseId: course.id } },
        include: enrollmentWithCourseInclude,
      });

      if (existingEnrollment) {
        const existingPayment = await tx.paymentRequest.findFirst({
          where: { userId, courseId: course.id },
          include: paymentRequestInclude,
          orderBy: { createdAt: 'desc' },
        });

        return {
          type: 'ALREADY_ENROLLED',
          enrollment: serializeEnrollment(existingEnrollment),
          payment: existingPayment ? toPaymentRequestEntity(existingPayment) : null,
        };
      }

      const amount = course.price;
      const amountAsString = amount.toString();
      const metadata: Prisma.InputJsonObject = {
        mode: 'mock',
        courseUuid: course.uuid,
        courseTitle: course.title,
      };

      const paymentRequest = await tx.paymentRequest.create({
        data: {
          user: { connect: { id: userId } },
          course: { connect: { id: course.id } },
          amount,
          currency: 'IRT',
          status: PaymentRequestStatus.PENDING,
          provider: PaymentProvider.MOCK,
          description: `Mock payment for course ${course.title}`,
          metadata,
        },
      });

      const providerAuthority = `MOCK-AUTH-${paymentRequest.uuid}`;
      const providerReferenceId = `MOCK-REF-${paymentRequest.uuid}`;

      // TODO: Replace this immediate mock success with a real payment gateway request and verification callback.
      await tx.paymentTransaction.create({
        data: {
          paymentRequest: { connect: { id: paymentRequest.id } },
          user: { connect: { id: userId } },
          course: { connect: { id: course.id } },
          amount,
          currency: paymentRequest.currency,
          status: PaymentTransactionStatus.SUCCESS,
          provider: PaymentProvider.MOCK,
          providerAuthority,
          providerReferenceId,
          rawRequest: {
            provider: PaymentProvider.MOCK,
            authority: providerAuthority,
            amount: amountAsString,
            currency: paymentRequest.currency,
          },
          rawResponse: {
            provider: PaymentProvider.MOCK,
            referenceId: providerReferenceId,
            status: PaymentTransactionStatus.SUCCESS,
            paid: true,
          },
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          student: { connect: { id: userId } },
          course: { connect: { id: course.id } },
        },
        include: enrollmentWithCourseInclude,
      });

      const completedPayment = await tx.paymentRequest.update({
        where: { id: paymentRequest.id },
        data: { status: PaymentRequestStatus.SUCCESS },
        include: paymentRequestInclude,
      });

      return {
        type: 'PURCHASED',
        enrollment: serializeEnrollment(enrollment),
        payment: toPaymentRequestEntity(completedPayment),
      };
    });
  }
}

const paymentCourseSelect = {
  id: true,
  uuid: true,
  title: true,
  description: true,
  thumbnailUrl: true,
  price: true,
  level: true,
  status: true,
  teacherId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CourseSelect;

const paymentRequestInclude = {
  course: {
    select: paymentCourseSelect,
  },
  transactions: {
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.PaymentRequestInclude;

const enrollmentWithCourseInclude = {
  course: {
    select: paymentCourseSelect,
  },
} satisfies Prisma.EnrollmentInclude;
