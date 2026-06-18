import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { RoleRepository } from '../entity/role.repository';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  findAll() {
    return this.roleRepository.findAll();
  }

  findByName(name: RoleName) {
    return this.roleRepository.findByName(name);
  }
}
