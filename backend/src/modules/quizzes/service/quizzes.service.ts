import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { CreateQuizRequest } from '../../../gateway/http/request/quizzes/create-quiz.request';
import { UpdateQuizRequest } from '../../../gateway/http/request/quizzes/update-quiz.request';
import { canManageCourse } from '../../courses/entity/course.entity';
import { DeleteQuizEntity, QuizCourseEntity, QuizEntity, QuizResponseEntity, QuizStatus, serializeQuiz } from '../entity/quiz.entity';
import { QuizRepository } from '../entity/quiz.repository';

@Injectable()
export class QuizzesService {
  constructor(private readonly quizRepository: QuizRepository) {}

  async findByCourse(courseUuid: string, user: AuthUser): Promise<QuizResponseEntity[]> {
    const course = await this.getCourseOrThrow(courseUuid);
    await this.ensureCanReadCourseQuizzes(course, user);

    const quizzes = await this.quizRepository.findByCourseUuid(courseUuid);
    return quizzes
      .filter((quiz) => this.canSeeQuizStatus(quiz, user, course.teacherId))
      .map((quiz) => serializeQuiz(quiz, this.canSeeCorrectAnswers(course.teacherId, user)));
  }

  async create(courseUuid: string, dto: CreateQuizRequest, user: AuthUser): Promise<QuizResponseEntity> {
    const course = await this.getCourseOrThrow(courseUuid);
    this.ensureCanManage(course.teacherId, user);

    const quiz = await this.quizRepository.create({
      courseId: course.id,
      title: dto.title,
      description: dto.description,
      durationMinutes: dto.durationMinutes ?? 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      status: dto.status ?? QuizStatus.DRAFT,
    });

    return serializeQuiz(quiz, true);
  }

  async findOne(uuid: string, user: AuthUser): Promise<QuizResponseEntity> {
    const quiz = await this.getQuizOrThrow(uuid, true);
    if (!quiz.course) {
      throw new NotFoundException('Quiz course not found');
    }

    await this.ensureCanReadCourseQuizzes(quiz.course, user);
    if (!this.canSeeQuizStatus(quiz, user, quiz.course.teacherId)) {
      throw new ForbiddenException('You cannot view this quiz');
    }

    return serializeQuiz(quiz, this.canSeeCorrectAnswers(quiz.course.teacherId, user));
  }

  async update(uuid: string, dto: UpdateQuizRequest, user: AuthUser): Promise<QuizResponseEntity> {
    const quiz = await this.getQuizOrThrow(uuid);
    if (!quiz.course) {
      throw new NotFoundException('Quiz course not found');
    }

    this.ensureCanManage(quiz.course.teacherId, user);
    const updated = await this.quizRepository.update(uuid, {
      title: dto.title,
      description: dto.description,
      durationMinutes: dto.durationMinutes,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      status: dto.status,
    });

    return serializeQuiz(updated, true);
  }

  async remove(uuid: string, user: AuthUser): Promise<DeleteQuizEntity> {
    const quiz = await this.getQuizOrThrow(uuid);
    if (!quiz.course) {
      throw new NotFoundException('Quiz course not found');
    }

    this.ensureCanManage(quiz.course.teacherId, user);
    await this.quizRepository.delete(uuid);

    return { id: quiz.id, uuid: quiz.uuid, deleted: true };
  }

  private async getCourseOrThrow(uuid: string): Promise<QuizCourseEntity> {
    const course = await this.quizRepository.findCourseByUuid(uuid);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  private async getQuizOrThrow(uuid: string, includeQuestions = false): Promise<QuizEntity> {
    const quiz = await this.quizRepository.findByUuid(uuid, includeQuestions);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async ensureCanReadCourseQuizzes(course: QuizCourseEntity, user: AuthUser): Promise<void> {
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPPORT') || course.teacherId === user.id) {
      return;
    }

    if (await this.quizRepository.hasEnrollment(course.id, user.id)) {
      return;
    }

    throw new ForbiddenException('You can view quizzes only for enrolled courses');
  }

  private ensureCanManage(teacherId: number, user: AuthUser): void {
    if (!canManageCourse(user, teacherId)) {
      throw new ForbiddenException('You can manage only your own course quizzes');
    }
  }

  private canSeeQuizStatus(quiz: QuizEntity, user: AuthUser, teacherId: number): boolean {
    return quiz.status === QuizStatus.PUBLISHED || user.roles.includes('ADMIN') || user.roles.includes('SUPPORT') || user.id === teacherId;
  }

  private canSeeCorrectAnswers(teacherId: number, user: AuthUser): boolean {
    return user.roles.includes('ADMIN') || (user.roles.includes('TEACHER') && user.id === teacherId);
  }
}
