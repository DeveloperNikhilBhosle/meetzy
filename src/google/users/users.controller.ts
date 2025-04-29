import { Controller, Request, Get, Post, Query, Body, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Header, userList, users } from './users';
import { util } from '../../../util';
import { Helper } from 'helper';
import { JwtAuthGuard } from '../auth/jwt.auth';

@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }


  @Post('menus')
  async GetMenuList(@Query() ip: users) {
    return await this.usersService.GetUserMenus(ip);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async GetScores(@Request() req) {
    const { userId, email } = req.user;  // Extract userId and email from req.user
    return await this.usersService.GetScores(email?.toString());

  }
}
