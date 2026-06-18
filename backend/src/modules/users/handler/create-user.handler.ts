import { ConflictException, Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { UserRepository } from '../entity/user.repository';

@Injectable()
export class CreateUserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async createStudent(data: {
    fullName: string;
    email?: string;
    phone: string;
    passwordHash: string;
  }) {
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
