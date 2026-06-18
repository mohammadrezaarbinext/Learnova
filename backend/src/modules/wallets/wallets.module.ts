import { Module } from '@nestjs/common';
import { WalletRepository } from './entity/wallet.repository';
import { WalletsService } from './service/wallets.service';

@Module({
  providers: [WalletRepository, WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
