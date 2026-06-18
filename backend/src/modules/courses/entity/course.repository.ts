import { Injectable } from '@nestjs/common';
import { CourseLevel, CourseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { courseDetailInclude, courseWithTeacherInclude } from './course.entity';

export type CourseListFilters = {
  search?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  teacherId?: number;
};

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: CourseListFilters) {
    return this.prisma.course.findMany({
      where: {
        status: filters.status ?? CourseStatus.PUBLISHED,
        level: filters.level,
        teacherId: filters.teacherId,
        ...(filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: courseWithTeacherInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUuid(uuid: string) {
    return this.prisma.course.findUnique({
      where: { uuid },
      include: courseDetailInclude,
    });
  }

  findOwnedByTeacher(teacherId: number) {
    return this.prisma.course.findMany({
      where: { teacherId },
      include: courseWithTeacherInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.CourseCreateInput) {
    return this.prisma.course.create({
      data,
      include: courseDetailInclude,
    });
  }

  update(uuid: string, data: Prisma.CourseUpdateInput) {
    return this.prisma.course.update({
      where: { uuid },
      data,
      include: courseDetailInclude,
    });
  }

  delete(uuid: string) {
    return this.prisma.course.delete({ where: { uuid } });
  }

  hasEnrollment(courseId: number, studentId: number) {
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });
  }

  findTeacherByUuid(uuid: string) {
    return this.prisma.user.findUnique({ where: { uuid }, select: { id: true } });
  }
}
