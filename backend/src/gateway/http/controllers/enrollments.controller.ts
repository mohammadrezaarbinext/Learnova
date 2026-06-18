import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import {
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
import { EnrollmentsService } from '../../../modules/enrollments/service/enrollments.service';
import { DeleteEnrollmentResponse, EnrollmentResponse } from '../response/enrollment.response';
import { ErrorResponse } from '../response/error.response';

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId/enroll')
  @ApiOperation({ summary: 'Enroll current user in a course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiCreatedResponse({ type: EnrollmentResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires enrollments.create permission.', type: ErrorResponse })
  @ApiConflictResponse({ description: 'Already enrolled.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('enrollments.create')
  enroll(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentsService.enroll(courseId, user);
  }

  @Get('enrollments/me')
  @ApiOperation({ summary: 'List current user enrollments' })
  @ApiOkResponse({ type: [EnrollmentResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  findMine(@CurrentUser() user: AuthUser) {
    return this.enrollmentsService.findMine(user);
  }

  @Get('enrollments/course/:courseId')
  @ApiOperation({ summary: 'List enrollments for a course' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ type: [EnrollmentResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires enrollments.read permission and course ownership for TEACHER.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('enrollments.read')
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentsService.findByCourse(courseId, user);
  }

  @Delete('enrollments/:id')
  @ApiOperation({ summary: 'Delete enrollment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: DeleteEnrollmentResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires enrollments.delete permission and ADMIN role.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('enrollments.delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.enrollmentsService.remove(id, user);
  }
}
