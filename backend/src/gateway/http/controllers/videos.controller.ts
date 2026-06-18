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
import { VideosService } from '../../../modules/videos/service/videos.service';
import { CreateVideoRequest } from '../request/videos/create-video.request';
import { UpdateVideoRequest } from '../request/videos/update-video.request';
import { ErrorResponse } from '../response/error.response';
import { VideoResponse } from '../response/video.response';

@ApiTags('Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('courses/:courseId/videos')
  @ApiOperation({ summary: 'List course videos' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiOkResponse({ type: [VideoResponse] })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires videos.read permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('videos.read')
  findByCourse(@Param('courseId', ParseUUIDPipe) courseId: string, @CurrentUser() user: AuthUser) {
    return this.videosService.findByCourse(courseId, user);
  }

  @Post('courses/:courseId/videos')
  @ApiOperation({ summary: 'Create course video' })
  @ApiParam({ name: 'courseId', format: 'uuid' })
  @ApiCreatedResponse({ type: VideoResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires videos.create permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('videos.create')
  create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateVideoRequest,
    @CurrentUser() user: AuthUser,
  ) {
    return this.videosService.create(courseId, dto, user);
  }

  @Patch('videos/:id')
  @ApiOperation({ summary: 'Update video' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: VideoResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires videos.update permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('videos.update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoRequest, @CurrentUser() user: AuthUser) {
    return this.videosService.update(id, dto, user);
  }

  @Delete('videos/:id')
  @ApiOperation({ summary: 'Delete video' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires videos.delete permission and course ownership or ADMIN.', type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  @Permissions('videos.delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.videosService.remove(id, user);
  }
}
