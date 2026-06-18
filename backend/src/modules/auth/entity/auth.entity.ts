import { SanitizedUser } from '../../users/entity/user.entity';

export type AuthEntity = {
  accessToken: string;
  user: SanitizedUser;
};

export type OtpType = 'REGISTER' | 'LOGIN' | 'CHANGE_PASSWORD';
