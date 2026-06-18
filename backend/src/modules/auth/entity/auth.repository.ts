import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infra/redis/redis.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly redisService: RedisService) {}

  saveSession(jti: string, metadata: { userId: string; email: string; createdAt: string }, ttlSeconds: number) {
    return this.redisService.setJson(`auth:session:${jti}`, metadata, ttlSeconds);
  }
}
