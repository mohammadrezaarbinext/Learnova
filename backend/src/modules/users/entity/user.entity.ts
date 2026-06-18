import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';
import { toCourseLevel, toCourseStatus } from '../../courses/entity/course.entity';
import { EnrollmentEntity } from '../../enrollments/entity/enrollment.entity';
import { WalletEntity } from '../../wallets/entity/wallet.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  PENDING = 'PENDING',
}

const userStatusMap: Record<string, UserStatus | undefined> = {
  [UserStatus.ACTIVE]: UserStatus.ACTIVE,
  [UserStatus.BLOCKED]: UserStatus.BLOCKED,
  [UserStatus.PENDING]: UserStatus.PENDING,
};

@Entity('User')
export class UserEntity extends BaseEntity {
  @Column({ length: 200 })
  fullName!: string;

  @Index({ unique: true })
  @Column({ nullable: true, length: 200 })
  email!: string | null;

  @Index({ unique: true })
  @Column({ length: 30 })
  phone!: string;

  @Column({ select: false })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  wallet!: WalletEntity | null;

  enrollments!: EnrollmentEntity[];

  roles!: string[];

  permissions!: string[];
}

export type UserWithPasswordEntity = UserEntity & {
  passwordHash: string;
};

export type SanitizedUser = UserEntity;

export type UpdateUserData = {
  fullName?: string;
  email?: string | null;
  phone?: string;
  status?: UserStatus;
};

export type DeleteUserEntity = {
  id: number;
  uuid: string;
  deleted: true;
};

type UserRolePersistence = {
  role: {
    name: string;
    rolePermissions: Array<{
      permission: {
        name: string;
      };
    }>;
  };
};

type DecimalLike = { toString(): string };

type UserPersistence = Omit<UserEntity, 'wallet' | 'enrollments' | 'roles' | 'permissions' | 'status'> & {
  status: string;
  wallet?: (Omit<WalletEntity, 'balance'> & { balance: DecimalLike | string | number }) | null;
  enrollments?: Array<Omit<EnrollmentEntity, 'course'> & { course?: UserEnrollmentCoursePersistence | null }>;
  userRoles?: UserRolePersistence[];
  roles?: string[];
  permissions?: string[];
};

type UserEnrollmentCoursePersistence = Omit<NonNullable<EnrollmentEntity['course']>, 'price' | 'level' | 'status'> & {
  price: DecimalLike | string | number;
  level: string;
  status: string;
};

export function toUserStatus(value: string): UserStatus {
  const status = userStatusMap[value];
  if (!status) {
    throw new Error(`Unsupported user status: ${value}`);
  }

  return status;
}

export function toUserResponse(user: UserPersistence): SanitizedUser {
  const roles = user.roles ?? user.userRoles?.map((userRole) => userRole.role.name) ?? [];
  const permissions =
    user.permissions ??
    [
      ...new Set(
        user.userRoles?.flatMap((userRole) =>
          userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.name),
        ) ?? [],
      ),
    ];

  return {
    id: user.id,
    uuid: user.uuid,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: toUserStatus(user.status),
    wallet: user.wallet
      ? {
          ...user.wallet,
          balance: user.wallet.balance?.toString?.() ?? String(user.wallet.balance),
        }
      : null,
    enrollments:
      user.enrollments?.map((enrollment) => ({
        ...enrollment,
        course: enrollment.course
          ? {
              ...enrollment.course,
              price: enrollment.course.price?.toString?.() ?? String(enrollment.course.price),
              level: toCourseLevel(enrollment.course.level),
              status: toCourseStatus(enrollment.course.status),
            }
          : undefined,
      })) ?? [],
    roles,
    permissions,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
