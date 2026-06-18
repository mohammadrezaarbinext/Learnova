import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../../../gateway/http/request/auth/login.request';
import { toUserResponse } from '../../users/entity/user.entity';
import { UsersService } from '../../users/service/users.service';

@Injectable()
export class LoginHandler {
  constructor(private readonly usersService: UsersService) {}

  async login(dto: LoginRequest) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    return toUserResponse(user);
  }
}
