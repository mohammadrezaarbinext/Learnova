import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from './user.response';

export class AuthResponse {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjAzMGRlOC02NDc5LTQ4MzctYTAzZC02NTgzNmZhODBkNjAiLCJwaG9uZSI6IjA5OTIwMjA2MzMyIiwianRpIjoiYjVmYjI5NTEtZmM3My00NDlmLWEzYTNhNS0yYjUwZTVjMjNlNDEifQ.signature',
  })
  accessToken: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}

export class OtpResponse {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 'OTP generated and logged by backend.' })
  message: string;
}

export class MessageResponse {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 'Password changed successfully.' })
  message: string;
}
