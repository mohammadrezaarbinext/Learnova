import { UserStatus } from '@prisma/client';

export type AuthUser = {
  id: number;
  uuid: string;
  phone: string;
  email: string | null;
  fullName: string;
  status: UserStatus;
  roles: string[];
  permissions: string[];
};
