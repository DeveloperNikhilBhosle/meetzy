import { pgTable, pgSchema, serial, varchar, boolean, timestamp, integer, text, numeric, bigint, unique, time, foreignKey, check } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const masters = pgSchema("masters");


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

export const user_timeslotsInMasters = masters.table("user_timeslots", {
	id: serial().primaryKey().notNull(),
	user_id: integer().notNull(),
	meeting_id: integer().notNull(),
	account_id: integer().notNull(),
	date: timestamp({ withTimezone: true, mode: 'string' }),
	day: varchar({ length: 20 }),
	from_time: time().notNull(),
	to_time: time().notNull(),
	created_at: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	created_by: integer().notNull(),
});

export const menusInMasters = masters.table("menus", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 100 }).notNull(),
	icon: varchar({ length: 100 }),
	route: varchar({ length: 255 }),
	parent_id: integer(),
	sort_order: integer().default(0),
	is_active: boolean().default(true),
	created_at: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updated_at: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.parent_id],
			foreignColumns: [table.id],
			name: "menus_parent_id_fkey"
		}).onDelete("cascade"),
]);

export const user_role_menusInMasters = masters.table("user_role_menus", {
	id: serial().primaryKey().notNull(),
	user_id: integer(),
	role_id: integer(),
	menu_id: integer().notNull(),
	can_view: boolean().default(true),
	can_edit: boolean().default(false),
	is_active: boolean().default(true),
	created_at: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updated_at: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.user_id],
			foreignColumns: [usersInMasters.id],
			name: "user_role_menus_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.role_id],
			foreignColumns: [rolesInMasters.id],
			name: "user_role_menus_role_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.menu_id],
			foreignColumns: [menusInMasters.id],
			name: "user_role_menus_menu_id_fkey"
		}).onDelete("cascade"),
	check("user_role_menus_check", sql`((user_id IS NOT NULL) AND (role_id IS NULL)) OR ((user_id IS NULL) AND (role_id IS NOT NULL))`),
]);

export const rolesInMasters = masters.table("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	is_active: boolean().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	param_text: text(),
	param_num: numeric(),
});
