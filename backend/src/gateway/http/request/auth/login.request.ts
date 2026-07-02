import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IRANIAN_MOBILE_REGEX, normalizeIranianPhone } from '../../../../common/utils/phone.util';

export class LoginRequest {
  @ApiProperty({ example: '09920206332' })
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone: string;

  @ApiPropertyOptional({ minLength: 8, example: 'StrongPass123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  otp?: string;
}
