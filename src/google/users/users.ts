import { ApiProperty } from "@nestjs/swagger";

export class users {
    @ApiProperty()
    email_id: string
}

export class userList {
    @ApiProperty()
    email_id: string[] = []

    @ApiProperty()
    from_date: string

    @ApiProperty()
    to_date: string
}