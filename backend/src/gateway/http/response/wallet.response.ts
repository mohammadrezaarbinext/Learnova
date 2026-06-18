import { ApiProperty } from '@nestjs/swagger';

export class WalletResponse {
  @ApiProperty({ example: '3d6f3206-6277-449c-a782-e58ac3ddc5a1', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'df030de8-6479-4837-a03d-65836fa80d60', format: 'uuid' })
  userId: string;

  @ApiProperty({ example: '0.00', description: 'Wallet balance as a decimal string.' })
  balance: string;

  @ApiProperty({ example: 'IRT' })
  currency: string;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-18T08:45:00.000Z' })
  updatedAt: Date;
}
