import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infra/redis/redis.service';
import { OtpType } from './auth.entity';

export type SessionMetadata = {
  userId: number;
  userUuid: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

export type StoredOtp = {
  otp: string;
  type: OtpType;
};

@Injectable()
export class AuthRepository {
  constructor(private readonly redisService: RedisService) {}

  saveSession(jti: string, metadata: SessionMetadata, ttlSeconds: number): Promise<void> {
    return this.redisService.setJson(`auth:session:${jti}`, metadata, ttlSeconds);
  }

  saveOtp(phone: string, type: OtpType, otp: string, ttlSeconds: number): Promise<void> {
    return this.redisService.setJson(this.otpKey(phone, type), { otp, type }, ttlSeconds);
  }

  getOtp(phone: string, type: OtpType): Promise<StoredOtp | null> {
    return this.redisService.getJson<StoredOtp>(this.otpKey(phone, type));
  }

  deleteOtp(phone: string, type: OtpType): Promise<void> {
    return this.redisService.delete(this.otpKey(phone, type));
  }

  private otpKey(phone: string, type: OtpType): string {
    return `auth:otp:${type}:${phone}`;
  }
}
