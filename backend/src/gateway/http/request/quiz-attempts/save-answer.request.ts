import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { JsonValue, QuestionContentType } from '../../../../modules/questions/entity/question.entity';

export class SaveQuestionAnswerRequest {
  @ApiProperty({ example: '00000000-0000-4000-8000-000000000701', format: 'uuid' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ example: '00000000-0000-4000-8000-000000000801', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  selectedOptionId?: string;

  @ApiPropertyOptional({ enum: QuestionContentType, example: QuestionContentType.TEXT })
  @IsOptional()
  @IsEnum(QuestionContentType)
  answerContentType?: QuestionContentType;

  @ApiPropertyOptional({ example: 'My descriptive answer.' })
  @IsOptional()
  @IsDefined()
  answerContent?: JsonValue;

  @ApiPropertyOptional({ example: 'https://cdn.learnnova.test/answers/a1.png' })
  @IsOptional()
  @IsString()
  answerImageUrl?: string;
}
