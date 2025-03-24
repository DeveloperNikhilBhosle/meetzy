-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SCHEMA "masters";
--> statement-breakpoint
CREATE TABLE "masters"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"primary_email" varchar(255) NOT NULL,
	"primary_phone_number" bigint,
	"is_active" boolean NOT NULL,
	"client_id" varchar(255),
	"client_secret" varchar(255),
	"code" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"param_text" text,
	"param_num" numeric
);
--> statement-breakpoint
CREATE TABLE "masters"."roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"param_text" text,
	"param_num" numeric
);
--> statement-breakpoint
CREATE TABLE "masters"."user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"param_text" text,
	"param_num" numeric
);

*/