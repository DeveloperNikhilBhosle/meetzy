import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { userList, users } from './users';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post('menus')
  async GetMenuList(@Query() ip: users) {
    return await this.usersService.GetUserMenus(ip);
  }

  @Post('active-meetings')
  async GetActiveMeetings(@Body() ip: userList) {
    return await this.usersService.GetActiveMeetings(ip);
  }
}
