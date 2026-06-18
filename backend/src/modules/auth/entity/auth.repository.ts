import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infra/redis/redis.service';
import { OtpType } from './auth.entity';

@Injectable()
export class AuthRepository {
  constructor(private readonly redisService: RedisService) {}

  saveSession(
    jti: string,
    metadata: { userId: number; userUuid: string; phone: string; email: string | null; createdAt: string },
    ttlSeconds: number,
  ) {
    return this.redisService.setJson(`auth:session:${jti}`, metadata, ttlSeconds);
  }

  saveOtp(phone: string, type: OtpType, otp: string, ttlSeconds: number) {
    return this.redisService.setJson(this.otpKey(phone, type), { otp, type }, ttlSeconds);
  }

  getOtp(phone: string, type: OtpType) {
    return this.redisService.getJson<{ otp: string; type: OtpType }>(this.otpKey(phone, type));
  }

  deleteOtp(phone: string, type: OtpType) {
    return this.redisService.delete(this.otpKey(phone, type));
  }

  private otpKey(phone: string, type: OtpType) {
    return `auth:otp:${type}:${phone}`;
  }
}
