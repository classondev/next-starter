'use server';

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAllProducts, searchProducts, createProduct } from "@/services/products";

// Schema for validating product data
const productSchema = z.object({
  articleNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  note: z.string().optional(),
  itemsQuantity: z.number().int().default(0),
  boxQuantity: z.number().int().default(0),
  stockNote: z.string().optional(),
  itemsPerBox: z.number().int().default(1),
  priceNet: z.string().min(1),
  priceGross: z.string().min(1),
  tax: z.string().min(1),
  status: z.enum(['active', 'disabled']).default('active'),
  category: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    const products = query 
      ? await searchProducts(query)
      : await getAllProducts();

    if (!products || products.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = productSchema.parse(body);

    const product = await createProduct(validatedData);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 