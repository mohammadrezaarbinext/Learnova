import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CoursesService } from '../../../modules/courses/service/courses.service';
import { CreateCourseRequest } from '../request/courses/create-course.request';
import { ListCoursesRequest } from '../request/courses/list-courses.request';
import { UpdateCourseRequest } from '../request/courses/update-course.request';
import { CourseResponse, DeleteCourseResponse } from '../response/course.response';
import { ErrorResponse } from '../response/error.response';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List published courses' })
  @ApiOkResponse({ type: [CourseResponse] })
  findAll(@Query() query: ListCoursesRequest) {
    return this.coursesService.findAll(query);
  }

  @Get('me/teaching')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current teacher courses' })
  @ApiOkResponse({ type: [CourseResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires courses.read permission.', type: ErrorResponse })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.read')
  findTeaching(@CurrentUser() user: AuthUser) {
    return this.coursesService.findTeaching(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course details by uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CourseResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a course' })
  @ApiCreatedResponse({ type: CourseResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires courses.create permission and TEACHER or ADMIN role.', type: ErrorResponse })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.create')
  create(@Body() dto: CreateCourseRequest, @CurrentUser() user: AuthUser) {
    return this.coursesService.create(dto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CourseResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires courses.update permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseRequest, @CurrentUser() user: AuthUser) {
    return this.coursesService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: DeleteCourseResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires courses.delete permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('courses.delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.coursesService.remove(id, user);
  }
}
