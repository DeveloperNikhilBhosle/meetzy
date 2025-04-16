import { ApiProperty } from "@nestjs/swagger";

export class scheduleMeet {
    @ApiProperty()
    start_time: string;

    @ApiProperty()
    end_time: string;

    @ApiProperty()
    account_id: number;

    @ApiProperty()
    name: string[];

    @ApiProperty()
    phone_number: string;

    @ApiProperty()
    primary_email: string;

    @ApiProperty()
    secondary_email: string;

}

export class TimeSlotsIP {
    @ApiProperty()
    meeting_id: number;
}
