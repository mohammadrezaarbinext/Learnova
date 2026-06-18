import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';
import { AuthUser } from '../../../common/types/auth-user.type';
import { CreateCourseRequest } from '../../../gateway/http/request/courses/create-course.request';
import { ListCoursesRequest } from '../../../gateway/http/request/courses/list-courses.request';
import { UpdateCourseRequest } from '../../../gateway/http/request/courses/update-course.request';
import { canManageCourse, CourseEntity, CourseListEntity } from '../entity/course.entity';
import { CourseRepository } from '../entity/course.repository';

@Injectable()
export class CoursesService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async findAll(query: ListCoursesRequest) {
    const teacherId = query.teacherId
      ? (await this.courseRepository.findTeacherByUuid(query.teacherId))?.id
      : undefined;

    if (query.teacherId && !teacherId) {
      return [];
    }

    const courses = await this.courseRepository.findMany({
      search: query.search,
      level: query.level,
      status: query.status,
      teacherId,
    });

    return courses.map((course) => this.serializeCourse(course));
  }

  async findOne(uuid: string, user?: AuthUser) {
    const course = await this.getCourseOrThrow(uuid);
    return this.serializeCourse(course);
  }

  async create(dto: CreateCourseRequest, user: AuthUser) {
    if (!user.roles.includes('ADMIN') && !user.roles.includes('TEACHER')) {
      throw new ForbiddenException('Only TEACHER or ADMIN can create courses');
    }

    const explicitTeacher = dto.teacherId
      ? await this.courseRepository.findTeacherByUuid(dto.teacherId)
      : undefined;

    if (dto.teacherId && !explicitTeacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherId = user.roles.includes('ADMIN') && explicitTeacher ? explicitTeacher.id : user.id;

    const course = await this.courseRepository.create({
      title: dto.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      price: dto.price ?? '0',
      level: dto.level,
      status: dto.status ?? CourseStatus.DRAFT,
      teacher: { connect: { id: teacherId } },
    });

    return this.serializeCourse(course);
  }

  async update(uuid: string, dto: UpdateCourseRequest, user: AuthUser) {
    const course = await this.getCourseOrThrow(uuid);
    this.ensureCanManage(course.teacherId, user);

    const updatedCourse = await this.courseRepository.update(uuid, {
      title: dto.title,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      price: dto.price,
      level: dto.level,
      status: dto.status,
    });

    return this.serializeCourse(updatedCourse);
  }

  async remove(uuid: string, user: AuthUser) {
    const course = await this.getCourseOrThrow(uuid);
    this.ensureCanManage(course.teacherId, user);
    await this.courseRepository.delete(uuid);

    return { id: course.id, uuid: course.uuid, deleted: true };
  }

  async findTeaching(user: AuthUser) {
    const courses = await this.courseRepository.findOwnedByTeacher(user.id);
    return courses.map((course) => this.serializeCourse(course));
  }

  private async getCourseOrThrow(uuid: string) {
    const course = await this.courseRepository.findByUuid(uuid);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  private ensureCanManage(teacherId: number, user: AuthUser) {
    if (!canManageCourse(user, teacherId)) {
      throw new ForbiddenException('You can manage only your own courses');
    }
  }

  private serializeCourse(course: CourseEntity | CourseListEntity) {
    return {
      id: course.id,
      uuid: course.uuid,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price,
      level: course.level,
      status: course.status,
      teacherId: course.teacherId,
      teacher: course.teacher,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
