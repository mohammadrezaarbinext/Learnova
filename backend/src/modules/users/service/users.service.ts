import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../../common/types/auth-user.type';
import { UserRepository } from '../entity/user.repository';
import { toUserResponse } from '../entity/user.entity';
import { CreateUserHandler } from '../handler/create-user.handler';
import { UpdateUserHandler } from '../handler/update-user.handler';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createUserHandler: CreateUserHandler,
    private readonly updateUserHandler: UpdateUserHandler,
  ) {}

  async createStudentUser(data: {
    fullName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    const user = await this.createUserHandler.createStudent(data);
    return toUserResponse(user);
  }

  async findAll() {
    const users = await this.userRepository.findAll();
    return users.map(toUserResponse);
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async findAuthUserById(id: string): Promise<AuthUser> {
    return this.findOne(id);
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await this.updateUserHandler.update(id, data);
    return toUserResponse(user);
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.delete(id);
    return { id, deleted: true };
  }
}
