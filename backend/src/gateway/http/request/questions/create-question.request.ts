import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDecimal,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  JsonValue,
  QuestionContentType,
  QuestionType,
} from '../../../../modules/questions/entity/question.entity';

export class QuestionOptionRequest {
  @ApiPropertyOptional({ enum: QuestionContentType, example: QuestionContentType.TEXT })
  @IsOptional()
  @IsEnum(QuestionContentType)
  contentType?: QuestionContentType;

  @ApiProperty({ example: 'Option A' })
  @IsDefined()
  content: JsonValue;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/questions/option-a.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionRequest {
  @ApiProperty({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiPropertyOptional({ enum: QuestionContentType, example: QuestionContentType.TEXT })
  @IsOptional()
  @IsEnum(QuestionContentType)
  contentType?: QuestionContentType;

  @ApiProperty({ example: 'What is NestJS?' })
  @IsDefined()
  content: JsonValue;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/questions/q1.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '1.00', description: 'Decimal string.' })
  @IsOptional()
  @IsDecimal()
  points?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  orderIndex: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  answerKey?: JsonValue;

  @ApiPropertyOptional({ type: [QuestionOptionRequest] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionRequest)
  options?: QuestionOptionRequest[];
}
