import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { PaymentRequestEntity, PurchaseCourseEntity } from '../entity/payment.entity';
import { PaymentRepository } from '../entity/payment.repository';
import { PurchaseCourseHandler } from '../handler/purchase-course.handler';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly purchaseCourseHandler: PurchaseCourseHandler,
  ) {}

  purchaseCourse(courseUuid: string, user: AuthUser): Promise<PurchaseCourseEntity> {
    return this.purchaseCourseHandler.execute(courseUuid, user);
  }

  findMine(user: AuthUser): Promise<PaymentRequestEntity[]> {
    return this.paymentRepository.findMine(user.id);
  }

  async findOne(uuid: string, user: AuthUser): Promise<PaymentRequestEntity> {
    const payment = await this.paymentRepository.findByUuid(uuid);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (!this.canViewPayment(payment, user)) {
      throw new ForbiddenException('You can view only your own payments');
    }

    return payment;
  }

  private canViewPayment(payment: PaymentRequestEntity, user: AuthUser): boolean {
    return payment.userId === user.id || user.roles.includes('ADMIN') || user.roles.includes('SUPPORT');
  }
}
