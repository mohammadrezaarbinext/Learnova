import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from '../entity/user.repository';

@Injectable()
export class UpdateUserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async update(uuid: string, data: Prisma.UserUpdateInput) {
    const user = await this.userRepository.findByUuid(uuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.updateByUuid(uuid, data);
  }
}
