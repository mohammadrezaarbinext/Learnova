import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { QuestionsService } from '../../../modules/questions/service/questions.service';
import { CreateQuestionRequest } from '../request/questions/create-question.request';
import { UpdateQuestionRequest } from '../request/questions/update-question.request';
import { ErrorResponse } from '../response/error.response';
import { QuestionResponse } from '../response/question.response';

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('quizzes/:quizId/questions')
  @ApiOperation({ summary: 'Create quiz question' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiCreatedResponse({ type: QuestionResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires questions.create permission and quiz ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('questions.create')
  create(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: CreateQuestionRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.create(quizId, dto, user);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiOkResponse({ type: QuestionResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires questions.update permission and quiz ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('questions.update')
  update(
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.questionsService.update(questionId, dto, user);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete question' })
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires questions.delete permission and quiz ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('questions.delete')
  remove(@Param('questionId', ParseUUIDPipe) questionId: string, @CurrentUser() user: AuthUser) {
    return this.questionsService.remove(questionId, user);
  }
}
