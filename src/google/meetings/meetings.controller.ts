import { Body, Controller, Post } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { ApiTags } from '@nestjs/swagger';
import { scheduleMeet } from './data-models/google-meeting';

@Controller('api/schedule/')
@ApiTags('Google Meetings API')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) { }

  @Post('google-meeting')
  async scheudlemeet(@Body() meetdetails: scheduleMeet) {

    console.log(meetdetails);
    return await this.meetingsService.scheduleMeet(meetdetails);

  }
}
