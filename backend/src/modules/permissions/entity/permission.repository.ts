import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  findByName(name: string) {
    return this.prisma.permission.findUnique({ where: { name } });
  }
}
