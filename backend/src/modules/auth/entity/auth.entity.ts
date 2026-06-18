import { UserStatus } from '../../users/entity/user.entity';
import { WalletEntity } from '../../wallets/entity/wallet.entity';

export type AuthUserEntity = {
  id: number;
  uuid: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: UserStatus;
  wallet?: WalletEntity | null;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type AuthEntity = {
  accessToken: string;
  user: AuthUserEntity;
};

export type MessageEntity = {
  ok: true;
  message: string;
};

export type OtpEntity = MessageEntity;
export type OtpType = 'REGISTER' | 'LOGIN' | 'CHANGE_PASSWORD';
