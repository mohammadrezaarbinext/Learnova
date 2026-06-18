import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: string) {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  updateBalance(userId: string, balance: Prisma.Decimal | string) {
    return this.prisma.wallet.update({
      where: { userId },
      data: { balance },
    });
  }
}
