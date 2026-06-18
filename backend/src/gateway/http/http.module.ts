import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { UsersModule } from '../../modules/users/users.module';
import { WalletsModule } from '../../modules/wallets/wallets.module';
import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { WalletsController } from './controllers/wallets.controller';

@Module({
  imports: [AuthModule, UsersModule, WalletsModule],
  controllers: [AuthController, UsersController, WalletsController],
})
export class HttpModule {}
