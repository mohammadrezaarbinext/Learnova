import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ example: '+989121234567' })
  @IsString()
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
