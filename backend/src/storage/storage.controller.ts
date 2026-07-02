import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import path from 'path';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { ErrorResponse } from '../gateway/http/response/error.response';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileType, FileVisibility } from './entities/file.entity';
import { StorageService } from './storage.service';

type UploadedDiskFile = {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

const uploadTempDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads', 'tmp');

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to local app disk storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Multipart file field.',
        },
        type: { type: 'string', enum: Object.values(FileType), example: FileType.VIDEO },
        visibility: { type: 'string', enum: Object.values(FileVisibility), example: FileVisibility.PUBLIC },
        courseId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'File uploaded and stored on app disk.' })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_request, _file, callback) => {
          mkdirSync(uploadTempDir, { recursive: true });
          callback(null, uploadTempDir);
        },
        filename: (_request, file, callback) => {
          callback(null, `${randomUUID()}-${path.basename(file.originalname)}`);
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  upload(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: UploadedDiskFile | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storageService.uploadFile(dto, file, user);
  }

  @Get(':uuid/download-url')
  @ApiOperation({ summary: 'Get the public upload URL for a file' })
  @ApiParam({ name: 'uuid', format: 'uuid' })
  @ApiOkResponse({ description: 'Public upload URL returned.' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  createDownloadUrl(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query('attachment') attachment: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storageService.createDownloadUrl(uuid, user, attachment === 'true' || attachment === '1');
  }

  @Delete(':uuid')
  @ApiOperation({ summary: 'Delete a file from app disk and the database' })
  @ApiParam({ name: 'uuid', format: 'uuid' })
  @ApiOkResponse({ description: 'File deleted.' })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
  @ApiForbiddenResponse({ type: ErrorResponse })
  @ApiNotFoundResponse({ type: ErrorResponse })
  remove(@Param('uuid', ParseUUIDPipe) uuid: string, @CurrentUser() user: AuthUser) {
    return this.storageService.deleteFile(uuid, user);
  }
}
