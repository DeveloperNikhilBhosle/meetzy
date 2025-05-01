import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.auth';
import { LinkWebhook } from './developer.dto';

@Controller('api')
@ApiTags('Developer Setting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) { }

  @Post('link-webhook')
  async AddWebhook(@Body() ip: LinkWebhook) {
    return this.developerService.SaveWebhook(ip);
  }

}
