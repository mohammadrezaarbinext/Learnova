import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseResponse } from './course.response';

export class EnrollmentResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  studentId: number;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiPropertyOptional({ type: CourseResponse })
  course?: CourseResponse;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}

export class DeleteEnrollmentResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
