import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { QuizGateway } from '../../../gateway/websocket/quiz.gateway';
import { GradeQuestionAnswerRequest } from '../../../gateway/http/request/quiz-attempts/grade-answer.request';
import { SaveQuestionAnswerRequest } from '../../../gateway/http/request/quiz-attempts/save-answer.request';
import { canManageCourse } from '../../courses/entity/course.entity';
import { QuestionType, toNullableJsonValue } from '../../questions/entity/question.entity';
import {
  QuestionAnswerResponseEntity,
  QuizAttemptEntity,
  QuizAttemptResponseEntity,
  QuizAttemptStatus,
  serializeQuestionAnswer,
  serializeQuizAttempt,
} from '../entity/quiz-attempt.entity';
import { AttemptQuizLookup, QuizAttemptRepository } from '../entity/quiz-attempt.repository';

@Injectable()
export class QuizAttemptsService {
  constructor(
    private readonly quizAttemptRepository: QuizAttemptRepository,
    private readonly quizGateway: QuizGateway,
  ) {}

  async start(quizUuid: string, user: AuthUser): Promise<QuizAttemptResponseEntity> {
    this.ensureStudentOnly(user);
    const quiz = await this.getQuizOrThrow(quizUuid);
    if (quiz.status !== 'PUBLISHED') {
      throw new BadRequestException('Quiz is not published');
    }

    await this.ensureStudentCanAttempt(quiz, user);

    const existing = await this.quizAttemptRepository.findInProgress(quiz.id, user.id);
    if (existing) {
      return serializeQuizAttempt(existing);
    }

    const attempt = await this.quizAttemptRepository.createAttempt(quiz.id, user.id);
    this.quizGateway.emitTimer(attempt.uuid, this.remainingSeconds(attempt));
    return serializeQuizAttempt(attempt);
  }

  async saveAnswer(
    attemptUuid: string,
    dto: SaveQuestionAnswerRequest,
    user: AuthUser,
  ): Promise<QuestionAnswerResponseEntity> {
    const attempt = await this.getAttemptOrThrow(attemptUuid);
    this.ensureCurrentStudent(attempt, user);
    await this.ensureAttemptCanReceiveAnswers(attempt);

    const question = await this.quizAttemptRepository.findQuestionByUuid(dto.questionId);
    if (!question || question.quizId !== attempt.quizId) {
      throw new BadRequestException('Question does not belong to this attempt quiz');
    }

    let selectedOptionId: number | null = null;
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      if (!dto.selectedOptionId) {
        throw new BadRequestException('selectedOptionId is required for MULTIPLE_CHOICE answers');
      }

      const option = await this.quizAttemptRepository.findOptionByUuid(dto.selectedOptionId);
      if (!option || option.questionId !== question.id) {
        throw new BadRequestException('Selected option does not belong to this question');
      }

      selectedOptionId = option.id;
    } else if (dto.answerContent === undefined && !dto.answerImageUrl) {
      throw new BadRequestException('answerContent or answerImageUrl is required for DESCRIPTIVE answers');
    }

    const answer = await this.quizAttemptRepository.saveAnswer({
      attemptId: attempt.id,
      questionId: question.id,
      selectedOptionId,
      answerContentType: dto.answerContentType,
      answerContent: toNullableJsonValue(dto.answerContent),
      answerImageUrl: dto.answerImageUrl,
    });

    return serializeQuestionAnswer(answer);
  }

  async submit(attemptUuid: string, user: AuthUser): Promise<QuizAttemptResponseEntity> {
    const attempt = await this.getAttemptOrThrow(attemptUuid);
    this.ensureCurrentStudent(attempt, user);
    await this.ensureAttemptCanReceiveAnswers(attempt);

    const submitted = await this.quizAttemptRepository.autoGradeAndSubmit(attempt);
    this.quizGateway.emitSubmitted(attempt.uuid);
    return serializeQuizAttempt(submitted);
  }

  async findMine(user: AuthUser): Promise<QuizAttemptResponseEntity[]> {
    const attempts = await this.quizAttemptRepository.findMine(user.id);
    return attempts.map(serializeQuizAttempt);
  }

  async findByQuiz(quizUuid: string, user: AuthUser): Promise<QuizAttemptResponseEntity[]> {
    const quiz = await this.getQuizOrThrow(quizUuid);
    this.ensureCanReadAttempts(quiz, user);
    const attempts = await this.quizAttemptRepository.findByQuizUuid(quizUuid);

    return attempts.map(serializeQuizAttempt);
  }

  async gradeAnswer(
    answerUuid: string,
    dto: GradeQuestionAnswerRequest,
    user: AuthUser,
  ): Promise<QuizAttemptResponseEntity> {
    const answer = await this.quizAttemptRepository.findAnswerByUuid(answerUuid);
    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    const attempt = await this.quizAttemptRepository.findAttemptById(answer.attemptId);
    if (!attempt || !attempt.quiz) {
      throw new NotFoundException('Attempt not found');
    }

    this.ensureCanGrade(attempt.quiz.course.teacherId, user);
    await this.quizAttemptRepository.updateAnswerGrade(answerUuid, {
      score: dto.score,
      isCorrect: dto.isCorrect,
    });

    const updatedAttempt = await this.quizAttemptRepository.recalculateAttemptScore(attempt.id);
    return serializeQuizAttempt(updatedAttempt);
  }

  private async getQuizOrThrow(uuid: string): Promise<AttemptQuizLookup> {
    const quiz = await this.quizAttemptRepository.findQuizByUuid(uuid);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async getAttemptOrThrow(uuid: string): Promise<QuizAttemptEntity> {
    const attempt = await this.quizAttemptRepository.findAttemptByUuid(uuid);
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    return attempt;
  }

  private ensureStudentOnly(user: AuthUser): void {
    if (!user.roles.includes('STUDENT') || user.roles.includes('ADMIN') || user.roles.includes('TEACHER') || user.roles.includes('SUPPORT')) {
      throw new ForbiddenException('Only students can start quiz attempts');
    }
  }

  private ensureCurrentStudent(attempt: QuizAttemptEntity, user: AuthUser): void {
    if (attempt.studentId !== user.id) {
      throw new ForbiddenException('You can access only your own quiz attempt');
    }
  }

  private async ensureStudentCanAttempt(quiz: AttemptQuizLookup, user: AuthUser): Promise<void> {
    if (await this.quizAttemptRepository.hasEnrollment(quiz.courseId, user.id)) {
      return;
    }

    throw new ForbiddenException('You must be enrolled in the course to start this quiz');
  }

  private ensureCanReadAttempts(quiz: AttemptQuizLookup, user: AuthUser): void {
    if (user.roles.includes('ADMIN') || user.roles.includes('SUPPORT') || quiz.course.teacherId === user.id) {
      return;
    }

    throw new ForbiddenException('You can view attempts only for your own quizzes');
  }

  private ensureCanGrade(teacherId: number, user: AuthUser): void {
    if (!canManageCourse(user, teacherId)) {
      throw new ForbiddenException('You can grade only your own quiz attempts');
    }
  }

  private async ensureAttemptCanReceiveAnswers(attempt: QuizAttemptEntity): Promise<void> {
    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('Attempt is not in progress');
    }

    if (this.isExpired(attempt)) {
      await this.quizAttemptRepository.updateAttempt(attempt.uuid, {
        status: QuizAttemptStatus.EXPIRED,
      });
      this.quizGateway.emitExpired(attempt.uuid);
      throw new BadRequestException('Quiz attempt time has expired');
    }
  }

  private isExpired(attempt: QuizAttemptEntity): boolean {
    const now = Date.now();
    const durationExpired =
      Boolean(attempt.quiz?.durationMinutes) &&
      attempt.startedAt.getTime() + (attempt.quiz?.durationMinutes ?? 0) * 60 * 1000 < now;
    const endsAtExpired = Boolean(attempt.quiz?.endsAt && attempt.quiz.endsAt.getTime() < now);

    return durationExpired || endsAtExpired;
  }

  private remainingSeconds(attempt: QuizAttemptEntity): number {
    const durationEnd = attempt.quiz?.durationMinutes
      ? attempt.startedAt.getTime() + attempt.quiz.durationMinutes * 60 * 1000
      : Number.POSITIVE_INFINITY;
    const endsAt = attempt.quiz?.endsAt?.getTime() ?? Number.POSITIVE_INFINITY;
    const expiresAt = Math.min(durationEnd, endsAt);

    if (!Number.isFinite(expiresAt)) {
      return 0;
    }

    return Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0);
  }
}
