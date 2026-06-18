import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { enrollmentWithCourseInclude } from './enrollment.entity';

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCourseByUuid(uuid: string) {
    return this.prisma.course.findUnique({
      where: { uuid },
      select: { id: true, uuid: true, price: true, teacherId: true },
    });
  }

  findByStudentAndCourse(studentId: number, courseId: number) {
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      include: enrollmentWithCourseInclude,
    });
  }

  create(studentId: number, courseId: number) {
    return this.prisma.enrollment.create({
      data: {
        student: { connect: { id: studentId } },
        course: { connect: { id: courseId } },
      },
      include: enrollmentWithCourseInclude,
    });
  }

  findMine(studentId: number) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: enrollmentWithCourseInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByCourse(courseId: number) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: enrollmentWithCourseInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUuid(uuid: string) {
    return this.prisma.enrollment.findUnique({
      where: { uuid },
      include: enrollmentWithCourseInclude,
    });
  }

  delete(uuid: string) {
    return this.prisma.enrollment.delete({ where: { uuid } });
  }
}
