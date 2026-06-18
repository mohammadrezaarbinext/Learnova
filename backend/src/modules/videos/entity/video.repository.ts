import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { toVideoEntity, VideoCourseEntity, VideoEntity } from './video.entity';

export type VideoCreateData = {
  courseId: number;
  title: string;
  description?: string;
  videoUrl: string;
  durationSeconds: number;
  orderIndex: number;
  isFree: boolean;
};

export type VideoUpdateData = {
  title?: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  orderIndex?: number;
  isFree?: boolean;
};

@Injectable()
export class VideoRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUuid(uuid: string): Promise<VideoEntity | null> {
    return this.prisma.video.findUnique({
      where: { uuid },
      include: videoWithCourseInclude,
    }).then((video) => (video ? toVideoEntity(video) : null));
  }

  findByCourseUuid(courseUuid: string): Promise<VideoEntity[]> {
    return this.prisma.video.findMany({
      where: { course: { uuid: courseUuid } },
      include: videoWithCourseInclude,
      orderBy: { orderIndex: 'asc' },
    }).then((videos) => videos.map(toVideoEntity));
  }

  create(data: VideoCreateData): Promise<VideoEntity> {
    return this.prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        durationSeconds: data.durationSeconds,
        orderIndex: data.orderIndex,
        isFree: data.isFree,
        course: { connect: { id: data.courseId } },
      },
      include: videoWithCourseInclude,
    }).then(toVideoEntity);
  }

  update(uuid: string, data: VideoUpdateData): Promise<VideoEntity> {
    return this.prisma.video.update({
      where: { uuid },
      data,
      include: videoWithCourseInclude,
    }).then(toVideoEntity);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.video.delete({ where: { uuid } });
  }

  findCourseByUuid(uuid: string): Promise<VideoCourseEntity | null> {
    return this.prisma.course.findUnique({
      where: { uuid },
      select: { id: true, uuid: true, teacherId: true },
    });
  }

  async hasEnrollment(courseId: number, studentId: number): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });

    return Boolean(enrollment);
  }
}

const videoWithCourseInclude = {
  course: {
    select: {
      id: true,
      uuid: true,
      teacherId: true,
    },
  },
} satisfies Prisma.VideoInclude;
