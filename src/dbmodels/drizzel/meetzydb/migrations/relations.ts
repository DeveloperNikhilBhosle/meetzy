import { relations } from "drizzle-orm/relations";
import { menusInMasters, usersInMasters, user_role_menusInMasters, rolesInMasters } from "./schema";

export const menusInMastersRelations = relations(menusInMasters, ({one, many}) => ({
	menusInMaster: one(menusInMasters, {
		fields: [menusInMasters.parent_id],
		references: [menusInMasters.id],
		relationName: "menusInMasters_parent_id_menusInMasters_id"
	}),
	menusInMasters: many(menusInMasters, {
		relationName: "menusInMasters_parent_id_menusInMasters_id"
	}),
	user_role_menusInMasters: many(user_role_menusInMasters),
}));

export const user_role_menusInMastersRelations = relations(user_role_menusInMasters, ({one}) => ({
	usersInMaster: one(usersInMasters, {
		fields: [user_role_menusInMasters.user_id],
		references: [usersInMasters.id]
	}),
	rolesInMaster: one(rolesInMasters, {
		fields: [user_role_menusInMasters.role_id],
		references: [rolesInMasters.id]
	}),
	menusInMaster: one(menusInMasters, {
		fields: [user_role_menusInMasters.menu_id],
		references: [menusInMasters.id]
	}),
}));

export const usersInMastersRelations = relations(usersInMasters, ({many}) => ({
	user_role_menusInMasters: many(user_role_menusInMasters),
}));

export const rolesInMastersRelations = relations(rolesInMasters, ({many}) => ({
	user_role_menusInMasters: many(user_role_menusInMasters),
}));