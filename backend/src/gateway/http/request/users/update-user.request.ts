import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { IRANIAN_MOBILE_REGEX, normalizeIranianPhone } from '../../../../common/utils/phone.util';
import { UserStatus } from '../../../../modules/users/entity/user.entity';

export class UpdateUserRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => normalizeIranianPhone(value))
  @IsString()
  @Matches(IRANIAN_MOBILE_REGEX, { message: 'phone must be an Iranian mobile number in 09xxxxxxxxx format' })
  phone?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
