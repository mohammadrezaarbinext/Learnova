import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { QuizCourseEntity } from '../../quizzes/entity/quiz.entity';
import { JsonValue, QuestionContentType, QuestionEntity, QuestionType, toQuestionEntity } from './question.entity';

export type QuestionOptionInput = {
  contentType: QuestionContentType;
  content: JsonValue;
  imageUrl?: string | null;
  orderIndex: number;
  isCorrect: boolean;
};

export type QuestionCreateData = {
  quizId: number;
  type: QuestionType;
  contentType: QuestionContentType;
  content: JsonValue;
  imageUrl?: string | null;
  points: string;
  orderIndex: number;
  answerKey?: JsonValue | null;
  options: QuestionOptionInput[];
};

export type QuestionUpdateData = Partial<Omit<QuestionCreateData, 'quizId'>> & {
  options?: QuestionOptionInput[];
};

export type QuestionQuizLookup = {
  id: number;
  uuid: string;
  courseId: number;
  course: QuizCourseEntity;
};

@Injectable()
export class QuestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findQuizByUuid(uuid: string): Promise<QuestionQuizLookup | null> {
    return this.prisma.quiz.findUnique({
      where: { uuid },
      select: questionQuizSelect,
    });
  }

  findByUuid(uuid: string): Promise<QuestionEntity | null> {
    return this.prisma.question.findUnique({
      where: { uuid },
      include: questionWithOptionsInclude,
    }).then((question) => (question ? toQuestionEntity(question) : null));
  }

  findQuizByQuestionUuid(uuid: string): Promise<QuestionQuizLookup | null> {
    return this.prisma.question.findUnique({
      where: { uuid },
      select: {
        quiz: {
          select: questionQuizSelect,
        },
      },
    }).then((question) => question?.quiz ?? null);
  }

  create(data: QuestionCreateData): Promise<QuestionEntity> {
    return this.prisma.question.create({
      data: {
        quizId: data.quizId,
        type: data.type,
        contentType: data.contentType,
        content: data.content as Prisma.InputJsonValue,
        imageUrl: data.imageUrl,
        points: data.points,
        orderIndex: data.orderIndex,
        answerKey: data.answerKey === null || data.answerKey === undefined ? undefined : (data.answerKey as Prisma.InputJsonValue),
        options: {
          create: data.options.map((option) => ({
            contentType: option.contentType,
            content: option.content as Prisma.InputJsonValue,
            imageUrl: option.imageUrl,
            orderIndex: option.orderIndex,
            isCorrect: option.isCorrect,
          })),
        },
      },
      include: questionWithOptionsInclude,
    }).then(toQuestionEntity);
  }

  update(uuid: string, data: QuestionUpdateData): Promise<QuestionEntity> {
    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { uuid },
        data: {
          type: data.type,
          contentType: data.contentType,
          content: data.content === undefined ? undefined : (data.content as Prisma.InputJsonValue),
          imageUrl: data.imageUrl,
          points: data.points,
          orderIndex: data.orderIndex,
          answerKey: data.answerKey === undefined ? undefined : data.answerKey === null ? Prisma.JsonNull : (data.answerKey as Prisma.InputJsonValue),
        },
      });

      if (data.options) {
        const question = await tx.question.findUniqueOrThrow({ where: { uuid }, select: { id: true } });
        await tx.questionOption.deleteMany({ where: { questionId: question.id } });
        await tx.questionOption.createMany({
          data: data.options.map((option) => ({
            questionId: question.id,
            contentType: option.contentType,
            content: option.content as Prisma.InputJsonValue,
            imageUrl: option.imageUrl,
            orderIndex: option.orderIndex,
            isCorrect: option.isCorrect,
          })),
        });
      }

      const updated = await tx.question.findUniqueOrThrow({
        where: { uuid },
        include: questionWithOptionsInclude,
      });

      return toQuestionEntity(updated);
    });
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.question.delete({ where: { uuid } });
  }
}

const questionQuizSelect = {
  id: true,
  uuid: true,
  courseId: true,
  course: {
    select: {
      id: true,
      uuid: true,
      teacherId: true,
      title: true,
    },
  },
} satisfies Prisma.QuizSelect;

const questionWithOptionsInclude = {
  options: {
    orderBy: { orderIndex: 'asc' },
  },
} satisfies Prisma.QuestionInclude;
