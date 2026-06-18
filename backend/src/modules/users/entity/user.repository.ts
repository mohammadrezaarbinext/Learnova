import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RoleEntity, RoleName, toRoleEntity } from '../../roles/entity/role.entity';
import { toUserResponse, UpdateUserData, UserEntity, UserStatus, UserWithPasswordEntity } from './user.entity';

export type CreateStudentUserData = {
  fullName: string;
  email?: string;
  phone: string;
  passwordHash: string;
  studentRoleId: number;
};

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      include: userWithAuthRelations,
      orderBy: { createdAt: 'desc' },
    }).then((users) => users.map(toUserResponse));
  }

  findByUuid(uuid: string): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({
      where: { uuid },
      include: userWithAuthRelations,
    }).then((user) => (user ? toUserResponse(user) : null));
  }

  findByEmail(email: string): Promise<UserWithPasswordEntity | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithAuthRelations,
    }).then((user) => (user ? { ...toUserResponse(user), passwordHash: user.passwordHash } : null));
  }

  findByPhone(phone: string): Promise<UserWithPasswordEntity | null> {
    return this.prisma.user.findUnique({
      where: { phone },
      include: userWithAuthRelations,
    }).then((user) => (user ? { ...toUserResponse(user), passwordHash: user.passwordHash } : null));
  }

  createStudentUser(data: CreateStudentUserData): Promise<UserEntity> {
    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        status: UserStatus.ACTIVE,
        wallet: {
          create: {},
        },
        userRoles: {
          create: {
            roleId: data.studentRoleId,
          },
        },
      },
      include: userWithAuthRelations,
    }).then(toUserResponse);
  }

  updateByUuid(uuid: string, data: UpdateUserData): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { uuid },
      data,
      include: userWithAuthRelations,
    }).then(toUserResponse);
  }

  updatePassword(id: number, passwordHash: string): Promise<UserEntity> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      include: userWithAuthRelations,
    }).then(toUserResponse);
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.user.delete({ where: { uuid } });
  }

  findRoleByName(name: RoleName): Promise<RoleEntity | null> {
    return this.prisma.role.findUnique({ where: { name } }).then((role) => (role ? toRoleEntity(role) : null));
  }
}

const userWithAuthRelations = {
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
} satisfies Prisma.UserInclude;
