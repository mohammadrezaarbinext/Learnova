import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { toWalletEntity, WalletEntity } from './wallet.entity';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: number): Promise<WalletEntity | null> {
    return this.prisma.wallet.findUnique({ where: { userId } }).then((wallet) => (wallet ? toWalletEntity(wallet) : null));
  }

  findByUserUuid(userUuid: string): Promise<WalletEntity | null> {
    return this.prisma.wallet.findFirst({
      where: {
        user: { uuid: userUuid },
      },
    }).then((wallet) => (wallet ? toWalletEntity(wallet) : null));
  }

  updateBalanceByWalletId(id: number, balance: string): Promise<WalletEntity> {
    return this.prisma.wallet.update({
      where: { id },
      data: { balance },
    }).then(toWalletEntity);
  }
}
