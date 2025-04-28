import { ApiProperty } from "@nestjs/swagger";

export class users {
    @ApiProperty()
    email_id: string
}

export class userList {
    @ApiProperty()
    from_date: string

    @ApiProperty()
    to_date: string

    @ApiProperty()
    user_id: number
}

export class Header {
    @ApiProperty()
    token: string
}