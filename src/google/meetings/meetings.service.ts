import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { scheduleMeet } from './data-models/google-meeting';
import { user_accountsInMasters, user_meetingsInMasters, usersInMasters } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, sql } from 'drizzle-orm';
import { util } from '../../../util';


@Injectable()
export class MeetingsService {

    constructor(private readonly meetzy: MeetZyDrizzleService) { }



    //#region Schedule Google Calendar
    async scheduleMeet(meetdetails: scheduleMeet) {

        var users = await this.meetzy.db.select({
            user_id: usersInMasters.id,
            email: user_accountsInMasters.email,
            client_id: user_accountsInMasters.client_id,
            client_secret: user_accountsInMasters.client_secret,
            is_active: user_accountsInMasters.is_active,
            is_validated: user_accountsInMasters.is_validated,
            title: user_meetingsInMasters.title,
            description: user_meetingsInMasters.description,
            host: user_meetingsInMasters.host,
            default_attendees: user_meetingsInMasters.default_attendees,

        })
            .from(usersInMasters)
            .innerJoin(user_accountsInMasters, eq(usersInMasters.id, user_accountsInMasters.user_id))
            .innerJoin(user_meetingsInMasters, eq(user_accountsInMasters.id, user_meetingsInMasters.account_id))
            .where(and(eq(user_accountsInMasters.id, meetdetails.account_id), eq(user_accountsInMasters.is_active, true)
                , eq(user_accountsInMasters.is_validated, true), eq(usersInMasters.is_active, true)));

        if (users.length == 0) {
            throw new BadRequestException("User not found");
        }

        console.log(users, 'users');
        //#region Schedule Google Calendar  



        var token = await this.GetUserToken(meetdetails.account_id);

        // Define the type of objects in the attendees array
        type Attendee = {
            email: string;
        };

        var attendees: Attendee[] = []; // Define the attendees array type
        attendees.push({ email: meetdetails.primary_email });

        if (meetdetails.secondary_email != undefined && meetdetails.secondary_email != null && meetdetails.secondary_email != "") {
            attendees.push({ email: meetdetails.secondary_email });
        }

        if (users[0].default_attendees != undefined && users[0].default_attendees != null && users[0].default_attendees != "") {
            const arr = users[0].default_attendees.split(",");
            arr.forEach(item => {
                attendees.push({ email: item.trim() });
            });
        }

        const randormcode = await util.generateRandomCode(5);

        const axios = require('axios');
        let data = JSON.stringify({
            "summary": users[0].title,
            "description": users[0].description,
            "location": "",
            "start": {
                "dateTime": meetdetails.start_time,
                "timeZone": "Asia/Kolkata"
            },
            "end": {
                "dateTime": meetdetails.end_time,
                "timeZone": "Asia/Kolkata"
            },
            "attendees": attendees,
            "conferenceData": {
                "createRequest": {
                    "requestId": randormcode
                }
            }
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            data: data
        };

        var meeting = await axios.request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
                return response.data;
            })
            .catch((error) => {
                console.log(error);
            });



        //#endregion


        return meeting;

    }

    //#endregion



    //#region Get Token 

    async GetUserToken(user_account_id: number) {
        var account_details = await this.meetzy.db.select()
            .from(user_accountsInMasters)
            .where(and(eq(user_accountsInMasters.id, user_account_id), eq(user_accountsInMasters.is_validated, true), eq(user_accountsInMasters.is_active, true)));

        if (account_details.length == 0) {
            throw new NotFoundException("User account not active");
        }


        const axios = require('axios');
        const qs = require('qs');
        let data = qs.stringify({
            'client_id': account_details[0].client_id,
            'client_secret': account_details[0].client_secret,
            'refresh_token': account_details[0].refresh_token,
            'grant_type': 'refresh_token'
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://oauth2.googleapis.com/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        };

        var access_token = await axios.request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
                return response.data.access_token;
            })
            .catch((error) => {
                console.log(error);
            });

        return access_token;

    }


    //#endregion


}
