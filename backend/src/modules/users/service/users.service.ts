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
    email?: string;
    phone: string;
    passwordHash: string;
  }) {
    const user = await this.createUserHandler.createStudent(data);
    return toUserResponse(user);
  }

  async findAll() {
    const users = await this.userRepository.findAll();
    return users.map(toUserResponse);
  }

  async findOne(uuid: string) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async findAuthUserByUuid(uuid: string): Promise<AuthUser> {
    return this.findOne(uuid);
  }

  async findByEmailWithPassword(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByPhoneWithPassword(phone: string) {
    return this.userRepository.findByPhone(phone);
  }

  async findByPhone(phone: string) {
    const user = await this.userRepository.findByPhone(phone);
    return user ? toUserResponse(user) : null;
  }

  async updatePassword(id: number, passwordHash: string) {
    const user = await this.userRepository.updatePassword(id, passwordHash);
    return toUserResponse(user);
  }

  async update(uuid: string, data: Prisma.UserUpdateInput) {
    const user = await this.updateUserHandler.update(uuid, data);
    return toUserResponse(user);
  }

  async remove(uuid: string) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deleteByUuid(uuid);
    return { id: user.id, uuid: user.uuid, deleted: true };
  }
}
