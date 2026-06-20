import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { toQuestionEntity } from '../../questions/entity/question.entity';
import { QuizCourseEntity, QuizEntity, toQuizEntity } from './quiz.entity';

export type QuizCreateData = {
  courseId: number;
  title: string;
  description?: string;
  durationMinutes: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  status: string;
};

export type QuizUpdateData = {
  title?: string;
  description?: string | null;
  durationMinutes?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  status?: string;
};

@Injectable()
export class QuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCourseByUuid(uuid: string): Promise<QuizCourseEntity | null> {
    return this.prisma.course.findUnique({
      where: { uuid },
      select: quizCourseSelect,
    });
  }

  findByCourseUuid(courseUuid: string): Promise<QuizEntity[]> {
    return this.prisma.quiz.findMany({
      where: { course: { uuid: courseUuid } },
      include: quizWithCourseInclude,
      orderBy: { createdAt: 'desc' },
    }).then((quizzes) => quizzes.map((quiz) => toQuizEntity(quiz)));
  }

  findByUuid(uuid: string, includeQuestions = false): Promise<QuizEntity | null> {
    return this.prisma.quiz.findUnique({
      where: { uuid },
      include: includeQuestions ? quizDetailInclude : quizWithCourseInclude,
    }).then((quiz) => {
      if (!quiz) {
        return null;
      }

      const questions = 'questions' in quiz && Array.isArray(quiz.questions) ? quiz.questions.map(toQuestionEntity) : undefined;

      return toQuizEntity({
        ...quiz,
        questions,
      });
    });
  }

  create(data: QuizCreateData): Promise<QuizEntity> {
    return this.prisma.quiz.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: data.status as never,
      },
      include: quizWithCourseInclude,
    }).then(toQuizEntity);
  }

  update(uuid: string, data: QuizUpdateData): Promise<QuizEntity> {
    return this.prisma.quiz.update({
      where: { uuid },
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: data.status as never,
      },
      include: quizWithCourseInclude,
    }).then(toQuizEntity);
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.quiz.delete({ where: { uuid } });
  }

  async hasEnrollment(courseId: number, studentId: number): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });

    return Boolean(enrollment);
  }
}

const quizCourseSelect = {
  id: true,
  uuid: true,
  teacherId: true,
  title: true,
} satisfies Prisma.CourseSelect;

const quizWithCourseInclude = {
  course: {
    select: quizCourseSelect,
  },
} satisfies Prisma.QuizInclude;

const quizDetailInclude = {
  ...quizWithCourseInclude,
  questions: {
    include: {
      options: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { orderIndex: 'asc' },
  },
} satisfies Prisma.QuizInclude;
