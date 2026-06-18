import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { EnrollmentCourseEntity, EnrollmentEntity, serializeEnrollment } from './enrollment.entity';

export type EnrollmentCourseLookup = Pick<EnrollmentCourseEntity, 'id' | 'uuid' | 'price' | 'teacherId'>;

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCourseByUuid(uuid: string): Promise<EnrollmentCourseLookup | null> {
    const course = await this.prisma.course.findUnique({
      where: { uuid },
      select: { id: true, uuid: true, price: true, teacherId: true },
    });

    return course ? { ...course, price: course.price.toString() } : null;
  }

  findByStudentAndCourse(studentId: number, courseId: number): Promise<EnrollmentEntity | null> {
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: enrollmentWithCourseInclude,
    }).then((enrollment) => (enrollment ? serializeEnrollment(enrollment) : null));
  }

  create(studentId: number, courseId: number): Promise<EnrollmentEntity> {
    return this.prisma.enrollment.create({
      data: {
        student: { connect: { id: studentId } },
        course: { connect: { id: courseId } },
      },
      include: enrollmentWithCourseInclude,
    }).then(serializeEnrollment);
  }

  findMine(studentId: number): Promise<EnrollmentEntity[]> {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: enrollmentWithCourseInclude,
      orderBy: { createdAt: 'desc' },
    }).then((enrollments) => enrollments.map(serializeEnrollment));
  }

  findByCourse(courseId: number): Promise<EnrollmentEntity[]> {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: enrollmentWithCourseInclude,
      orderBy: { createdAt: 'desc' },
    }).then((enrollments) => enrollments.map(serializeEnrollment));
  }

  findByUuid(uuid: string): Promise<EnrollmentEntity | null> {
    return this.prisma.enrollment.findUnique({
      where: { uuid },
      include: enrollmentWithCourseInclude,
    }).then((enrollment) => (enrollment ? serializeEnrollment(enrollment) : null));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.enrollment.delete({ where: { uuid } });
  }
}

const enrollmentWithCourseInclude = {
  course: {
    select: {
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
    },
  },
} satisfies Prisma.EnrollmentInclude;
