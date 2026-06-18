import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { serializeEnrollment } from '../entity/enrollment.entity';
import { EnrollmentRepository } from '../entity/enrollment.repository';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async enroll(courseUuid: string, user: AuthUser) {
    const course = await this.getCourseOrThrow(courseUuid);
    const existingEnrollment = await this.enrollmentRepository.findByStudentAndCourse(user.id, course.id);
    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this course');
    }

    // TODO: Validate payment before enrolling in paid courses when payments are implemented.
    const enrollment = await this.enrollmentRepository.create(user.id, course.id);
    return serializeEnrollment(enrollment);
  }

  async findMine(user: AuthUser) {
    const enrollments = await this.enrollmentRepository.findMine(user.id);
    return enrollments.map(serializeEnrollment);
  }

  async findByCourse(courseUuid: string, user: AuthUser) {
    const course = await this.getCourseOrThrow(courseUuid);
    if (!user.roles.includes('ADMIN') && !user.roles.includes('SUPPORT') && course.teacherId !== user.id) {
      throw new ForbiddenException('You can view enrollments only for your own courses');
    }

    const enrollments = await this.enrollmentRepository.findByCourse(course.id);
    return enrollments.map(serializeEnrollment);
  }

  async remove(uuid: string, user: AuthUser) {
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Only ADMIN can delete enrollments');
    }

    const enrollment = await this.enrollmentRepository.findByUuid(uuid);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.enrollmentRepository.delete(uuid);
    return { id: enrollment.id, uuid: enrollment.uuid, deleted: true };
  }

  private async getCourseOrThrow(uuid: string) {
    const course = await this.enrollmentRepository.findCourseByUuid(uuid);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }
}
