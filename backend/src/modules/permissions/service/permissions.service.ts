import { Injectable } from '@nestjs/common';
import { PermissionEntity } from '../entity/permission.entity';
import { PermissionRepository } from '../entity/permission.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  findAll(): Promise<PermissionEntity[]> {
    return this.permissionRepository.findAll();
  }

  findByName(name: string): Promise<PermissionEntity | null> {
    return this.permissionRepository.findByName(name);
  }
}
