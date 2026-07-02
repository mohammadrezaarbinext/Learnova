import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../modules/users/entity/user.entity';
import { EnrollmentResponse } from './enrollment.response';
import { WalletResponse } from './wallet.response';

export class UserResponse {
  @ApiProperty({ example: 1, description: 'Internal numeric database id.' })
  id: number;

  @ApiProperty({ example: 'df030de8-6479-4837-a03d-65836fa80d60', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: 'Sara Ahmadi' })
  fullName: string;

  @ApiPropertyOptional({ example: 'sara@learnnova.com', nullable: true })
  email: string | null;

  @ApiProperty({ example: '09920206332' })
  phone: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiPropertyOptional({ type: WalletResponse, nullable: true })
  wallet: WalletResponse | null;

  @ApiProperty({ type: [EnrollmentResponse] })
  enrollments: EnrollmentResponse[];

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
  @ApiProperty({ example: 1, description: 'Internal numeric database id.' })
  id: number;

  @ApiProperty({ example: 'df030de8-6479-4837-a03d-65836fa80d60', format: 'uuid' })
  uuid: string;

  @ApiProperty({ example: true })
  deleted: boolean;
}
