import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
import { RedisService } from '../../infra/redis/redis.service';
import { UsersService } from '../../modules/users/service/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const session = await this.redisService.getJson<{ userUuid: string }>(`auth:session:${payload.jti}`);
    if (!session || session.userUuid !== payload.sub) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return this.usersService.findAuthUserByUuid(payload.sub);
  }
}
