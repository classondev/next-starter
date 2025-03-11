import { sql } from "drizzle-orm";
import { 
  serial, 
  varchar, 
  text, 
  integer, 
  decimal, 
  timestamp, 
  pgEnum,
  pgTable,
  foreignKey 
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

// Define the orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  customerId: varchar('customer_id', { length: 100 }).notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: varchar('created_by', { length: 100 }),
});

// Define the order items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  priceNet: decimal('price_net', { precision: 10, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 5, scale: 2 }).notNull(),
});

// Define TypeScript types
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert; 