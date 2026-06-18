import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';
import { CourseLevel, CourseStatus } from '../../../../modules/courses/entity/course.entity';

export class UpdateCourseRequest {
  @ApiPropertyOptional({ example: 'Advanced NestJS' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated course description.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/courses/advanced-nestjs.png' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: '350000.00', description: 'Decimal string.' })
  @IsOptional()
  @IsDecimal()
  price?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}
