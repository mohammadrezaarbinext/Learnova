import { Prisma, UserStatus } from '@prisma/client';

export const userWithAuthRelations = Prisma.validator<Prisma.UserInclude>()({
  wallet: true,
  enrollments: {
    include: {
      course: {
        select: {
          id: true,
          uuid: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          price: true,
          level: true,
          status: true,
          teacherId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  },
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
  id: number;
  uuid: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: UserStatus;
  wallet: UserEntity['wallet'];
  enrollments: Array<{
    id: number;
    uuid: string;
    studentId: number;
    courseId: number;
    course: UserEntity['enrollments'][number]['course'];
    createdAt: Date;
    updatedAt: Date;
  }>;
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
    uuid: user.uuid,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    wallet: user.wallet,
    enrollments: user.enrollments.map((enrollment) => ({
      id: enrollment.id,
      uuid: enrollment.uuid,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      course: enrollment.course,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    })),
    roles,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
