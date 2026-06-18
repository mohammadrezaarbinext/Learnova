import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

@Entity('Wallet')
export class WalletEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  balance!: string;

  @Column({ length: 10, default: 'IRT' })
  currency!: string;
}

type DecimalLike = { toString(): string };

type WalletPersistence = Omit<WalletEntity, 'balance'> & {
  balance: DecimalLike | string | number;
};

export function toWalletEntity(wallet: WalletPersistence): WalletEntity {
  return {
    id: wallet.id,
    uuid: wallet.uuid,
    userId: wallet.userId,
    balance: wallet.balance?.toString?.() ?? String(wallet.balance),
    currency: wallet.currency,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}
