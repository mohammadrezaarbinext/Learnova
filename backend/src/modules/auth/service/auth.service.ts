import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { toIranianPhone } from '../../../common/utils/phone.util';
import { LoginRequest } from '../../../gateway/http/request/auth/login.request';
import { ChangePasswordRequest, OtpRequest, RegisterRequest, VerifyOtpRequest } from '../../../gateway/http/request/auth/register.request';
import { AuthEntity, MessageEntity, OtpEntity } from '../entity/auth.entity';
import { AuthRepository } from '../entity/auth.repository';
import { LoginHandler } from '../handler/login.handler';
import { RegisterHandler } from '../handler/register.handler';
import { SanitizedUser } from '../../users/entity/user.entity';
import { UsersService } from '../../users/service/users.service';
import { OtpService } from './otp.service';

const FALLBACK_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
  ) {}

  async requestOtp(dto: OtpRequest): Promise<OtpEntity> {
    const phone = toIranianPhone(dto.phone);
    await this.validateOtpTarget(phone, dto.type);
    return this.otpService.generate(phone, dto.type);
  }

  async verifyOtp(dto: VerifyOtpRequest): Promise<MessageEntity> {
    const phone = toIranianPhone(dto.phone);
    await this.validateOtpTarget(phone, dto.type);
    await this.otpService.verify(phone, dto.type, dto.otp);

    return {
      ok: true,
      message: 'OTP verified successfully.',
    };
  }

  async register(dto: RegisterRequest): Promise<AuthEntity> {
    const phone = toIranianPhone(dto.phone);
    await this.otpService.verifyAndConsume(phone, 'REGISTER', dto.otp);

    const existingUser = await this.usersService.findByPhone(phone);
    if (existingUser) {
      throw new ConflictException('This account already exists');
    }

    const user = await this.registerHandler.register({ ...dto, phone });
    return this.createAuthResponse(user);
  }

  async login(dto: LoginRequest): Promise<AuthEntity> {
    const phone = toIranianPhone(dto.phone);

    if (dto.password) {
      const user = await this.loginHandler.login({ ...dto, phone, password: dto.password });
      return this.createAuthResponse(user);
    }

    if (dto.otp) {
      await this.otpService.verifyAndConsume(phone, 'LOGIN', dto.otp);
      const user = await this.loginHandler.loginWithVerifiedPhone(phone);
      return this.createAuthResponse(user);
    }

    throw new BadRequestException('password or otp is required');
  }

  async changePassword(dto: ChangePasswordRequest): Promise<MessageEntity> {
    const phone = toIranianPhone(dto.phone);
    await this.otpService.verifyAndConsume(phone, 'CHANGE_PASSWORD', dto.otp);

    const user = await this.usersService.findByPhoneWithPassword(phone);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.usersService.updatePassword(user.id, passwordHash);

    return {
      ok: true,
      message: 'Password changed successfully.',
    };
  }

  private async createAuthResponse(user: SanitizedUser): Promise<AuthEntity> {
    const jti = randomUUID();
    const accessToken = await this.jwtService.signAsync({
      sub: user.uuid,
      phone: user.phone,
      jti,
    });
    const decodedToken = this.jwtService.decode(accessToken) as { exp?: number } | null;
    const ttlSeconds = decodedToken?.exp
      ? Math.max(decodedToken.exp - Math.floor(Date.now() / 1000), 1)
      : FALLBACK_SESSION_TTL_SECONDS;

    await this.authRepository.saveSession(
      jti,
      {
        userId: user.id,
        userUuid: user.uuid,
        phone: user.phone,
        email: user.email,
        createdAt: new Date().toISOString(),
      },
      ttlSeconds,
    );

    return { accessToken, user };
  }

  private async validateOtpTarget(phone: string, type: VerifyOtpRequest['type']): Promise<void> {
    const user = await this.usersService.findByPhone(phone);

    if (type === 'REGISTER' && user) {
      throw new ConflictException('This account already exists');
    }

    if ((type === 'LOGIN' || type === 'CHANGE_PASSWORD') && !user) {
      throw new NotFoundException('User not found');
    }
  }
}
