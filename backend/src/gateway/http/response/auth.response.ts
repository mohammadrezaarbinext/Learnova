import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from './user.response';

export class AuthResponse {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjAzMGRlOC02NDc5LTQ4MzctYTAzZC02NTgzNmZhODBkNjAiLCJlbWFpbCI6InNhcmFAbGVhcm5vdmEuY29tIiwianRpIjoiYjVmYjI5NTEtZmM3My00NDlmLWEzYTUtMmI1MGU1YzIzZTQxIn0.signature',
  })
  accessToken: string;

  @ApiProperty({ type: UserResponse })
  user: UserResponse;
}
