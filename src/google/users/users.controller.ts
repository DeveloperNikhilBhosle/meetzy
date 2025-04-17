import { Controller, Get, Post, Query, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { userList, users } from './users';
import { util } from '../../../util';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post('menus')
  async GetMenuList(@Query() ip: users) {
    return await this.usersService.GetUserMenus(ip);
  }

  @Post('active-meetings')

  async GetActiveMeetings(@Headers('authorization') authHeader: string, @Body() ip: userList) {

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = util.extractBearerToken(authHeader);
    if (!token) {
      throw new UnauthorizedException('Missing token or email');
    }

    return await this.usersService.GetActiveMeetings(ip);
  }
}
