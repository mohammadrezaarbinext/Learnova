import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../core/entity/base.entity';

export enum RoleName {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  SUPPORT = 'SUPPORT',
}

const roleNameMap: Record<string, RoleName | undefined> = {
  [RoleName.ADMIN]: RoleName.ADMIN,
  [RoleName.TEACHER]: RoleName.TEACHER,
  [RoleName.STUDENT]: RoleName.STUDENT,
  [RoleName.SUPPORT]: RoleName.SUPPORT,
};

@Entity('Role')
export class RoleEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({
    type: 'enum',
    enum: RoleName,
  })
  name!: RoleName;

  @Column({ nullable: true })
  description!: string | null;
}

type RolePersistence = Omit<RoleEntity, 'name'> & {
  name: string;
};

export function toRoleName(value: string): RoleName {
  const roleName = roleNameMap[value];
  if (!roleName) {
    throw new Error(`Unsupported role name: ${value}`);
  }

  return roleName;
}

export function toRoleEntity(role: RolePersistence): RoleEntity {
  return {
    id: role.id,
    uuid: role.uuid,
    name: toRoleName(role.name),
    description: role.description,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}
