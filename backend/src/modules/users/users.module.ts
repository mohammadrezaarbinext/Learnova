import { Module } from '@nestjs/common';
import { CreateUserHandler } from './handler/create-user.handler';
import { UpdateUserHandler } from './handler/update-user.handler';
import { UserRepository } from './entity/user.repository';
import { UsersService } from './service/users.service';

@Module({
  providers: [UserRepository, CreateUserHandler, UpdateUserHandler, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
