import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDecimal, IsOptional } from 'class-validator';

export class GradeQuestionAnswerRequest {
  @ApiProperty({ example: '8.50', description: 'Decimal string.' })
  @IsDecimal()
  score: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}
