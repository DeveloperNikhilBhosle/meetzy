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
  async GetActiveMeetings(@Request() req, @Body() ip: userList) {

    const { userId, email } = req.user;
    return await this.usersService.GetActiveMeetings(ip, email, userId);
  }

  @Post('user-dashboard-score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async GetScores(@Request() req) {
    const { user_id, email } = req.user;  // Extract userId and email from req.user
    console.log(user_id, 'userId new');
    return await this.usersService.GetScores(email?.toString());

  }

  @Get('user-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async GetUserProfile(@Request() req) {
    const { user_id, email } = req.user;  // Extract userId and email from req.user

    return await this.usersService.GetScores(email?.toString());
  }
}
