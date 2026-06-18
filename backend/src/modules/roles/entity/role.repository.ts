import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { RoleEntity, RoleName, toRoleEntity } from './role.entity';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RoleEntity[]> {
    return this.prisma.role.findMany({ orderBy: { createdAt: 'asc' } }).then((roles) => roles.map(toRoleEntity));
  }

  findByName(name: RoleName): Promise<RoleEntity | null> {
    return this.prisma.role.findUnique({ where: { name } }).then((role) => (role ? toRoleEntity(role) : null));
  }
}
