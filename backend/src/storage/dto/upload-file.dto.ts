import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FileType, FileVisibility } from '../entities/file.entity';

export class UploadFileDto {
  @ApiProperty({ enum: FileType, example: FileType.VIDEO })
  @IsEnum(FileType)
  type: FileType;

  @ApiPropertyOptional({ enum: FileVisibility, default: FileVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @ApiPropertyOptional({ description: 'Course uuid for course-scoped files.' })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
