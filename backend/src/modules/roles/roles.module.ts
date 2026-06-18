import { Module } from '@nestjs/common';
import { RoleRepository } from './entity/role.repository';
import { RolesService } from './service/roles.service';

@Module({
  providers: [RoleRepository, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
