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

export class AddMeeting {
    @ApiProperty()
    title: string;

    @ApiProperty()
    host_email: string;

    @ApiProperty()
    meeting_type_id: number;

    @ApiProperty()
    duration_min: string;

    @ApiProperty()
    default_attendees: string; // comma seprated emails 

    @ApiProperty()
    description: string;

    @ApiProperty()
    locations: Locations[] = [];

    @ApiProperty()
    rr_hosts: Hosts[] = [];

    @ApiProperty()
    rr_host_inperson: RR_InPerson[] = [];


}

export class Locations {
    @ApiProperty()
    location_name: string;

    @ApiProperty()
    google_map_link: string;
}

export class Hosts {
    @ApiProperty()
    hosts: string;

}

export class RR_InPerson {
    @ApiProperty()
    hosts: string;

    @ApiProperty()
    location_name: string;

    @ApiProperty()
    google_map_link: string;

}
