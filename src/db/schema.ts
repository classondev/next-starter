import { sql } from "drizzle-orm";
import { 
  serial, 
  varchar, 
  text, 
  integer, 
  decimal, 
  timestamp, 
  pgEnum,
  pgTable 
} from "drizzle-orm/pg-core";

// Define the product status enum
export const productStatus = pgEnum('product_status', ['active', 'disabled']);

// Define the product table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  articleNumber: varchar('article_number', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  note: text('note'),
  itemsQuantity: integer('items_quantity').default(0),
  boxQuantity: integer('box_quantity').default(0),
  stockNote: text('stock_note'),
  itemsPerBox: integer('items_per_box').default(1),
  priceNet: decimal('price_net', { precision: 10, scale: 2 }).notNull(),
  priceGross: decimal('price_gross', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 5, scale: 2 }).notNull(),
  status: productStatus('status').default('active'),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: varchar('created_by', { length: 100 }),
  modifiedAt: timestamp('modified_at').defaultNow(),
  modifiedBy: varchar('modified_by', { length: 100 }),
});

// Define TypeScript type for Product
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert; 