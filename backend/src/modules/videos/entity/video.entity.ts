import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

export type VideoCourseEntity = {
  id: number;
  uuid: string;
  teacherId: number;
};

@Entity('Video')
export class VideoEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  courseId!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description!: string | null;

  @Column({ length: 500 })
  videoUrl!: string;

  @Column({ type: 'int', default: 0 })
  durationSeconds!: number;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column({ type: 'boolean', default: false })
  isFree!: boolean;

  course!: VideoCourseEntity;
}

export type VideoResponseEntity = Omit<VideoEntity, 'course' | 'videoUrl'> & {
  videoUrl: string | null;
};

export type DeleteVideoEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

export function serializeVideo(video: VideoEntity, canViewVideoUrl: boolean): VideoResponseEntity {
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

export function toVideoEntity(video: VideoEntity): VideoEntity {
  return {
    id: video.id,
    uuid: video.uuid,
    courseId: video.courseId,
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl,
    durationSeconds: video.durationSeconds,
    orderIndex: video.orderIndex,
    isFree: video.isFree,
    course: video.course,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
