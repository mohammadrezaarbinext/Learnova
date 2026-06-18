import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { WalletResponse } from './wallet.response';

export class UserResponse {
  @ApiProperty({ example: 'df030de8-6479-4837-a03d-65836fa80d60', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Sara Ahmadi' })
  fullName: string;

  @ApiProperty({ example: 'sara@learnnova.com' })
  email: string;

  @ApiPropertyOptional({ example: '+989121234567', nullable: true })
  phone: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ type: WalletResponse, nullable: true })
  wallet: WalletResponse | null;

  @ApiProperty({ example: ['STUDENT'], isArray: true })
  roles: string[];

  @ApiProperty({ example: ['student.panel.access', 'auth.me'], isArray: true })
  permissions: string[];

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}

export class DeleteUserResponse {
  @ApiProperty({ example: 'df030de8-6479-4837-a03d-65836fa80d60', format: 'uuid' })
  id: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
