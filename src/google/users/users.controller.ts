import { Controller, Get, Post, Query, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { Header, userList, users } from './users';
import { util } from '../../../util';
import { Helper } from 'helper';

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

    return await this.usersService.GetActiveMeetings(ip, token);
  }

  @Post('user-dashboard-score')
  async GetScores(@Headers() authHeader: Header) {
    console.log(authHeader, 'auth');
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    // const token = util.extractBearerToken(authHeader.token);
    // if (!token) {
    //   throw new UnauthorizedException('Missing token or email');
    // }

    const email = await new Helper().GetEmailByGoogleToken(authHeader.token) ?? 'defaultString';
    console.log(email, 'emaoil');

    return await this.usersService.GetScores(email?.toString());

  }
}
