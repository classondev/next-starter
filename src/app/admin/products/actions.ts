'use server';

import { productService } from "@/services/products";
import type { NewProduct } from "@/db/schema";

export async function getProducts() {
  return await productService.getAll();
}

export async function createProduct(data: NewProduct) {
  return await productService.create({
    ...data,
    createdBy: "admin",
    modifiedBy: "admin",
  });
}

export async function updateProduct(id: number, data: Partial<NewProduct>) {
  return await productService.update(id, {
    ...data,
    modifiedBy: "admin",
  });
}

export async function deleteProduct(id: number) {
  return await productService.delete(id);
} 