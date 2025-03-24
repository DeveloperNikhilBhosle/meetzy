import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Get('time-slots')
  async getTimeSlots(@Param('meeting_id') meeting_id: number) {
    // TODO: Implement this method
    // var x = new { "meeting_id": meeting_id };
  }
}
