'use server';

import { db } from "@/db";
import { products } from "@/db/schema";
import type { NewProduct, Product } from "@/db/schema";
import { eq } from "drizzle-orm";

export const productService = {
  getAll: async (): Promise<Product[]> => {
    return await db.select().from(products);
  },

  getById: async (id: number): Promise<Product | undefined> => {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return result[0];
  },

  create: async (data: NewProduct): Promise<Product> => {
    const result = await db.insert(products).values(data).returning();
    return result[0];
  },

  update: async (id: number, data: Partial<NewProduct>): Promise<Product> => {
    const result = await db
      .update(products)
      .set({ ...data, modifiedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result[0];
  },

  delete: async (id: number): Promise<void> => {
    await db.delete(products).where(eq(products.id, id));
  },
}; 