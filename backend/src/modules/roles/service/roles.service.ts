import { Injectable } from '@nestjs/common';
import { RoleEntity, RoleName } from '../entity/role.entity';
import { RoleRepository } from '../entity/role.repository';

@Injectable()
export class RolesService {
  constructor(private readonly roleRepository: RoleRepository) {}

  findAll(): Promise<RoleEntity[]> {
    return this.roleRepository.findAll();
  }

  findByName(name: RoleName): Promise<RoleEntity | null> {
    return this.roleRepository.findByName(name);
  }
}
