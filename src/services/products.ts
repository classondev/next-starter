import { db } from "@/db";
import { products, type Product, type NewProduct } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getProducts(): Promise<Product[]> {
  return await db.select().from(products);
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id));
  return result[0];
}

export async function createProduct(data: NewProduct): Promise<Product> {
  const result = await db.insert(products).values({
    ...data,
    priceNet: data.priceNet.toString(),
    priceGross: data.priceGross.toString(),
    tax: data.tax.toString(),
  }).returning();
  return result[0];
}

export async function updateProduct(id: number, data: Partial<NewProduct>): Promise<Product> {
  const updateData = { ...data };
  if (data.priceNet) updateData.priceNet = data.priceNet.toString();
  if (data.priceGross) updateData.priceGross = data.priceGross.toString();
  if (data.tax) updateData.tax = data.tax.toString();

  const result = await db
    .update(products)
    .set({
      ...updateData,
      modifiedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  return result[0];
}

export async function deleteProduct(id: number): Promise<Product> {
  const result = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();
  return result[0];
}

// For backwards compatibility with existing code
class ProductService {
  getAll = getProducts;
  getById = getProductById;
  create = createProduct;
  update = updateProduct;
  delete = deleteProduct;
}

export const productService = new ProductService(); 