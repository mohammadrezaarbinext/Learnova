import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { LoginRequest } from '../../../gateway/http/request/auth/login.request';
import { RegisterRequest } from '../../../gateway/http/request/auth/register.request';
import { AuthEntity } from '../entity/auth.entity';
import { AuthRepository } from '../entity/auth.repository';
import { LoginHandler } from '../handler/login.handler';
import { RegisterHandler } from '../handler/register.handler';
import { SanitizedUser } from '../../users/entity/user.entity';

const FALLBACK_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly registerHandler: RegisterHandler,
    private readonly loginHandler: LoginHandler,
  ) {}

  async register(dto: RegisterRequest): Promise<AuthEntity> {
    const user = await this.registerHandler.register(dto);
    return this.createAuthResponse(user);
  }

  async login(dto: LoginRequest): Promise<AuthEntity> {
    const user = await this.loginHandler.login(dto);
    return this.createAuthResponse(user);
  }

  private async createAuthResponse(user: SanitizedUser): Promise<AuthEntity> {
    const jti = randomUUID();
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
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
        email: user.email,
        createdAt: new Date().toISOString(),
      },
      ttlSeconds,
    );

    return { accessToken, user };
  }
}
