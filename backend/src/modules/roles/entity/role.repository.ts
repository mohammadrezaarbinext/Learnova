import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findByName(name: RoleName) {
    return this.prisma.role.findUnique({ where: { name } });
  }
}
