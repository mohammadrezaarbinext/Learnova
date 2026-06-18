import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { videoWithCourseInclude } from './video.entity';

@Injectable()
export class VideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUuid(uuid: string) {
    return this.prisma.video.findUnique({
      where: { uuid },
      include: videoWithCourseInclude,
    });
  }

  findByCourseUuid(courseUuid: string) {
    return this.prisma.video.findMany({
      where: { course: { uuid: courseUuid } },
      include: videoWithCourseInclude,
      orderBy: { orderIndex: 'asc' },
    });
  }

  create(data: Prisma.VideoCreateInput) {
    return this.prisma.video.create({
      data,
      include: videoWithCourseInclude,
    });
  }

  update(uuid: string, data: Prisma.VideoUpdateInput) {
    return this.prisma.video.update({
      where: { uuid },
      data,
      include: videoWithCourseInclude,
    });
  }

  delete(uuid: string) {
    return this.prisma.video.delete({ where: { uuid } });
  }

  findCourseByUuid(uuid: string) {
    return this.prisma.course.findUnique({
      where: { uuid },
      select: { id: true, uuid: true, teacherId: true },
    });
  }

  hasEnrollment(courseId: number, studentId: number) {
    return this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });
  }
}
