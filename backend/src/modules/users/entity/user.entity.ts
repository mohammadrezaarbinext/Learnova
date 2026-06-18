import { Prisma, UserStatus } from '@prisma/client';

export const userWithAuthRelations = Prisma.validator<Prisma.UserInclude>()({
  wallet: true,
  userRoles: {
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
});

export type UserEntity = Prisma.UserGetPayload<{ include: typeof userWithAuthRelations }>;

export type SanitizedUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  wallet: UserEntity['wallet'];
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponse(user: UserEntity): SanitizedUser {
  const roles = user.userRoles.map((userRole) => userRole.role.name);
  const permissions = [
    ...new Set(
      user.userRoles.flatMap((userRole) =>
        userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.name),
      ),
    ),
  ];

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    wallet: user.wallet,
    roles,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
