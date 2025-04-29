import { Injectable, UnauthorizedException } from '@nestjs/common';
import { userList, users } from './users';
import { MeetZyDrizzleService } from 'src/dbmodels/meetzydb/meetzydb.drizzle.service';
import { menusInMasters, rolesInMasters, user_accountsInMasters, user_meetingsInMasters, user_role_menusInMasters, user_rolesInMasters, usersInMasters } from 'src/dbmodels/drizzel/meetzydb/migrations/schema';
import { desc, eq, like, and, ne, or, inArray, sql } from 'drizzle-orm';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';

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

        return {
            access_token: access_token,
            refresh_token: refresh_token,
            menus: defaultMenus
        };



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
