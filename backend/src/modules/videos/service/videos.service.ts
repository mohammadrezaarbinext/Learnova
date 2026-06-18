import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { CreateVideoRequest } from '../../../gateway/http/request/videos/create-video.request';
import { UpdateVideoRequest } from '../../../gateway/http/request/videos/update-video.request';
import { canManageCourse } from '../../courses/entity/course.entity';
import { serializeVideo, VideoEntity } from '../entity/video.entity';
import { VideoRepository } from '../entity/video.repository';

@Injectable()
export class VideosService {
  constructor(private readonly videoRepository: VideoRepository) {}

  async findByCourse(courseUuid: string, user: AuthUser) {
    const course = await this.getCourseOrThrow(courseUuid);
    const canViewPrivateVideos = await this.canViewPrivateVideos(course.id, course.teacherId, user);
    const videos = await this.videoRepository.findByCourseUuid(courseUuid);

    return videos.map((video) => serializeVideo(video, canViewPrivateVideos));
  }

  async create(courseUuid: string, dto: CreateVideoRequest, user: AuthUser) {
    const course = await this.getCourseOrThrow(courseUuid);
    this.ensureCanManage(course.teacherId, user);

    const video = await this.videoRepository.create({
      title: dto.title,
      description: dto.description,
      videoUrl: dto.videoUrl,
      durationSeconds: dto.durationSeconds ?? 0,
      orderIndex: dto.orderIndex,
      isFree: dto.isFree ?? false,
      course: { connect: { id: course.id } },
    });

    return serializeVideo(video, true);
  }

  async update(uuid: string, dto: UpdateVideoRequest, user: AuthUser) {
    const video = await this.getVideoOrThrow(uuid);
    this.ensureCanManage(video.course.teacherId, user);

    const updatedVideo = await this.videoRepository.update(uuid, {
      title: dto.title,
      description: dto.description,
      videoUrl: dto.videoUrl,
      durationSeconds: dto.durationSeconds,
      orderIndex: dto.orderIndex,
      isFree: dto.isFree,
    });

    return serializeVideo(updatedVideo, true);
  }

  async remove(uuid: string, user: AuthUser) {
    const video = await this.getVideoOrThrow(uuid);
    this.ensureCanManage(video.course.teacherId, user);
    await this.videoRepository.delete(uuid);

    return { id: video.id, uuid: video.uuid, deleted: true };
  }

  private async getVideoOrThrow(uuid: string): Promise<VideoEntity> {
    const video = await this.videoRepository.findByUuid(uuid);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  private async getCourseOrThrow(uuid: string) {
    const course = await this.videoRepository.findCourseByUuid(uuid);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  private ensureCanManage(teacherId: number, user: AuthUser) {
    if (!canManageCourse(user, teacherId)) {
      throw new ForbiddenException('You can manage only your own course videos');
    }
  }

  private async canViewPrivateVideos(courseId: number, teacherId: number, user: AuthUser) {
    if (user.roles.includes('ADMIN') || user.id === teacherId) {
      return true;
    }

    return Boolean(await this.videoRepository.hasEnrollment(courseId, user.id));
  }
}
