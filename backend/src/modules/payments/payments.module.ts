import { Module } from '@nestjs/common';
import { PaymentRepository } from './entity/payment.repository';
import { PurchaseCourseHandler } from './handler/purchase-course.handler';
import { PaymentsService } from './service/payments.service';

@Module({
  providers: [PaymentRepository, PurchaseCourseHandler, PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
