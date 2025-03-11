CREATE TYPE "public"."product_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"note" text,
	"items_quantity" integer DEFAULT 0,
	"box_quantity" integer DEFAULT 0,
	"stock_note" text,
	"items_per_box" integer DEFAULT 1,
	"price_net" numeric(10, 2) NOT NULL,
	"price_gross" numeric(10, 2) NOT NULL,
	"tax" numeric(5, 2) NOT NULL,
	"status" "product_status" DEFAULT 'active',
	"category" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar(100),
	"modified_at" timestamp DEFAULT now(),
	"modified_by" varchar(100),
	CONSTRAINT "products_article_number_unique" UNIQUE("article_number")
);
