import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

// Validation schema for order items from Excel
const OrderItemSchema = z.object({
  position: z.number(),
  articleNumber: z.string(),
  quantity: z.number(),
  unit: z.string(),
  quantity2: z.number(),
  unit2: z.string(),
  description: z.string(),
  priceNet: z.number(),
  tax: z.number().transform(val => val.toString()),
});

// Validation schema for order data from Excel
const OrderImportSchema = z.object({
  orderCode: z.string(),
  createdAt: z.string(),
  customerId: z.string(),
  items: z.array(OrderItemSchema),
});

export async function POST(request: Request) {
  try {
    let data;
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await request.json();
    } else {
      const formData = await request.formData();
      const dataStr = formData.get('data');
      if (!dataStr || typeof dataStr !== 'string') {
        return NextResponse.json({ error: 'No data provided' }, { status: 400 });
      }
      data = JSON.parse(dataStr);
    }

    const validationResult = OrderImportSchema.safeParse(data);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation failed', details: validationResult.error }, { status: 400 });
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
    // for (const item of items) {
    //   if (!productMap.has(item.articleNumber)) {
    //     return NextResponse.json(
    //       { error: `Product not found: ${item.articleNumber}` },
    //       { status: 400 }
    //     );
    //   }
    // }

    // Create order and items in a transaction
    const result = await db.transaction(async (tx) => {
      // Insert order
      const [order] = await tx
        .insert(orders)
        .values({
          code: orderCode,
          customerId: customerId,
          createdAt: createdAt ? new Date() : new Date(), // Default to current date if invalid
          createdBy: 'system', // You might want to get this from the session
        })
        .returning();

      // Insert order items
      const orderItemsData = items.map(item => ({
        orderId: order.id,
        productId: productMap.has(item.articleNumber) ? productMap.get(item.articleNumber)!.id : null,
        position: item.position,
        articleNumber: item.articleNumber,
        description: item.description,
        quantity2: item.quantity2,
        unit2: item.unit2,
        quantity: item.quantity.toString(),
        unit: item.unit,
        priceNet: item.priceNet.toString(),
        tax: item.tax.toString(),
      }));

      await tx.insert(orderItems).values(orderItemsData.map(item => ({
        orderId: item.orderId,
        productId: item.productId,
        position: item.position,
        articleNumber: item.articleNumber,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        priceNet: item.priceNet,
        tax: item.tax,
      })));

      return order;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error importing order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 