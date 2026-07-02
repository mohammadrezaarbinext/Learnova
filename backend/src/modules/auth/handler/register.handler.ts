import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { toIranianPhone } from '../../../common/utils/phone.util';
import { RegisterRequest } from '../../../gateway/http/request/auth/register.request';
import { SanitizedUser } from '../../users/entity/user.entity';
import { UsersService } from '../../users/service/users.service';

@Injectable()
export class RegisterHandler {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterRequest): Promise<SanitizedUser> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const phone = toIranianPhone(dto.phone);

    return this.usersService.createStudentUser({
      fullName: phone,
      phone,
      passwordHash,
    });
  }
}
