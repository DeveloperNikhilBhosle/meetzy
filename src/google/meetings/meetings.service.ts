import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { scheduleMeet } from './data-models/google-meeting';
import { user_accountsInMasters, user_meetingsInMasters, user_timeslotsInMasters, usersInMasters } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, sql, or } from 'drizzle-orm';
import { util } from '../../../util';
import { bytes } from 'drizzle-orm/gel-core';
import { datetime } from 'drizzle-orm/mysql-core';
import { parseISO, format, isBefore, isAfter, addMinutes } from 'date-fns';
import * as moment from 'moment';
import { DateTime } from 'luxon';

@Injectable()
export class MeetingsService {

    private workingHoursStart = "09:00:00";
    private workingHoursEnd = "18:00:00";

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

        // console.log(users, 'users');
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
                // console.log(JSON.stringify(response.data));
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
                // console.log(JSON.stringify(response.data));
                return response.data.access_token;
            })
            .catch((error) => {
                console.log(error);
            });

        return access_token;

    }


    //#endregion

    //#region Get Calendar Availability

    async GetAvailability(meeting_id: number) {

        console.log(meeting_id);

        //#region available slots as per database
        var account_id = await this.meetzy.db.select()
            .from(user_meetingsInMasters)
            .where(and(eq(user_meetingsInMasters.id, meeting_id)));

        var query = "select * from get_user_timeslots(" + meeting_id.toString() + "," + account_id[0].account_id?.toString() + ")"
        // console.log(query);
        var calc = await this.meetzy.db.execute(sql`${sql.raw(query)};`);

        const available_slots = calc.rows;
        // console.log(available_slots, 'available')

        //(sql`select * from get_user_timeslots(`${meeting_id}`,1)`)

        //#region 

        //#region Busy slots as per google



        // Get today's date at 12:01 AM
        const today = new Date();
        today.setHours(0, 1, 0, 0);  // Set time to 12:01 AM

        // Get the date 30 days from today at 11:59 PM
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);
        futureDate.setHours(23, 59, 0, 0);  // Set time to 11:59 PM

        const token = await this.GetUserToken(account_id[0].id);
        // console.log(token);

        const axios = require('axios');
        let data = JSON.stringify({
            "timeMin": util.formatDate(today),
            "timeMax": util.formatDate(futureDate),
            "timeZone": "Asia/Kolkata",
            "items": [
                {
                    "id": account_id[0].host
                }
            ]
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://www.googleapis.com/calendar/v3/freeBusy',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            data: data
        };

        var busycalc = await axios.request(config)
            .then((response) => {
                // console.log(JSON.stringify(response.data));
                return response.data;
            })
            .catch((error) => {
                console.log(error);
            });

        // console.log('\n'); console.log(''); console.log('')

        const busy = busycalc.calendars[account_id[0].host].busy;


        //#endregion

        //#region Temp 




        // Set start of day to current date + 1 hour
        const startOfDay = moment().add(1, 'hour').startOf('minute');  // Adds 1 hour and rounds down to the nearest minute
        console.log(startOfDay, 'startOfDay');

        // Set end of day to current date + 30 days at 24:00
        const endOfDay = moment().add(30, 'days').endOf('day');  // End of the day (24:00) in 30 days
        console.log(endOfDay, 'endofdayta')

        const availableSlots: TimeSlot[] = [];

        var A = await this.transformSlots_Busy(busy);
        var B = await this.transformSlotsFromDay_Availability(available_slots);
        var C = await this.calculateFinalAvailability(A.sort(x => x.date), B.sort(x => x.date));


        return {
            // booked_calendar: busy,
            formatted_busy_calendar: A,
            availability_added: B,
            Diff: C

        }

        // Add an event before the start of the day (we consider the day starts at startOfDay)
        var busyv2 = busy.filter(event => event.end.isAfter(startOfDay));

        let prevEndTime = startOfDay;

        console.log(busyv2, 'busyv2');


        // Loop through each busy slot and find gaps
        busyv2.forEach(event => {
            // Check for a gap between previous end time and current event's start time
            if (event.start.isAfter(prevEndTime)) {
                availableSlots.push({
                    start: prevEndTime.format(),
                    end: event.start.format()
                });
            }
            // Update the prevEndTime to the end of the current busy event
            prevEndTime = event.end;
        });

        // After the last busy event, check if there's any time left till the end of the day
        if (prevEndTime.isBefore(endOfDay)) {
            availableSlots.push({
                start: prevEndTime.format(),
                end: endOfDay.format()
            });
        }

        return availableSlots;



        //#endregion




    }

    transformSlots_Busy(input: any[]): any[] {
        // Group by date and transform time slots
        const groupedByDate = input.reduce((acc, current) => {
            const date = current.start.split('T')[0]; // Extract date part (YYYY-MM-DD)
            const from_time = current.start.split('T')[1]; // Extract from_time (HH:MM:SS)
            const to_time = current.end.split('T')[1]; // Extract to_time (HH:MM:SS)

            if (!acc[date]) {
                acc[date] = { date, slots: [] };
            }

            acc[date].slots.push({
                from_time,
                to_time
            });

            return acc;
        }, {});

        // Convert the grouped data into an array
        return Object.values(groupedByDate);
    }

    transformSlotsFromDay_Availability(input: any[]): any[] {
        // Group by date and transform the time slots
        const groupedByDate = input.reduce((acc, current) => {
            const { date, from_time, to_time } = current;

            if (!acc[date]) {
                acc[date] = { date, slots: [] };
            }

            acc[date].slots.push({
                from_time,
                to_time
            });

            return acc;
        }, {});

        // Convert the grouped data into an array
        return Object.values(groupedByDate);
    }

    mergeSlots(arr1: any, arr2: any) {

        type SlotDto = {
            from_time: string;
            to_time: string;
        };

        type DateSlotsDto = {
            date: string;
            slots: SlotDto[];
        }
        const result: DateSlotsDto[] = [];

        arr1.forEach(dateSlot1 => {
            const dateSlot2 = arr2.find(item => item.date === dateSlot1.date);
            if (dateSlot2) {
                // Date exists in both arrays, now merge slots
                const mergedSlots: SlotDto[] = this.mergeTimeSlots(dateSlot1.slots, dateSlot2.slots);
                result.push({ date: dateSlot1.date, slots: mergedSlots });
            }
        });

        return result;
    }



    async mergeSlotsV2(busy: any, availability: any) {


        type Final = {
            date: string;
            from_time: string;
            to_time: string;
        };

        let final_arr: Final[] = [];



        // Loop through each busy slot
        availability.forEach((avl, g) => {

            // Get All available 
            const busy_same_day = busy.filter(x => x.date == avl.date);
            console.log("Busy slot availability for date: " + avl.date + " is : " + busy_same_day.length);
            if (busy_same_day.length == 0) {

                console.log(avl.date, 'avl.avl.date')
                avl.slots.forEach(m => {
                    final_arr.push({
                        date: avl.date,
                        from_time: m.from_time.split("+")[0],
                        to_time: m.to_time.split("+")[0]
                    })
                });
            } else {

                console.log(avl.date, 'avl.avl.date else')
                type arrive = {
                    start: string, end: string
                };
                let arrive_arr: arrive[] = [];

                console.log(); console.log(); console.log(); console.log();

                avl.slots.forEach((avlslots, n) => {
                    arrive_arr = [];

                    console.log(" avl.slots.forEach((avlslots, n) >>>>>  " + avlslots.from_time + ", " + avlslots.to_time)

                    busy_same_day[0].slots.forEach(bsy => {

                        console.log(); console.log();

                        console.log("busy_same_day[0].slots.forEach(bsy >>>>>  " + bsy.from_time + ", " + bsy.to_time)

                        if (bsy.from_time >= avlslots.from_time && bsy.from_time < avlslots.to_time) {

                            console.log("Pushed for >>  start : " + bsy.from_time + ", end: " + bsy.to_time)
                            arrive_arr.push({
                                // start: avlslots.from_time, end: bsy.from_time
                                start: bsy.from_time, end: bsy.to_time
                            });
                        }
                    });

                    console.log(); console.log();

                    if (arrive_arr.length == 1) {
                        console.log("received only one arrival true for date " + avl.date)
                        console.log("from time : " + avlslots.from_time + ", end time : " + arrive_arr[0].start)

                        if (avlslots.from_time.split("+")[0] < arrive_arr[0].start.split("+")[0]) {
                            console.log("++ Pushed");
                            final_arr.push({
                                date: avl.date,
                                from_time: avlslots.from_time.split("+")[0],
                                to_time: arrive_arr[0].start.split("+")[0]
                            });
                        }


                        console.log("from time : " + arrive_arr[0].end + ", end time : " + avlslots.to_time)
                        if (arrive_arr[0].end.split("+")[0] < avlslots.to_time.split("+")[0]) {
                            console.log("++ Pushed");
                            final_arr.push({
                                date: avl.date,
                                from_time: arrive_arr[0].end.split("+")[0],
                                to_time: avlslots.to_time.split("+")[0]
                            });
                        }

                    } else if (arrive_arr.length > 1) {
                        console.log("received more than one arrival true for date " + avl.date)

                        const x = arrive_arr.sort((a, b) => {
                            // Convert 'end' time string to Date objects for comparison
                            const timeA = new Date(`1970-01-01T${a.start}Z`);
                            const timeB = new Date(`1970-01-01T${b.start}Z`);
                            return timeA.getTime() - timeB.getTime();
                        });


                        x.forEach((l, m) => {

                            if (m == 0) {
                                console.log("checkling in loop START avlslots.from_time " + avlslots.from_time.split("+")[0] + " l of end " + l.start.split("+")[0])
                                if (avlslots.from_time.split("+")[0] < l.start.split("+")[0]) {
                                    console.log("TRUE ----")
                                    final_arr.push({
                                        date: avl.date,
                                        from_time: avlslots.from_time.split("+")[0],
                                        to_time: l.start.split("+")[0]
                                    });
                                    console.log("END ----")
                                }

                                console.log("checkling in loop START As A MID l.end " + l.end.split("+")[0] + " >x[m + 1].end " + x[m + 1].start.split("+")[0])
                                if (l.end.split("+")[0] < x[m + 1].start.split("+")[0]) {
                                    console.log("TRUE 1 ----")
                                    final_arr.push({
                                        date: avl.date,
                                        from_time: l.end.split("+")[0],
                                        to_time: x[m + 1].start.split("+")[0]
                                    });
                                }
                            }
                            else if (m != x.length - 1) {
                                console.log("checkling in loop MID l.end " + l.end.split("+")[0] + " >x[m + 1].end " + x[m + 1].start.split("+")[0])
                                if (l.end.split("+")[0] < x[m + 1].start.split("+")[0]) {
                                    console.log("TRUE 1 ----")
                                    final_arr.push({
                                        date: avl.date,
                                        from_time: l.end.split("+")[0],
                                        to_time: x[m + 1].start.split("+")[0]
                                    });
                                }
                            } else {

                                console.log("checkling in loop END l.end " + l.end.split("+")[0] + " avlslots.end_time " + avlslots.to_time.split("+")[0])

                                if (avlslots.to_time.split("+")[0] > l.end.split("+")[0]) {
                                    console.log("TRUE ----")
                                    final_arr.push({
                                        date: avl.date,
                                        from_time: l.end.split("+")[0],
                                        to_time: avlslots.to_time.split("+")[0]
                                    });
                                }
                            }
                        })


                    } else {
                        console.log("received 0 arrival " + avl.date + " ,pushed : from_time - " + avlslots.from_time.split("+")[0] + " ,end : " + avlslots.to_time.split("+")[0])
                        final_arr.push({
                            date: avl.date,
                            from_time: avlslots.from_time.split("+")[0],
                            to_time: avlslots.to_time.split("+")[0],
                        });
                    }

                    console.log(); console.log(); console.log(); console.log();


                });

                // busy_same_day.forEach(bsy => {

                //     console.log(availability[g], 'availability[g]')

                //     console.log("busy start: " + bsy.start + " avl.start " + availability[g].slots[0].start + " avl.end " + availability[g].slots[0].end)
                //     if (bsy.start >= availability[g].slots[0].start && bsy.start < availability[g].slots[0].end) {
                //         arrive_arr.push({
                //             start: availability[g].slots[0].start, end: bsy.start
                //         });
                //     }
                // });

                // if (arrive_arr.length == 1) {
                //     final_arr.push({
                //         date: avl.date,
                //         from_time: arrive_arr[0].start,
                //         to_time: arrive_arr[0].end
                //     });
                // } else if (arrive_arr.length > 1) {
                //     console.log("received more than one arrival true for date " + avl.date)

                //     const x = arrive_arr.sort((a, b) => {
                //         // Convert 'end' time string to Date objects for comparison
                //         const timeA = new Date(`1970-01-01T${a.start}Z`);
                //         const timeB = new Date(`1970-01-01T${b.start}Z`);
                //         return timeA.getTime() - timeB.getTime();
                //     });

                //     console.log("pusing asc order data (start) for date " + avl.date + "start " + avl.start + " end " + avl.end)

                //     final_arr.push({
                //         date: avl.date,
                //         from_time: avl.start,
                //         to_time: x[0].start
                //     });

                //     const y = arrive_arr.sort((a, b) => {
                //         // Convert 'end' time string to Date objects for comparison
                //         const timeA = new Date(`1970-01-01T${a.end}Z`);
                //         const timeB = new Date(`1970-01-01T${b.end}Z`);
                //         return timeA.getTime() - timeB.getTime();
                //     });

                //     console.log("pusing asc order data (emd) for date " + avl.date + "start " + avl.start + " end " + avl.end)


                //     final_arr.push({
                //         date: avl.date,
                //         from_time: y[y.length - 1].end,
                //         to_time: avl.end
                //     });

                //     x.forEach((l, m) => {
                //         if (m != x.length - 1) {
                //             if (l.end > x[m + 1].end) {
                //                 final_arr.push({
                //                     date: avl.date,
                //                     from_time: l.end,
                //                     to_time: x[m + 1].start
                //                 });
                //             }
                //         }
                //     })


                // }
            }
        });

        return final_arr;
    }

    private mergeTimeSlots(slots1: any, slots2: any) {

        type SlotDto = {
            from_time: string;
            to_time: string;
        };

        type DateSlotsDto = {
            date: string;
            slots: SlotDto[];
        }

        const mergedSlots: SlotDto[] = [];

        let i = 0;
        let j = 0;

        // Merge the two sorted arrays of slots
        while (i < slots1.length && j < slots2.length) {
            const slot1 = slots1[i];
            const slot2 = slots2[j];

            if (slot1.to_time <= slot2.from_time) {
                // Slot1 ends before Slot2 starts, add Slot1
                mergedSlots.push(slot1);
                i++;
            } else if (slot2.to_time <= slot1.from_time) {
                // Slot2 ends before Slot1 starts, add Slot2
                mergedSlots.push(slot2);
                j++;
            } else {
                // Slots overlap, merge them
                const mergedSlot: SlotDto = {
                    from_time: slot1.from_time,
                    to_time: slot2.to_time,
                };
                mergedSlots.push(mergedSlot);
                i++;
                j++;
            }
        }

        // Add remaining slots from either array
        while (i < slots1.length) {
            mergedSlots.push(slots1[i]);
            i++;
        }

        while (j < slots2.length) {
            mergedSlots.push(slots2[j]);
            j++;
        }

        return mergedSlots;
    }


    // Helper function to check if two time ranges overlap
    public isOverlapping(slot1: TimeSlot, slot2: TimeSlot): boolean {
        const slot1Start = parseISO(slot1.start);
        const slot1End = parseISO(slot1.end);
        const slot2Start = parseISO(slot2.start);
        const slot2End = parseISO(slot2.end);

        return !(isBefore(slot1End, slot2Start) || isAfter(slot1Start, slot2End));
    }

    // Function to find available slots for meetings
    public findAvailableSlots(
        availableSlots: TimeSlot[],
        bookedSlots: TimeSlot[],
    ): AvailableTime[] {
        const availableTimes: AvailableTime[] = [];

        for (const available of availableSlots) {
            const availableStart = parseISO(available.start);
            const availableEnd = parseISO(available.end);

            let freeSlotStart = availableStart;

            // Check for overlapping with booked slots
            for (const booked of bookedSlots) {
                if (this.isOverlapping(available, booked)) {
                    const bookedStart = parseISO(booked.start);
                    const bookedEnd = parseISO(booked.end);

                    // Adjust the free slot to after the booked time
                    if (isBefore(bookedStart, freeSlotStart)) {
                        freeSlotStart = addMinutes(bookedEnd, 1);
                    } else {
                        freeSlotStart = addMinutes(bookedEnd, 1);
                    }
                }
            }

            // If there's any available time after all booked events
            if (isBefore(freeSlotStart, availableEnd)) {
                const from_time = format(freeSlotStart, 'HH:mm');
                const to_time = format(availableEnd, 'HH:mm');
                availableTimes.push({
                    date: format(availableStart, 'yyyy-MM-dd'),
                    from_time,
                    to_time,
                });
            }
        }

        return availableTimes;
    }



    async groupIntervalsByDate(intervals: { from: Date; to: Date }[]) {
        const groupedIntervals: { [key: string]: { from: string; to: string }[] } = {};

        // Group intervals by date
        for (const interval of intervals) {
            const dateKey = interval.from.toISOString().split('T')[0];  // Get the date part (yyyy-mm-dd)
            const formattedFrom = util.formatTime(interval.from);
            const formattedTo = util.formatTime(interval.to);

            if (!groupedIntervals[dateKey]) {
                groupedIntervals[dateKey] = [];
            }

            groupedIntervals[dateKey].push({ from: formattedFrom, to: formattedTo });
        }

        // Convert groupedIntervals object to an array of objects
        return Object.entries(groupedIntervals).map(([date, intervals]) => ({
            date,
            intervals,
        }));
    }


    // Helper function to parse time string to Date
    parseTime(timeStr: string): Date {
        return new Date(timeStr);
    }

    // Function to convert can book calendar data to time intervals
    convertCanBookToDatetimes(canBook: any[]): { from: Date; to: Date }[] {

        type T = {
            from: Date,
            to: Date,
        };
        let arr: T[] = [];
        canBook.forEach(x => {
            arr.push({
                from: util.convertToLocalString(x.date, x.from_time),
                to: util.convertToLocalString(x.date, x.to_time),
            })
        });

        // console.log(arr);

        return arr;

        // return canBook.map(entry => ({
        //     from: util.convertToLocalString(`${entry.date}`, `${entry.from_time}`),
        //     to: util.convertToLocalString(`${entry.date}`, `${entry.to_time}`),
        // }));
    }
    // Function to convert busy calendar data to time intervals
    convertBusyToDatetimes(busy: any[]) {
        return busy.map(entry => ({
            start: (entry.start),
            end: (entry.end),
        }));
    }

    convertBusyToDatetimesV2(busy: any[]) {
        return busy.forEach(entry => ({
            start: this.parseTime(entry.start),
            end: this.parseTime(entry.end),
        }));
    }

    // Function to generate 15-minute intervals from available time slots
    generate15MinIntervals(from: Date, to: Date): { from: Date; to: Date }[] {

        type Attendee = {
            from: Date;
            to: Date;
        };

        var intervals: Attendee[] = [];

        let current = new Date(from);

        // console.log(current, 'currentcurrent');

        while (current < to) {
            const next = new Date(current.getTime() + 15 * 60 * 1000); // 15 minutes later
            intervals.push({ from: current, to: next });  // Add interval to array
            current = next;
        }

        return intervals;
    }

    // Function to check if two time intervals overlap
    // isOverlapping(interval1: { from: Date; to: Date }, interval2: { start: Date; end: Date }): boolean {
    //     return interval1.from < interval2.end && interval1.to > interval2.start;
    // }

    // Function to get available 15-minute slots
    // getAvailableSlots(canBook: any[], busy: any[]): { from: Date; to: Date }[] {
    //     const canBookIntervals = this.convertCanBookToDatetimes(canBook);
    //     const busyIntervals = this.convertBusyToDatetimes(busy);
    //     const availableSlots = [];

    //     for (const slot of canBookIntervals) {
    //         const intervals = this.generate15MinIntervals(slot.from, slot.to);

    //         for (const interval of intervals) {
    //             let isAvailable = true;

    //             for (const busySlot of busyIntervals) {
    //                 if (this.isOverlapping(interval, busySlot)) {
    //                     isAvailable = false;
    //                     break;
    //                 }
    //             }

    //             if (isAvailable) {
    //                 // availableSlots.push(interval);
    //             }
    //         }
    //     }

    //     return availableSlots;
    // }



    //#endregion


    async GetEmailSync() {

    }


    //#region NEW CODE 

    calculateFinalAvailability(busyCalendar: any[], availabilityAdded: any[]) {
        const finalAvailability = {};
        const busyMap = this.mapBusySlots(busyCalendar);

        for (const entry of availabilityAdded) {
            const date = entry.date;
            const availableSlots = entry.slots;
            const busySlots = busyMap[date] || [];

            let finalSlots: TimeSlots[] = [];

            for (const available of availableSlots) {
                let remaining = [available];

                for (const busy of busySlots) {
                    let newRemaining: TimeSlots[] = [];

                    for (const slot of remaining) {
                        const subtracted = this.subtractSlot(slot, busy);
                        newRemaining.push(...subtracted);
                    }

                    remaining = newRemaining;
                }

                finalSlots.push(...remaining);
            }

            if (finalSlots.length) {
                finalAvailability[date] = finalSlots;
            }
        }

        return finalAvailability;
    }

    private mapBusySlots(busyCalendar: any[]) {
        const busyMap = {};

        for (const entry of busyCalendar) {
            busyMap[entry.date] = (busyMap[entry.date] || []).concat(
                entry.slots.map((slot) => ({
                    from_time: DateTime.fromISO(slot.from_time).toFormat('HH:mm:ss'),
                    to_time: DateTime.fromISO(slot.to_time).toFormat('HH:mm:ss'),
                })),
            );
        }

        return busyMap;
    }

    private subtractSlot(available: TimeSlots, busy: TimeSlots): TimeSlots[] {
        const aStart = DateTime.fromFormat(available.from_time, 'HH:mm:ss');
        const aEnd = DateTime.fromFormat(available.to_time, 'HH:mm:ss');
        const bStart = DateTime.fromFormat(busy.from_time, 'HH:mm:ss');
        const bEnd = DateTime.fromFormat(busy.to_time, 'HH:mm:ss');

        // No overlap
        if (bEnd <= aStart || bStart >= aEnd) {
            return [available];
        }

        const result: TimeSlots[] = [];

        if (bStart > aStart) {
            result.push({
                from_time: aStart.toFormat('HH:mm:ss'),
                to_time: bStart.toFormat('HH:mm:ss'),
            });
        }

        if (bEnd < aEnd) {
            result.push({
                from_time: bEnd.toFormat('HH:mm:ss'),
                to_time: aEnd.toFormat('HH:mm:ss'),
            });
        }

        return result;
    }


    //#endregion


}


type TimeSlot = {
    start: string;
    end: string;
}

type AvailableTime = {
    date: string;
    from_time: string;
    to_time: string;
}

type TimeSlots = {
    from_time: string;
    to_time: string;
};
