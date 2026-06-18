import { Injectable } from '@nestjs/common';
import { Prisma, RoleName, UserStatus } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { userWithAuthRelations } from './user.entity';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: userWithAuthRelations,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByUuid(uuid: string) {
    return this.prisma.user.findUnique({
      where: { uuid },
      include: userWithAuthRelations,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: userWithAuthRelations,
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: userWithAuthRelations,
    });
  }

  createStudentUser(data: {
    fullName: string;
    email?: string;
    phone: string;
    passwordHash: string;
    studentRoleId: number;
  }) {
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
    });
  }

  updateByUuid(uuid: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { uuid },
      data,
      include: userWithAuthRelations,
    });
  }

  updatePassword(id: number, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      include: userWithAuthRelations,
    });
  }

  deleteByUuid(uuid: string) {
    return this.prisma.user.delete({ where: { uuid } });
  }

  findRoleByName(name: RoleName) {
    return this.prisma.role.findUnique({ where: { name } });
  }
}
