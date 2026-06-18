import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '17edc1b7-3eb0-4e7f-b8ad-fb2c511054ec', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 1 })
  courseId: number;

  @ApiProperty({ example: 'Introduction' })
  title: string;

  @ApiPropertyOptional({ example: 'Welcome and course overview.', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.learnnova.test/videos/intro.mp4',
    nullable: true,
    description: 'Null when the user cannot access the private video URL.',
  })
  videoUrl: string | null;

  @ApiProperty({ example: 420 })
  durationSeconds: number;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty({ example: true })
  isFree: boolean;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}
