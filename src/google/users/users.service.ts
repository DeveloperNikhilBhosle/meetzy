import { Injectable, UnauthorizedException } from '@nestjs/common';
import { userList, users } from './users';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { menusInMasters, rolesInMasters, user_accountsInMasters, user_meetingsInMasters, user_role_menusInMasters, user_rolesInMasters, usersInMasters } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, ne, or, inArray, sql } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UsersService {
    constructor(private readonly meetzy: MeetZyDrizzleService) { }

    async GetUserMenus(ip: users) {
        const users = await this.meetzy.db.select().from(usersInMasters)
            .where(and(eq(usersInMasters.email, ip.email_id)))
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

            if (menus.length > 0) {
                return menus;
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

        return defaultMenus;



    }

    async GetActiveMeetings(ip: userList, token: string) {

        //#region Validate Token

        const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) throw new UnauthorizedException('Invalid Google token');


        //#endregion

        const email = payload.email;
        const email_accounts = await this.meetzy.db.select({
            email: user_accountsInMasters.email
        })
            .from(usersInMasters)
            .innerJoin(user_accountsInMasters, and(eq(usersInMasters.id, user_accountsInMasters.user_id), eq(user_accountsInMasters.is_active, true)))
            .where(and(eq(usersInMasters.id, ip.user_id), eq(usersInMasters.is_active, true)));


        const query = "select * from masters.get_meeting_list('" + ip.from_date + "','" + ip.to_date + "')";
        console.log(query, 'query');
        const data = await this.meetzy.db.execute(sql`${sql.raw(query)};`);

        console.log(data, 'data');

        return data.rows;

    }

    async GetScores(email: string) {
        return {
            scheduled: 234,
            completed: 190,
            active: 12,
            cancelled: 32
        }
    }
}
