'use server';

import { db } from "@/db";
import { products, type Product, type NewProduct } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";

export async function getAllProducts(): Promise<Product[]> {
  return await db.select().from(products);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0];
}

export async function createProduct(data: Omit<NewProduct, 'id'>): Promise<Product> {
  const result = await db.insert(products).values({
    ...data,
    priceNet: data.priceNet.toString(),
    priceGross: data.priceGross.toString(),
    tax: data.tax.toString(),
  }).returning();
  return result[0];
}

export async function updateProduct(id: number, data: Partial<Omit<NewProduct, 'id'>>): Promise<Product | undefined> {
  const updateData = {
    ...data,
    ...(data.priceNet && { priceNet: data.priceNet.toString() }),
    ...(data.priceGross && { priceGross: data.priceGross.toString() }),
    ...(data.tax && { tax: data.tax.toString() }),
    modifiedAt: new Date(),
  };

  const result = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id))
    .returning();
  return result[0];
}

export async function deleteProduct(id: number): Promise<Product | undefined> {
  const result = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();
  return result[0];
}

export async function searchProducts(query: string): Promise<Product[]> {
  return await db
    .select()
    .from(products)
    .where(ilike(products.name, `%${query}%`));
} 