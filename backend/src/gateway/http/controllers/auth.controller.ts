import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AuthUser } from '../../../common/types/auth-user.type';
import { AuthService } from '../../../modules/auth/service/auth.service';
import { LoginRequest } from '../request/auth/login.request';
import { ChangePasswordRequest, OtpRequest, RegisterRequest } from '../request/auth/register.request';
import { AuthResponse, MessageResponse, OtpResponse } from '../response/auth.response';
import { ErrorResponse } from '../response/error.response';
import { UserResponse } from '../response/user.response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp')
  @ApiOperation({ summary: 'Request OTP by phone' })
  @ApiCreatedResponse({
    description: 'One reusable OTP is generated and logged in backend console.',
    type: OtpResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body.', type: ErrorResponse })
  @ApiConflictResponse({ description: 'REGISTER OTP cannot be requested for an existing account.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'LOGIN or CHANGE_PASSWORD OTP requires an existing account.', type: ErrorResponse })
  requestOtp(@Body() dto: OtpRequest) {
    return this.authService.requestOtp(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register with phone, OTP, and password' })
  @ApiCreatedResponse({
    description: 'User registered, wallet created, STUDENT role assigned, and access token returned.',
    type: AuthResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired OTP.', type: ErrorResponse })
  @ApiConflictResponse({ description: 'Account already exists or default STUDENT role is missing.', type: ErrorResponse })
  register(@Body() dto: RegisterRequest) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with phone and password or phone and OTP' })
  @ApiOkResponse({
    description: 'Access token and authenticated user returned. Session metadata is stored in Redis.',
    type: AuthResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or inactive account.', type: ErrorResponse })
  login(@Body() dto: LoginRequest) {
    return this.authService.login(dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password with phone, OTP, and new password' })
  @ApiOkResponse({
    description: 'Password changed successfully.',
    type: MessageResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired OTP.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponse })
  changePassword(@Body() dto: ChangePasswordRequest) {
    return this.authService.changePassword(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Current user with roles and permissions.', type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'Missing, invalid, expired, or inactive JWT session.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'User does not have auth.me permission.', type: ErrorResponse })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('auth.me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
