import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterRequest } from '../../../gateway/http/request/auth/register.request';
import { UsersService } from '../../users/service/users.service';

@Injectable()
export class RegisterHandler {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterRequest) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.usersService.createStudentUser({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });
  }
}
