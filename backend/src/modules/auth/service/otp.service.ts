import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from '../entity/auth.repository';
import { OtpEntity, OtpType } from '../entity/auth.entity';

const OTP_TTL_SECONDS = 2 * 60;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async generate(phone: string, type: OtpType): Promise<OtpEntity> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.authRepository.saveOtp(phone, type, otp, OTP_TTL_SECONDS);
    this.logger.warn(`LearnNova OTP generated | type=${type} | phone=${phone} | otp=${otp} | expiresIn=${OTP_TTL_SECONDS}s`);

    return {
      ok: true,
      message: 'OTP generated and logged by backend.',
    };
  }

  async verifyAndConsume(phone: string, type: OtpType, otp: string): Promise<void> {
    await this.verify(phone, type, otp);
    await this.authRepository.deleteOtp(phone, type);
  }

  async verify(phone: string, type: OtpType, otp: string): Promise<void> {
    const storedOtp = await this.authRepository.getOtp(phone, type);
    if (!storedOtp || storedOtp.otp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
  }
}
