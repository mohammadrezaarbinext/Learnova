import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(userId: number) {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  findByUserUuid(userUuid: string) {
    return this.prisma.wallet.findFirst({
      where: {
        user: { uuid: userUuid },
      },
    });
  }

  updateBalanceByWalletId(id: number, balance: Prisma.Decimal | string) {
    return this.prisma.wallet.update({
      where: { id },
      data: { balance },
    });
  }
}
