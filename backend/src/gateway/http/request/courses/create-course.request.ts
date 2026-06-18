import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus } from '@prisma/client';
import { IsDecimal, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCourseRequest {
  @ApiProperty({ example: 'NestJS Foundations' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Build production-ready APIs with NestJS.' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/courses/nestjs.png' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: '0.00', description: 'Decimal string.' })
  @IsOptional()
  @IsDecimal()
  price?: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiPropertyOptional({ enum: CourseStatus, example: CourseStatus.DRAFT })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ description: 'Only ADMIN can explicitly set a teacher uuid.' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
