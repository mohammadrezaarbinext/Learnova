import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginRequest } from '../../../gateway/http/request/auth/login.request';
import { SanitizedUser, toUserResponse, UserStatus } from '../../users/entity/user.entity';
import { UsersService } from '../../users/service/users.service';

@Injectable()
export class LoginHandler {
  constructor(private readonly usersService: UsersService) {}

  async login(dto: LoginRequest & { password: string }): Promise<SanitizedUser> {
    const user = await this.usersService.findByPhoneWithPassword(dto.phone);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid phone or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    return toUserResponse(user);
  }

  async loginWithVerifiedPhone(phone: string): Promise<SanitizedUser> {
    const user = await this.usersService.findByPhoneWithPassword(phone);

    if (!user) {
      throw new UnauthorizedException('Invalid phone or OTP');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    return toUserResponse(user);
  }
}
