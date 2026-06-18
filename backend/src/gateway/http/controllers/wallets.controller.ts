import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AuthUser } from '../../../common/types/auth-user.type';
import { WalletsService } from '../../../modules/wallets/service/wallets.service';
import { UpdateWalletBalanceRequest } from '../request/wallets/update-wallet-balance.request';
import { ErrorResponse } from '../response/error.response';
import { WalletResponse } from '../response/wallet.response';

@ApiTags('Wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user wallet' })
  @ApiOkResponse({ description: 'Current authenticated user wallet.', type: WalletResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'Wallet not found.', type: ErrorResponse })
  findMine(@CurrentUser() user: AuthUser) {
    return this.walletsService.findByUserId(user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a wallet by user id' })
  @ApiParam({ name: 'userId', format: 'uuid', example: 'df030de8-6479-4837-a03d-65836fa80d60' })
  @ApiOkResponse({ description: 'Wallet for the requested user.', type: WalletResponse })
  @ApiBadRequestResponse({ description: 'userId must be a UUID.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires wallets.read permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'Wallet not found.', type: ErrorResponse })
  @Permissions('wallets.read')
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.walletsService.findByUserId(userId);
  }

  @Patch(':userId/balance')
  @ApiOperation({ summary: 'Update a wallet balance' })
  @ApiParam({ name: 'userId', format: 'uuid', example: 'df030de8-6479-4837-a03d-65836fa80d60' })
  @ApiOkResponse({ description: 'Updated wallet.', type: WalletResponse })
  @ApiBadRequestResponse({ description: 'Invalid userId or request body.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires wallets.update permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'Wallet not found.', type: ErrorResponse })
  @Permissions('wallets.update')
  updateBalance(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: UpdateWalletBalanceRequest) {
    return this.walletsService.updateBalance(userId, dto.balance);
  }
}
