import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../entity/permission.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  findAll() {
    return this.permissionRepository.findAll();
  }

  findByName(name: string) {
    return this.permissionRepository.findByName(name);
  }
}
