import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal } from 'class-validator';

export class UpdateWalletBalanceRequest {
  @ApiProperty({ example: '250000.00' })
  @IsDecimal()
  balance: string;
}
