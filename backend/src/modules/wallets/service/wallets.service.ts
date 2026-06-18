import { Injectable, NotFoundException } from '@nestjs/common';
import { WalletRepository } from '../entity/wallet.repository';

@Injectable()
export class WalletsService {
  constructor(private readonly walletRepository: WalletRepository) {}

  async findByUserId(userId: string) {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async updateBalance(userId: string, balance: string) {
    await this.findByUserId(userId);
    return this.walletRepository.updateBalance(userId, balance);
  }
}
