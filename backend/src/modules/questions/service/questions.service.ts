import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { CreateQuestionRequest, QuestionOptionRequest } from '../../../gateway/http/request/questions/create-question.request';
import { UpdateQuestionRequest } from '../../../gateway/http/request/questions/update-question.request';
import { canManageCourse } from '../../courses/entity/course.entity';
import {
  DeleteQuestionEntity,
  JsonValue,
  QuestionContentType,
  QuestionEntity,
  QuestionResponseEntity,
  QuestionType,
  serializeQuestion,
  toJsonValue,
  toNullableJsonValue,
} from '../entity/question.entity';
import { QuestionOptionInput, QuestionQuizLookup, QuestionRepository } from '../entity/question.repository';

@Injectable()
export class QuestionsService {
  constructor(private readonly questionRepository: QuestionRepository) {}

  async create(quizUuid: string, dto: CreateQuestionRequest, user: AuthUser): Promise<QuestionResponseEntity> {
    const quiz = await this.getQuizOrThrow(quizUuid);
    this.ensureCanManage(quiz.course.teacherId, user);
    const options = this.validateAndBuildOptions(dto.type, dto.options);

    const question = await this.questionRepository.create({
      quizId: quiz.id,
      type: dto.type,
      contentType: dto.contentType ?? QuestionContentType.TEXT,
      content: toJsonValue(dto.content),
      imageUrl: dto.imageUrl,
      points: dto.points ?? '1.00',
      orderIndex: dto.orderIndex,
      answerKey: toNullableJsonValue(dto.answerKey),
      options,
    });

    return serializeQuestion(question, true);
  }

  async update(uuid: string, dto: UpdateQuestionRequest, user: AuthUser): Promise<QuestionResponseEntity> {
    const quiz = await this.getQuizByQuestionOrThrow(uuid);
    this.ensureCanManage(quiz.course.teacherId, user);
    const existing = await this.getQuestionOrThrow(uuid);
    const nextType = dto.type ?? existing.type;
    const options = dto.options === undefined ? undefined : this.validateAndBuildOptions(nextType, dto.options);

    const question = await this.questionRepository.update(uuid, {
      type: dto.type,
      contentType: dto.contentType,
      content: dto.content === undefined ? undefined : toJsonValue(dto.content),
      imageUrl: dto.imageUrl,
      points: dto.points,
      orderIndex: dto.orderIndex,
      answerKey: dto.answerKey === undefined ? undefined : toNullableJsonValue(dto.answerKey),
      options,
    });

    return serializeQuestion(question, true);
  }

  async remove(uuid: string, user: AuthUser): Promise<DeleteQuestionEntity> {
    const quiz = await this.getQuizByQuestionOrThrow(uuid);
    this.ensureCanManage(quiz.course.teacherId, user);
    const question = await this.getQuestionOrThrow(uuid);
    await this.questionRepository.delete(uuid);

    return { id: question.id, uuid: question.uuid, deleted: true };
  }

  private async getQuizOrThrow(uuid: string): Promise<QuestionQuizLookup> {
    const quiz = await this.questionRepository.findQuizByUuid(uuid);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async getQuizByQuestionOrThrow(uuid: string): Promise<QuestionQuizLookup> {
    const quiz = await this.questionRepository.findQuizByQuestionUuid(uuid);
    if (!quiz) {
      throw new NotFoundException('Question not found');
    }

    return quiz;
  }

  private async getQuestionOrThrow(uuid: string): Promise<QuestionEntity> {
    const question = await this.questionRepository.findByUuid(uuid);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  private ensureCanManage(teacherId: number, user: AuthUser): void {
    if (!canManageCourse(user, teacherId)) {
      throw new ForbiddenException('You can manage only your own quiz questions');
    }
  }

  private validateAndBuildOptions(type: QuestionType, options?: QuestionOptionRequest[]): QuestionOptionInput[] {
    if (type === QuestionType.DESCRIPTIVE) {
      return [];
    }

    if (!options?.length) {
      throw new BadRequestException('MULTIPLE_CHOICE questions require options');
    }

    const correctCount = options.filter((option) => option.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException('MULTIPLE_CHOICE questions require exactly one correct option');
    }

    return options.map((option) => ({
      contentType: option.contentType ?? QuestionContentType.TEXT,
      content: toJsonValue(option.content) as JsonValue,
      imageUrl: option.imageUrl,
      orderIndex: option.orderIndex,
      isCorrect: option.isCorrect,
    }));
  }
}
