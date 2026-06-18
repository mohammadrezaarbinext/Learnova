import { Prisma } from '@prisma/client';

export const videoWithCourseInclude = Prisma.validator<Prisma.VideoInclude>()({
  course: {
    select: {
      id: true,
      uuid: true,
      teacherId: true,
    },
  },
});

export type VideoEntity = Prisma.VideoGetPayload<{ include: typeof videoWithCourseInclude }>;

export function serializeVideo(video: VideoEntity, canViewVideoUrl: boolean) {
  return {
    id: video.id,
    uuid: video.uuid,
    courseId: video.courseId,
    title: video.title,
    description: video.description,
    videoUrl: video.isFree || canViewVideoUrl ? video.videoUrl : null,
    durationSeconds: video.durationSeconds,
    orderIndex: video.orderIndex,
    isFree: video.isFree,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
