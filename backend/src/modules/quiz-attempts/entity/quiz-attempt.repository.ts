import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { JsonValue, QuestionContentType, QuestionEntity, toQuestionEntity } from '../../questions/entity/question.entity';
import {
  QuestionAnswerEntity,
  QuizAttemptEntity,
  QuizAttemptStatus,
  toQuestionAnswerEntity,
  toQuizAttemptEntity,
} from './quiz-attempt.entity';

export type AttemptQuizLookup = {
  id: number;
  uuid: string;
  courseId: number;
  title: string;
  durationMinutes: number;
  startsAt: Date | null;
  endsAt: Date | null;
  status: string;
  course: {
    id: number;
    uuid: string;
    teacherId: number;
    title: string;
  };
};

export type AnswerSaveData = {
  attemptId: number;
  questionId: number;
  selectedOptionId?: number | null;
  answerContentType?: QuestionContentType | null;
  answerContent?: JsonValue | null;
  answerImageUrl?: string | null;
};

@Injectable()
export class QuizAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  findQuizByUuid(uuid: string): Promise<AttemptQuizLookup | null> {
    return this.prisma.quiz.findUnique({
      where: { uuid },
      select: attemptQuizSelect,
    });
  }

  async hasEnrollment(courseId: number, studentId: number): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
      select: { id: true },
    });

    return Boolean(enrollment);
  }

  findInProgress(quizId: number, studentId: number): Promise<QuizAttemptEntity | null> {
    return this.prisma.quizAttempt.findFirst({
      where: { quizId, studentId, status: QuizAttemptStatus.IN_PROGRESS },
      include: attemptInclude,
      orderBy: { createdAt: 'desc' },
    }).then((attempt) => (attempt ? toQuizAttemptEntity(attempt) : null));
  }

  createAttempt(quizId: number, studentId: number): Promise<QuizAttemptEntity> {
    return this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        status: QuizAttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      include: attemptInclude,
    }).then(toQuizAttemptEntity);
  }

  findAttemptByUuid(uuid: string): Promise<QuizAttemptEntity | null> {
    return this.prisma.quizAttempt.findUnique({
      where: { uuid },
      include: attemptInclude,
    }).then((attempt) => (attempt ? toQuizAttemptEntity(attempt) : null));
  }

  findAttemptById(id: number): Promise<QuizAttemptEntity | null> {
    return this.prisma.quizAttempt.findUnique({
      where: { id },
      include: attemptInclude,
    }).then((attempt) => (attempt ? toQuizAttemptEntity(attempt) : null));
  }

  findMine(studentId: number): Promise<QuizAttemptEntity[]> {
    return this.prisma.quizAttempt.findMany({
      where: { studentId },
      include: attemptInclude,
      orderBy: { createdAt: 'desc' },
    }).then((attempts) => attempts.map(toQuizAttemptEntity));
  }

  findByQuizUuid(quizUuid: string): Promise<QuizAttemptEntity[]> {
    return this.prisma.quizAttempt.findMany({
      where: { quiz: { uuid: quizUuid } },
      include: attemptInclude,
      orderBy: { createdAt: 'desc' },
    }).then((attempts) => attempts.map(toQuizAttemptEntity));
  }

  findQuestionByUuid(uuid: string): Promise<QuestionEntity | null> {
    return this.prisma.question.findUnique({
      where: { uuid },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    }).then((question) => (question ? toQuestionEntity(question) : null));
  }

  findOptionByUuid(uuid: string): Promise<{ id: number; uuid: string; questionId: number; isCorrect: boolean } | null> {
    return this.prisma.questionOption.findUnique({
      where: { uuid },
      select: {
        id: true,
        uuid: true,
        questionId: true,
        isCorrect: true,
      },
    });
  }

  saveAnswer(data: AnswerSaveData): Promise<QuestionAnswerEntity> {
    return this.prisma.questionAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      update: {
        selectedOptionId: data.selectedOptionId,
        answerContentType: data.answerContentType,
        answerContent: data.answerContent === undefined ? undefined : data.answerContent === null ? Prisma.DbNull : (data.answerContent as Prisma.InputJsonValue),
        answerImageUrl: data.answerImageUrl,
        score: null,
        isCorrect: null,
        gradedAt: null,
      },
      create: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        selectedOptionId: data.selectedOptionId,
        answerContentType: data.answerContentType,
        answerContent: data.answerContent === undefined || data.answerContent === null ? undefined : (data.answerContent as Prisma.InputJsonValue),
        answerImageUrl: data.answerImageUrl,
      },
    }).then(toQuestionAnswerEntity);
  }

  updateAttempt(uuid: string, data: { status?: QuizAttemptStatus; submittedAt?: Date | null; score?: string | null }) {
    return this.prisma.quizAttempt.update({
      where: { uuid },
      data: {
        status: data.status,
        submittedAt: data.submittedAt,
        score: data.score,
      },
      include: attemptInclude,
    }).then(toQuizAttemptEntity);
  }

  updateAnswerGrade(uuid: string, data: { score: string; isCorrect?: boolean | null }): Promise<QuestionAnswerEntity> {
    return this.prisma.questionAnswer.update({
      where: { uuid },
      data: {
        score: data.score,
        isCorrect: data.isCorrect,
        gradedAt: new Date(),
      },
    }).then(toQuestionAnswerEntity);
  }

  findAnswerByUuid(uuid: string): Promise<QuestionAnswerEntity | null> {
    return this.prisma.questionAnswer.findUnique({
      where: { uuid },
    }).then((answer) => (answer ? toQuestionAnswerEntity(answer) : null));
  }

  async autoGradeAndSubmit(attempt: QuizAttemptEntity): Promise<QuizAttemptEntity> {
    return this.prisma.$transaction(async (tx) => {
      const questions = await tx.question.findMany({
        where: { quizId: attempt.quizId },
        include: {
          options: true,
        },
      });
      const answers = await tx.questionAnswer.findMany({ where: { attemptId: attempt.id } });

      for (const answer of answers) {
        const question = questions.find((item) => item.id === answer.questionId);
        if (!question || question.type !== 'MULTIPLE_CHOICE') {
          continue;
        }

        const correctOption = question.options.find((option) => option.isCorrect);
        const isCorrect = Boolean(correctOption && answer.selectedOptionId === correctOption.id);
        await tx.questionAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            score: isCorrect ? question.points : '0',
            gradedAt: new Date(),
          },
        });
      }

      const refreshedAnswers = await tx.questionAnswer.findMany({ where: { attemptId: attempt.id } });
      const hasUngraded = refreshedAnswers.some((answer) => answer.score === null);
      const score = refreshedAnswers.reduce((total, answer) => total + Number(answer.score ?? 0), 0).toFixed(2);

      const updated = await tx.quizAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: new Date(),
          status: hasUngraded ? QuizAttemptStatus.SUBMITTED : QuizAttemptStatus.GRADED,
          score,
        },
        include: attemptInclude,
      });

      return toQuizAttemptEntity(updated);
    });
  }

  async recalculateAttemptScore(attemptId: number): Promise<QuizAttemptEntity> {
    return this.prisma.$transaction(async (tx) => {
      const answers = await tx.questionAnswer.findMany({ where: { attemptId } });
      const hasUngraded = answers.some((answer) => answer.score === null);
      const score = answers.reduce((total, answer) => total + Number(answer.score ?? 0), 0).toFixed(2);
      const updated = await tx.quizAttempt.update({
        where: { id: attemptId },
        data: {
          score,
          status: hasUngraded ? QuizAttemptStatus.SUBMITTED : QuizAttemptStatus.GRADED,
        },
        include: attemptInclude,
      });

      return toQuizAttemptEntity(updated);
    });
  }
}

const attemptQuizSelect = {
  id: true,
  uuid: true,
  courseId: true,
  title: true,
  durationMinutes: true,
  startsAt: true,
  endsAt: true,
  status: true,
  course: {
    select: {
      id: true,
      uuid: true,
      teacherId: true,
      title: true,
    },
  },
} satisfies Prisma.QuizSelect;

const attemptInclude = {
  quiz: {
    select: attemptQuizSelect,
  },
  answers: {
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.QuizAttemptInclude;
