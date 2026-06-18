import { Module } from '@nestjs/common';
import { PermissionRepository } from './entity/permission.repository';
import { PermissionsService } from './service/permissions.service';

@Module({
  providers: [PermissionRepository, PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
