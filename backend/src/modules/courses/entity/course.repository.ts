import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CourseEntity, CourseLevel, CourseListEntity, CourseStatus, toCourseEntity } from './course.entity';

export type CourseListFilters = {
  search?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  teacherId?: number;
};

export type CourseCreateData = {
  title: string;
  description: string;
  thumbnailUrl?: string;
  price: string;
  level: CourseLevel;
  status: CourseStatus;
  teacherId: number;
};

export type CourseUpdateData = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  price?: string;
  level?: CourseLevel;
  status?: CourseStatus;
};

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: CourseListFilters): Promise<CourseListEntity[]> {
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
    }).then((courses) => courses.map(toCourseEntity));
  }

  findByUuid(uuid: string): Promise<CourseEntity | null> {
    return this.prisma.course.findUnique({
      where: { uuid },
      include: courseDetailInclude,
    }).then((course) => (course ? toCourseEntity(course) : null));
  }

  findOwnedByTeacher(teacherId: number): Promise<CourseListEntity[]> {
    return this.prisma.course.findMany({
      where: { teacherId },
      include: courseWithTeacherInclude,
      orderBy: { createdAt: 'desc' },
    }).then((courses) => courses.map(toCourseEntity));
  }

  create(data: CourseCreateData): Promise<CourseEntity> {
    return this.prisma.course.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        price: data.price,
        level: data.level,
        status: data.status,
        teacher: { connect: { id: data.teacherId } },
      },
      include: courseDetailInclude,
    }).then(toCourseEntity);
  }

  update(uuid: string, data: CourseUpdateData): Promise<CourseEntity> {
    return this.prisma.course.update({
      where: { uuid },
      data,
      include: courseDetailInclude,
    }).then(toCourseEntity);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.course.delete({ where: { uuid } });
  }

  async hasEnrollment(courseId: number, studentId: number): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });

    return Boolean(enrollment);
  }

  findTeacherByUuid(uuid: string): Promise<{ id: number } | null> {
    return this.prisma.user.findUnique({ where: { uuid }, select: { id: true } });
  }
}

const courseTeacherSelect = {
  id: true,
  uuid: true,
  fullName: true,
  phone: true,
  email: true,
} satisfies Prisma.UserSelect;

const courseDetailInclude = {
  teacher: {
    select: courseTeacherSelect,
  },
} satisfies Prisma.CourseInclude;

const courseWithTeacherInclude = courseDetailInclude;
