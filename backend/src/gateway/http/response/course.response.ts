import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus } from '../../../modules/courses/entity/course.entity';

class CourseTeacherResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: '09920206332' })
  fullName: string;

  @ApiProperty({ example: '09920206332' })
  phone: string;

  @ApiPropertyOptional({ example: 'teacher@learnnova.com', nullable: true })
  email: string | null;
}

export class CourseResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 'NestJS Foundations' })
  title: string;

  @ApiProperty({ example: 'Build production-ready APIs with NestJS.' })
  description: string;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/courses/nestjs.png', nullable: true })
  thumbnailUrl: string | null;

  @ApiProperty({ example: '0.00', description: 'Decimal string.' })
  price: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.BEGINNER })
  level: CourseLevel;

  @ApiProperty({ enum: CourseStatus, example: CourseStatus.PUBLISHED })
  status: CourseStatus;

  @ApiProperty({ example: 1 })
  teacherId: number;

  @ApiPropertyOptional({ type: CourseTeacherResponse })
  teacher?: CourseTeacherResponse;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}

export class DeleteCourseResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
