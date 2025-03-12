CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"position" integer,
	"article_number" varchar(50),
	"description" text,
	"quantity" numeric NOT NULL,
	"quantity2" numeric(10, 2),
	"unit" text NOT NULL,
	"unit2" varchar(50),
	"price_net" numeric(10, 2) NOT NULL,
	"tax" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"customer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" text,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "order_items"
ADD COLUMN "position" integer,
ADD COLUMN "article_number" varchar(50),
ADD COLUMN "description" text,
ADD COLUMN "quantity2" numeric(10, 2),
ADD COLUMN "unit2" varchar(50);