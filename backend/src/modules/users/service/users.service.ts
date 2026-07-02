import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../../common/types/auth-user.type';
import { toIranianPhone } from '../../../common/utils/phone.util';
import { CreateStudentUserData, UserRepository } from '../entity/user.repository';
import { DeleteUserEntity, SanitizedUser, toUserResponse, UpdateUserData, UserWithPasswordEntity } from '../entity/user.entity';
import { CreateUserHandler } from '../handler/create-user.handler';
import { UpdateUserHandler } from '../handler/update-user.handler';

type CreateStudentUserInput = Omit<CreateStudentUserData, 'studentRoleId'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createUserHandler: CreateUserHandler,
    private readonly updateUserHandler: UpdateUserHandler,
  ) {}

  async createStudentUser(data: CreateStudentUserInput): Promise<SanitizedUser> {
    const user = await this.createUserHandler.createStudent({
      ...data,
      phone: toIranianPhone(data.phone),
    });
    return toUserResponse(user);
  }

  async findAll(): Promise<SanitizedUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toUserResponse);
  }

  async findOne(uuid: string): Promise<SanitizedUser> {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async findAuthUserByUuid(uuid: string): Promise<AuthUser> {
    return this.findOne(uuid);
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPasswordEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByPhoneWithPassword(phone: string): Promise<UserWithPasswordEntity | null> {
    return this.userRepository.findByPhone(toIranianPhone(phone));
  }

  async findByPhone(phone: string): Promise<SanitizedUser | null> {
    const user = await this.userRepository.findByPhone(toIranianPhone(phone));
    return user ? toUserResponse(user) : null;
  }

  async updatePassword(id: number, passwordHash: string): Promise<SanitizedUser> {
    const user = await this.userRepository.updatePassword(id, passwordHash);
    return toUserResponse(user);
  }

  async update(uuid: string, data: UpdateUserData): Promise<SanitizedUser> {
    const user = await this.updateUserHandler.update(uuid, {
      ...data,
      phone: data.phone ? toIranianPhone(data.phone) : undefined,
    });
    return toUserResponse(user);
  }

  async remove(uuid: string): Promise<DeleteUserEntity> {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.deleteByUuid(uuid);
    return { id: user.id, uuid: user.uuid, deleted: true };
  }
}
