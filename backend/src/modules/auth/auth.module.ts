import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AuthRepository } from './entity/auth.repository';
import { LoginHandler } from './handler/login.handler';
import { RegisterHandler } from './handler/register.handler';
import { AuthService } from './service/auth.service';
import { OtpService } from './service/otp.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AuthRepository, RegisterHandler, LoginHandler, AuthService, OtpService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
