import { pgTable, pgSchema, serial, varchar, bigint, boolean, timestamp, text, numeric, integer, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const masters = pgSchema("masters");


export const usersInMasters = masters.table("users", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	phone_number: bigint({ mode: "number" }),
	is_active: boolean().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	param_text: text(),
	param_num: numeric(),
});

export const rolesInMasters = masters.table("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	is_active: boolean().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	param_text: text(),
	param_num: numeric(),
});

export const user_rolesInMasters = masters.table("user_roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	is_active: boolean().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	user_id: integer().notNull(),
	role_id: integer().notNull(),
	param_text: text(),
	param_num: numeric(),
});

export const user_meetingsInMasters = masters.table("user_meetings", {
	id: serial().primaryKey().notNull(),
	user_id: integer().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	host: varchar({ length: 255 }).notNull(),
	meeting_type_id: integer().notNull(),
	default_attendees: text(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	last_updated_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	is_active: boolean().default(true),
	duration_min: numeric().default('15'),
	account_id: numeric(),
});

export const user_accountsInMasters = masters.table("user_accounts", {
	id: serial().primaryKey().notNull(),
	user_id: numeric(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	is_active: boolean().notNull(),
	client_id: varchar({ length: 255 }),
	client_secret: varchar({ length: 255 }),
	code: varchar({ length: 255 }),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	last_updated_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	param_text: text(),
	param_num: numeric(),
	is_validated: boolean().default(false),
	redirect_url: text(),
	token: text(),
	refresh_token: text(),
}, (table) => [
	unique("user_accounts_email_key").on(table.email),
]);
