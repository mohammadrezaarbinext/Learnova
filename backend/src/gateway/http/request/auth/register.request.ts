import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { OtpType } from '../../../../modules/auth/entity/auth.entity';

export enum OtpRequestType {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

export class OtpRequest {
  @ApiProperty({ example: '+989121234567' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: OtpRequestType, example: OtpRequestType.REGISTER })
  @IsEnum(OtpRequestType)
  type: OtpType;
}

export class RegisterRequest {
  @ApiProperty({ example: '+989121234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class ChangePasswordRequest {
  @ApiProperty({ example: '+989121234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;
}
