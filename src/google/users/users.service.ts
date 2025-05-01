import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAccount, userList, users } from './users';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { enterprisesInMasters, menusInMasters, rolesInMasters, user_accountsInMasters, user_meetingsInMasters, user_role_menusInMasters, user_rolesInMasters, usersInMasters } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, ne, or, inArray, sql } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { Helper } from 'helper';

@Injectable()
export class UsersService {
    constructor(private readonly meetzy: MeetZyDrizzleService, private jwtService: JwtService) { }

    async GetUserMenus(ip: users) {
        console.log(process.env.JWT_ACCESS_SECRET, 'pauleoas');
        const users = await this.meetzy.db.select().from(usersInMasters)
            .where(and(eq(usersInMasters.email, ip.email_id), eq(usersInMasters.is_active, true)))
            .orderBy(desc(usersInMasters.is_active));

        console.log("Users = ", users)

        if (users.filter(x => x.is_active == true).length > 0) {
            var menus = await this.meetzy.db.select({
                id: menusInMasters.id,
                title: menusInMasters.title
            })
                .from(usersInMasters)
                .innerJoin(user_rolesInMasters, and(eq(usersInMasters.id, user_rolesInMasters.user_id), eq(usersInMasters.is_active, true)))
                .innerJoin(user_role_menusInMasters, and(or(eq(user_rolesInMasters.role_id, user_role_menusInMasters.role_id), eq(user_rolesInMasters.user_id, user_role_menusInMasters.user_id)), eq(user_role_menusInMasters.is_active, true)))
                .innerJoin(menusInMasters, and(eq(user_role_menusInMasters.menu_id, menusInMasters.id)));

            console.log(menus, 'menus');

            const payload = {
                userId: users[0].id,
                email: ip.email_id
            }



            const access_token = this.jwtService.sign(payload, {
                secret: process.env.JWT_ACCESS_SECRET,
                expiresIn: '1h',
            });

            const refresh_token = this.jwtService.sign(payload, {
                secret: process.env.JWT_REFRESH_SECRET,
                expiresIn: '7d',
            });

            const unique = Array.from(
                new Map(menus.map(item => [item.id, item])).values()
            );

            if (menus.length > 0) {
                return {
                    access_token: access_token,
                    refresh_token: refresh_token,
                    menus: unique
                };
            }

        }

        // Add User if not exists
        var valuesUsers = {
            name: ip.email_id.split("@")[0],
            email: ip.email_id,
            is_active: true,
            created_at: sql`CURRENT_TIMESTAMP`,
            last_updated_at: sql`CURRENT_TIMESTAMP`
        };
        const user = await this.meetzy.db.insert(usersInMasters).values(valuesUsers).returning();

        console.log(user, 'usersssss');

        var valuesUR = {
            name: ip.email_id.split("@")[0],
            created_at: sql`CURRENT_TIMESTAMP`,
            last_updated_at: sql`CURRENT_TIMESTAMP`,
            user_id: user[0].id,
            role_id: 2,
            is_active: true
        }

        await this.meetzy.db.insert(user_rolesInMasters).values(valuesUR);

        var defaultMenus = await this.meetzy.db.select({
            id: menusInMasters.id,
            title: menusInMasters.title
        })
            .from(menusInMasters)
            .innerJoin(user_role_menusInMasters, and(eq(menusInMasters.id, user_role_menusInMasters.menu_id), eq(user_role_menusInMasters.is_active, true)))
            .where(and(eq(user_role_menusInMasters.role_id, 2)));

        const payload = {
            userId: user[0].id,
            email: ip.email_id

        }

        const access_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '1h',
        });

        const refresh_token = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        const res = {
            access_token: access_token,
            refresh_token: refresh_token,
            menus: defaultMenus
        };

        return Helper.SUCCESSResponse(200, "SUCCCESS", res);



    }

    async GetActiveMeetings(ip: userList, email: string, user_id: number) {

        const email_accounts = await this.meetzy.db.select({
            email: user_accountsInMasters.email
        })
            .from(usersInMasters)
            .innerJoin(user_accountsInMasters, and(eq(usersInMasters.id, user_accountsInMasters.user_id), eq(user_accountsInMasters.is_active, true)))
            .where(and(eq(usersInMasters.id, user_id), eq(usersInMasters.is_active, true)));


        const query = "select * from masters.get_meeting_list('" + ip.from_date + "','" + ip.to_date + "')";
        console.log(query, 'query');
        const data = await this.meetzy.db.execute(sql`${sql.raw(query)};`);

        console.log(data, 'data');

        const res = data.rows;
        return Helper.SUCCESSResponse(200, "SUCCCESS", { meetings: res });

    }

    async GetScores(userId: string) {
        const res = {
            scheduled: 234,
            completed: 190,
            active: 12,
            cancelled: 32
        }

        return Helper.SUCCESSResponse(200, "SUCCCESS", res);
    }

    async GetUserProfile(userId: number) {
        const user = await this.meetzy.db.select({
            name: usersInMasters.name,
            email: usersInMasters.email,
            mobile_number: usersInMasters.phone_number,
            image: usersInMasters.param_text

        })
            .from(usersInMasters)
            .where(and(eq(usersInMasters.id, userId), eq(usersInMasters.is_active, true)));

        if (user.length == 0) {
            throw new BadRequestException("Invalid User Request");
        }

        const linkedAcc = await this.meetzy.db.select({
            email: user_accountsInMasters.email,
            name: user_accountsInMasters.name
        }).from(user_accountsInMasters)
            .where(and(eq(user_accountsInMasters.user_id, userId.toString()), eq(user_accountsInMasters.is_active, true)));

        type acc = {
            name: string,
            email: string
        }
        let linkedAccArray: acc[] = [];
        linkedAcc.forEach(a => {
            linkedAccArray.push({
                name: a.name,
                email: a.email
            });
        });

        var res = {
            name: user[0].name,
            email: user[0].email,
            mobile_number: user[0].mobile_number,
            image: user[0].image,
            linkedAcc: linkedAcc
        }
        return Helper.SUCCESSResponse(200, "SUCCCESS", res);

    }

    async LinkUserAccount(userId: number, ip: UserAccount) {
        const user = await this.meetzy.db.select()
            .from(usersInMasters)
            .where(and(eq(usersInMasters.id, userId), eq(usersInMasters.is_active, true)));

        if (user.length == 0) {
            throw new BadRequestException("Invalid User Request");
        }

        const enterprises = await this.meetzy.db.select()
            .from(enterprisesInMasters)
            .where(and(eq(enterprisesInMasters.id, ip.enterprise_id), eq(enterprisesInMasters.is_active, true)));

        if (enterprises.length == 0) {
            throw new BadRequestException("Enterprise is not active or disabled, Please check or contact administrator");
        }

        //#region  Generate Tokens 

        const axios = require('axios');
        const qs = require('qs');
        let data = qs.stringify({
            'code': ip.code,
            'client_id': enterprises[0].client_id,
            'client_secret': enterprises[0].client_secret,
            'redirect_uri': enterprises[0].redirect_url,
            'grant_type': 'authorization_code'
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.GOOGLE_TOKEN_API,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: data
        };

        const token = axios.request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
                return JSON.stringify(response.data)
            })
            .catch((error) => {
                console.log(error);
                throw new BadRequestException("Something went wrong While generating token");
            });

        //#endregion

        const userAccObj = {
            user_id: userId.toString(),
            name: ip.name,
            email: ip.email,
            is_active: true,
            client_id: enterprises[0].client_id,
            client_secret: enterprises[0].client_secret,
            code: ip.code,
            created_at: sql`CURRENT_TIMESTAMP`,
            last_updated_at: sql`CURRENT_TIMESTAMP`,
            is_validated: true,
            redirect_url: enterprises[0].redirect_url,
            refresh_token: token.refresh_token
        }

        await this.meetzy.db.insert(user_accountsInMasters).values(userAccObj);
        return Helper.SUCCESSResponse(200, "SUCCESS");
    }

    async GenerateLink(userId: number, enterprise_id: number) {

        const user = await this.meetzy.db.select()
            .from(usersInMasters)
            .where(and(eq(usersInMasters.id, userId), eq(usersInMasters.is_active, true)));

        if (user.length == 0) {
            throw new BadRequestException("Invalid User Request");
        }

        const enterprises = await this.meetzy.db.select()
            .from(enterprisesInMasters)
            .where(and(eq(enterprisesInMasters.id, enterprise_id), eq(enterprisesInMasters.is_active, true)));

        if (enterprises.length == 0) {
            throw new BadRequestException("Enterprise is not active or disabled, Please check or contact administrator");
        }

        let verification_link = process.env.USER_VERIFICATION_LINK;
        if (verification_link == null || verification_link == undefined) {
            throw new BadRequestException("Verification link not able to generate, please contact to admin");
        }

        const client_id_new: string = enterprises[0].client_id?.toString() || '';
        const redirect_url_new: string = enterprises[0].redirect_url?.toString() || '';
        verification_link = verification_link.replace("CLIENTIDFORENTERPRISE", client_id_new)
            .replace("REDIRECTURLFORENTERPRISE", redirect_url_new);

        return Helper.SUCCESSResponse(200, "SUCCESS", { verification_link: verification_link })

    }
}
