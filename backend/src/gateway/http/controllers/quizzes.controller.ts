import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
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
import { QuizzesService } from '../../../modules/quizzes/service/quizzes.service';
import { CreateQuizRequest } from '../request/quizzes/create-quiz.request';
import { UpdateQuizRequest } from '../request/quizzes/update-quiz.request';
import { ErrorResponse } from '../response/error.response';
import { DeleteQuizResponse, QuizResponse } from '../response/quiz.response';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get('courses/:courseId/quizzes')
  @ApiOperation({ summary: 'List course quizzes' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ type: [QuizResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quizzes.read permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quizzes.read')
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user: AuthUser) {
    return this.quizzesService.findByCourse(courseId, user);
  }

  @Post('courses/:courseId/quizzes')
  @ApiOperation({ summary: 'Create course quiz' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiCreatedResponse({ type: QuizResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quizzes.create permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quizzes.create')
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateQuizRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizzesService.create(courseId, dto, user);
  }

  @Get('quizzes/:quizId')
  @ApiOperation({ summary: 'Get quiz with questions' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiOkResponse({ type: QuizResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quizzes.read permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quizzes.read')
  findOne(@Param('quizId', ParseUUIDPipe) quizId: string, @CurrentUser() user: AuthUser) {
    return this.quizzesService.findOne(quizId, user);
  }

  @Patch('quizzes/:quizId')
  @ApiOperation({ summary: 'Update quiz' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiOkResponse({ type: QuizResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quizzes.update permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quizzes.update')
  update(@Param('quizId', ParseUUIDPipe) quizId: string, @Body() dto: UpdateQuizRequest, @CurrentUser() user: AuthUser) {
    return this.quizzesService.update(quizId, dto, user);
  }

  @Delete('quizzes/:quizId')
  @ApiOperation({ summary: 'Delete quiz' })
  @ApiParam({ name: 'quizId', format: 'uuid' })
  @ApiOkResponse({ type: DeleteQuizResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires quizzes.delete permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('quizzes.delete')
  remove(@Param('quizId', ParseUUIDPipe) quizId: string, @CurrentUser() user: AuthUser) {
    return this.quizzesService.remove(quizId, user);
  }
}
