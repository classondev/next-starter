'use server';

import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products, type NewProduct } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createProduct } from "@/services/products";

const importProductSchema = z.object({
  articleNumber: z.string(),
  name: z.string(),
  description: z.string().optional(),
  itemsQuantity: z.number(),
  priceGross: z.number().positive(),
  priceNet: z.number().positive(),
  tax: z.number().min(0).max(100),
  status: z.enum(['active', 'disabled']).default('active'),
});

const importRequestSchema = z.object({
  products: z.array(importProductSchema),
  mode: z.enum(['override', 'skip', 'add']),
});

// Batch size for processing products
const BATCH_SIZE = 50;

// Process a single product and return result
type ProcessResult = {
  success: boolean;
  articleNumber: string;
  skipped?: boolean;
  error?: string;
};

async function processProduct(product: z.infer<typeof importProductSchema>, mode: string): Promise<ProcessResult> {
  try {
    // Check if product exists
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.articleNumber, product.articleNumber))
      .limit(1);

    const exists = existingProduct.length > 0;

    // Convert product data to match NewProduct type
    const productData: NewProduct = {
      ...product,
      priceNet: product.priceNet.toString(),
      priceGross: product.priceGross.toString(),
      tax: product.tax.toString(),
    };

    if (exists) {
      switch (mode) {
        case 'override':
          await db
            .update(products)
            .set({
              ...productData,
              modifiedAt: new Date(),
            })
            .where(eq(products.articleNumber, product.articleNumber));
          return { success: true, articleNumber: product.articleNumber };
        case 'skip':
          return { success: true, articleNumber: product.articleNumber, skipped: true };
        case 'add':
          await createProduct({
            ...productData,
            articleNumber: `${product.articleNumber}-${Date.now()}`,
          });
          return { success: true, articleNumber: product.articleNumber };
        default:
          return {
            success: false,
            articleNumber: product.articleNumber,
            error: 'Invalid import mode'
          };
      }
    } else {
      await createProduct(productData);
      return { success: true, articleNumber: product.articleNumber };
    }
  } catch (error) {
    return {
      success: false,
      articleNumber: product.articleNumber,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process products in batches
async function processBatch(products: z.infer<typeof importProductSchema>[], mode: string): Promise<ProcessResult[]> {
  return Promise.all(products.map(product => processProduct(product, mode)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { products: importProducts, mode } = importRequestSchema.parse(body);

    const results = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [] as { articleNumber: string; error: string }[]
    };

    // Process products in batches
    for (let i = 0; i < importProducts.length; i += BATCH_SIZE) {
      const batch = importProducts.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch, mode);

      // Aggregate results
      batchResults.forEach(result => {
        if (result.success) {
          if (result.skipped) {
            results.skipped++;
          } else {
            results.imported++;
          }
        } else {
          results.failed++;
          results.errors.push({
            articleNumber: result.articleNumber,
            error: result.error || 'Unknown error'
          });
        }
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
} 