import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { PaymentRepository } from '../entity/payment.repository';
import { PurchaseCourseEntity } from '../entity/payment.entity';

@Injectable()
export class PurchaseCourseHandler {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(courseUuid: string, user: AuthUser): Promise<PurchaseCourseEntity> {
    const result = await this.paymentRepository.purchaseCourse(courseUuid, user.id);

    if (result.type === 'COURSE_NOT_FOUND') {
      throw new NotFoundException('Course not found');
    }

    if (result.type === 'ALREADY_ENROLLED') {
      return {
        message: 'User is already enrolled in this course',
        alreadyEnrolled: true,
        payment: result.payment,
        enrollment: result.enrollment,
      };
    }

    return {
      message: 'Course purchased successfully with mock payment',
      alreadyEnrolled: false,
      payment: result.payment,
      enrollment: result.enrollment,
    };
  }
}
