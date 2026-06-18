import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginRequest } from '../../../gateway/http/request/auth/login.request';
import { ChangePasswordRequest, OtpRequest, RegisterRequest } from '../../../gateway/http/request/auth/register.request';
import { AuthEntity } from '../entity/auth.entity';
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

  async requestOtp(dto: OtpRequest) {
    const user = await this.usersService.findByPhone(dto.phone);

    if (dto.type === 'REGISTER' && user) {
      throw new ConflictException('This account already exists');
    }

    if ((dto.type === 'LOGIN' || dto.type === 'CHANGE_PASSWORD') && !user) {
      throw new NotFoundException('User not found');
    }

    return this.otpService.generate(dto.phone, dto.type);
  }

  async register(dto: RegisterRequest): Promise<AuthEntity> {
    await this.otpService.verifyAndConsume(dto.phone, 'REGISTER', dto.otp);

    const existingUser = await this.usersService.findByPhone(dto.phone);
    if (existingUser) {
      throw new ConflictException('This account already exists');
    }

    const user = await this.registerHandler.register(dto);
    return this.createAuthResponse(user);
  }

  async login(dto: LoginRequest): Promise<AuthEntity> {
    if (dto.password) {
      const user = await this.loginHandler.login({ ...dto, password: dto.password });
      return this.createAuthResponse(user);
    }

    if (dto.otp) {
      await this.otpService.verifyAndConsume(dto.phone, 'LOGIN', dto.otp);
      const user = await this.loginHandler.loginWithVerifiedPhone(dto.phone);
      return this.createAuthResponse(user);
    }

    throw new BadRequestException('password or otp is required');
  }

  async changePassword(dto: ChangePasswordRequest) {
    await this.otpService.verifyAndConsume(dto.phone, 'CHANGE_PASSWORD', dto.otp);

    const user = await this.usersService.findByPhoneWithPassword(dto.phone);
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
}
