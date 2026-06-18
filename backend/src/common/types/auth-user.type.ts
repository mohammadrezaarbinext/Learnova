import { UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: UserStatus;
  roles: string[];
  permissions: string[];
};
