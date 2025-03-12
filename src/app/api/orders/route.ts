import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrders, createOrder } from "@/services/orders";
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

// Schema for validating order items
const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().transform(val => val.toString()),
  unit: z.string().min(1),
  priceNet: z.number().positive().transform(val => val.toString()),
  tax: z.number().min(0).max(100).transform(val => val.toString()),
});

// Schema for validating order data
const orderSchema = z.object({
  code: z.string().min(1),
  customerId: z.string().min(1),
  note: z.string().optional(),
  createdBy: z.string().optional(),
  items: z.array(orderItemSchema),
});

// Schema for validating import order items
const importOrderItemSchema = z.object({
  position: z.number(),
  articleNumber: z.string(),
  quantity: z.number().transform(val => val.toString()),
  unit: z.string(),
  description: z.string(),
  priceNet: z.number().transform(val => val.toString()),
  tax: z.number().transform(val => val.toString()),
});

// Schema for validating import order data
const importOrderSchema = z.object({
  orderCode: z.string(),
  createdAt: z.string(),
  customerId: z.string(),
  items: z.array(importOrderItemSchema),
});

export async function GET() {
  try {
    const data = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle form data (import)
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const dataStr = formData.get('data');

      if (!dataStr || typeof dataStr !== 'string') {
        return NextResponse.json({ error: 'No data provided' }, { status: 400 });
      }

      const data = JSON.parse(dataStr);
      const validationResult = importOrderSchema.safeParse(data);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error },
          { status: 400 }
        );
      }

      const { orderCode, createdAt, customerId, items } = validationResult.data;

      // Verify all products exist and get their IDs
      const articleNumbers = items.map(item => item.articleNumber);
      const existingProducts = await db
        .select()
        .from(products)
        .where(inArray(products.articleNumber, articleNumbers));

      const productMap = new Map(existingProducts.map(p => [p.articleNumber, p]));

      // Check if all products exist
      for (const item of items) {
        if (!productMap.has(item.articleNumber)) {
          return NextResponse.json(
            { error: `Product not found: ${item.articleNumber}` },
            { status: 400 }
          );
        }
      }

      // Create order and items in a transaction
      const result = await db.transaction(async (tx) => {
        // Insert order
        const [order] = await tx
          .insert(orders)
          .values({
            code: orderCode,
            customerId: customerId,
            createdAt: new Date(createdAt),
            createdBy: 'system',
          })
          .returning();

        // Insert order items
        const orderItemsData = items.map(item => ({
          orderId: order.id,
          productId: productMap.get(item.articleNumber)!.id,
          quantity: item.quantity,
          unit: item.unit,
          priceNet: item.priceNet,
          tax: item.tax,
        }));

        await tx.insert(orderItems).values(orderItemsData);

        return order;
      });

      return NextResponse.json(result, { status: 201 });
    }
    
    // Handle regular JSON request (normal order creation)
    const body = await request.json();
    const { items, ...orderData } = orderSchema.parse(body);

    const order = await createOrder(orderData, items);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
} 