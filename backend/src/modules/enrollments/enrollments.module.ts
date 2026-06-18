import { Module } from '@nestjs/common';
import { EnrollmentRepository } from './entity/enrollment.repository';
import { EnrollmentsService } from './service/enrollments.service';

@Module({
  providers: [EnrollmentRepository, EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
