import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
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
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { UsersService } from '../../../modules/users/service/users.service';
import { UpdateUserRequest } from '../request/users/update-user.request';
import { ErrorResponse } from '../response/error.response';
import { DeleteUserResponse, UserResponse } from '../response/user.response';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Users ordered by newest first.', type: [UserResponse] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires users.read permission.', type: ErrorResponse })
  @Permissions('users.read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'df030de8-6479-4837-a03d-65836fa80d60' })
  @ApiOkResponse({ description: 'User details with roles, permissions, and wallet.', type: UserResponse })
  @ApiBadRequestResponse({ description: 'id must be a UUID.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires users.read permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponse })
  @Permissions('users.read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'df030de8-6479-4837-a03d-65836fa80d60' })
  @ApiOkResponse({ description: 'Updated user.', type: UserResponse })
  @ApiBadRequestResponse({ description: 'Invalid id or request body.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires users.update permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponse })
  @Permissions('users.update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserRequest) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', format: 'uuid', example: 'df030de8-6479-4837-a03d-65836fa80d60' })
  @ApiOkResponse({ description: 'Delete confirmation.', type: DeleteUserResponse })
  @ApiBadRequestResponse({ description: 'id must be a UUID.', type: ErrorResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT.', type: ErrorResponse })
  @ApiForbiddenResponse({ description: 'Requires users.delete permission.', type: ErrorResponse })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponse })
  @Permissions('users.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
