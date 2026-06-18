import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { PermissionEntity, toPermissionEntity } from './permission.entity';

@Injectable()
export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<PermissionEntity[]> {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } }).then((permissions) => permissions.map(toPermissionEntity));
  }

  findByName(name: string): Promise<PermissionEntity | null> {
    return this.prisma.permission.findUnique({ where: { name } }).then((permission) => (permission ? toPermissionEntity(permission) : null));
  }
}
