import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AuthUser } from '../../../common/types/auth-user.type';
import { QuizAttemptsService } from '../../../modules/quiz-attempts/service/quiz-attempts.service';
import { GradeQuestionAnswerRequest } from '../request/quiz-attempts/grade-answer.request';
import { SaveQuestionAnswerRequest } from '../request/quiz-attempts/save-answer.request';
import { ErrorResponse } from '../response/error.response';
import { QuestionAnswerResponse, QuizAttemptResponse } from '../response/quiz-attempt.response';

@ApiTags('Quiz Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  @Post('quizzes/:quizId/attempts/start')
  @ApiOperation({ summary: 'Start quiz attempt' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiCreatedResponse({ type: QuizAttemptResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quiz_attempts.create permission and course enrollment.', type: ErrorResponse })
  @ApiConflictResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quiz_attempts.create')
  start(@Param('quizId', ParseUUIDPipe) quizId: string, @CurrentUser() user: AuthUser) {
    return this.quizAttemptsService.start(quizId, user);
  }

  @Post('quiz-attempts/:attemptId/answers')
  @ApiOperation({ summary: 'Save or update one answer' })
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  @ApiCreatedResponse({ type: QuestionAnswerResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quiz_attempts.submit permission and own attempt.', type: ErrorResponse })
  @ApiConflictResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quiz_attempts.submit')
  saveAnswer(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: SaveQuestionAnswerRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.saveAnswer(attemptId, dto, user);
  }

  @Post('quiz-attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit quiz attempt' })
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  @ApiOkResponse({ type: QuizAttemptResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quiz_attempts.submit permission and own attempt.', type: ErrorResponse })
  @ApiConflictResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quiz_attempts.submit')
  submit(@Param('attemptId', ParseUUIDPipe) attemptId: string, @CurrentUser() user: AuthUser) {
    return this.quizAttemptsService.submit(attemptId, user);
  }

  @Get('quiz-attempts/me')
  @ApiOperation({ summary: 'List current user quiz attempts' })
  @ApiOkResponse({ type: [QuizAttemptResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  findMine(@CurrentUser() user: AuthUser) {
    return this.quizAttemptsService.findMine(user);
  }

  @Get('quizzes/:quizId/attempts')
  @ApiOperation({ summary: 'List attempts for a quiz' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiOkResponse({ type: [QuizAttemptResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quiz_attempts.read permission and quiz ownership for TEACHER.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quiz_attempts.read')
  findByQuiz(@Param('quizId', ParseUUIDPipe) quizId: string, @CurrentUser() user: AuthUser) {
    return this.quizAttemptsService.findByQuiz(quizId, user);
  }

  @Patch('question-answers/:answerId/grade')
  @ApiOperation({ summary: 'Grade descriptive answer' })
  @ApiParam({ name: 'answerId', format: 'uuid' })
  @ApiOkResponse({ type: QuizAttemptResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quiz_attempts.grade permission and quiz ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quiz_attempts.grade')
  gradeAnswer(
    @Param('answerId', ParseUUIDPipe) answerId: string,
    @Body() dto: GradeQuestionAnswerRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.gradeAnswer(answerId, dto, user);
  }
}
