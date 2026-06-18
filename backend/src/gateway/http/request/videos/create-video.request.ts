import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateVideoRequest {
  @ApiProperty({ example: 'Introduction' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Welcome and course overview.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://cdn.learnnova.test/videos/intro.mp4' })
  @IsString()
  videoUrl: string;

  @ApiPropertyOptional({ example: 420 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}
