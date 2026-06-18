import { SanitizedUser } from '../../users/entity/user.entity';

export type AuthEntity = {
  accessToken: string;
  user: SanitizedUser;
};
