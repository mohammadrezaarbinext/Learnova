import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

@Entity('Permission')
export class PermissionEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  name!: string;

  @Column({ nullable: true })
  description!: string | null;
}

export function toPermissionEntity(permission: PermissionEntity): PermissionEntity {
  return {
    id: permission.id,
    uuid: permission.uuid,
    name: permission.name,
    description: permission.description,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt,
  };
}
