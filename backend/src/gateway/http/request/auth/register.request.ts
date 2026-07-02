import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { IRANIAN_MOBILE_REGEX, normalizeIranianPhone } from '../../../../common/utils/phone.util';
import { OtpType } from '../../../../modules/auth/entity/auth.entity';

export enum OtpRequestType {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

export class OtpRequest {
  @ApiProperty({ example: '09920206332' })
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone: string;

  @ApiProperty({ enum: OtpRequestType, example: OtpRequestType.REGISTER })
  @IsEnum(OtpRequestType)
  type: OtpType;
}

export class RegisterRequest {
  @ApiProperty({ example: '09920206332' })
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class VerifyOtpRequest {
  @ApiProperty({ example: '09920206332' })
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone: string;

  @ApiProperty({ enum: OtpRequestType, example: OtpRequestType.REGISTER })
  @IsEnum(OtpRequestType)
  type: OtpType;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

export class ChangePasswordRequest {
  @ApiProperty({ example: '09920206332' })
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password: string;
}
