import { ApiProperty } from "@nestjs/swagger";

export class LinkWebhook {
    @ApiProperty()
    api_url: string

    @ApiProperty()
    event_type_id: number

    @ApiProperty()
    enterprise_id: number

    @ApiProperty()
    user_name: string

    @ApiProperty()
    password: string
}