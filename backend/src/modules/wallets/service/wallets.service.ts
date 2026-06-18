import { Injectable, NotFoundException } from '@nestjs/common';
import { WalletEntity } from '../entity/wallet.entity';
import { WalletRepository } from '../entity/wallet.repository';

@Injectable()
export class WalletsService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async findByUserId(userId: number): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async findByUserUuid(userUuid: string): Promise<WalletEntity> {
    const wallet = await this.walletRepository.findByUserUuid(userUuid);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async updateBalanceByUserUuid(userUuid: string, balance: string): Promise<WalletEntity> {
    const wallet = await this.findByUserUuid(userUuid);
    return this.walletRepository.updateBalanceByWalletId(wallet.id, balance);
  }
}
