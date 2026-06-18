import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterRequest {
  @ApiProperty({ example: 'Sara Ahmadi' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'sara@learnnova.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+989121234567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
