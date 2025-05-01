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
}

export class Header {
    @ApiProperty()
    token: string
}

export class UserAccount {
    @ApiProperty()
    name: string

    @ApiProperty()
    email: string

    @ApiProperty()
    enterprise_id: number

    @ApiProperty()
    code: string
}

export class GenerateLink {
    @ApiProperty()
    enterprise_id: number
}