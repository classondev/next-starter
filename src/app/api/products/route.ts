import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, type Product } from "@/db/schema";
import { ilike, or, sql } from "drizzle-orm";

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
  priceNet: z.number().positive(),
  priceGross: z.number().positive(),
  tax: z.number().min(0).max(100),
  status: z.enum(['active', 'disabled']).default('active'),
  category: z.string().optional(),
  createdBy: z.string().optional(),
  modifiedBy: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    const queryBuilder = db.select().from(products);

    const results = await (query 
      ? queryBuilder.where(
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.articleNumber, `%${query}%`),
            ilike(products.category, `%${query}%`)
          )
        )
      : queryBuilder);

    return NextResponse.json(results || []);
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

    const dbData = {
      ...validatedData,
      priceNet: validatedData.priceNet.toFixed(2),
      priceGross: validatedData.priceGross.toFixed(2),
      tax: validatedData.tax.toFixed(2),
    };

    const result = await db.insert(products).values(dbData).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 