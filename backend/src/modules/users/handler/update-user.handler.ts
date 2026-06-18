import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository } from '../entity/user.repository';

@Injectable()
export class UpdateUserHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepository.update(id, data);
  }
}
