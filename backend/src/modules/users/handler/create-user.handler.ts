import { ConflictException, Injectable } from '@nestjs/common';
import { RoleName } from '../../roles/entity/role.entity';
import type { UserEntity } from '../entity/user.entity';
import type { CreateStudentUserData } from '../entity/user.repository';
import { UserRepository } from '../entity/user.repository';

type CreateStudentData = Omit<CreateStudentUserData, 'studentRoleId'>;

@Injectable()
export class CreateUserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async createStudent(data: CreateStudentData): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByPhone(data.phone);
    if (existingUser) {
      throw new ConflictException('Account already exists');
    }

    const studentRole = await this.userRepository.findRoleByName(RoleName.STUDENT);
    if (!studentRole) {
      throw new ConflictException('Default STUDENT role is missing. Run npm run db:seed.');
    }

    return this.userRepository.createStudentUser({
      ...data,
      studentRoleId: studentRole.id,
    });
  }
}
