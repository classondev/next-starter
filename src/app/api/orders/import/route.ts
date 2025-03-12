import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { type NewOrder, type NewOrderItem } from '@/db/schema';

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
const OrderImportSchema = z.array(z.object({
  orderCode: z.string(),
  customerId: z.string(),
  items: z.array(OrderItemSchema),
}));

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

    const ordersData = validationResult.data;

    // Collect all article numbers from all orders
    const articleNumbers = [...new Set(ordersData.flatMap(order => 
      order.items.map(item => item.articleNumber)
    ))];

    // Verify all products exist and get their IDs
    const existingProducts = await db
      .select()
      .from(products)
      .where(inArray(products.articleNumber, articleNumbers));

    const productMap = new Map(existingProducts.map(p => [p.articleNumber, p]));

    // Create orders and items in a transaction
    const results = await db.transaction(async (tx) => {
      const importedOrders = [];

      for (const orderData of ordersData) {
        // Insert order with proper typing
        const newOrderData: NewOrder = {
          code: orderData.orderCode,
          customerId: orderData.customerId,
          createdAt: new Date(),
          createdBy: 'system',
        };

        const [newOrder] = await tx
          .insert(orders)
          .values(newOrderData)
          .returning();

        if (!newOrder?.id) {
          throw new Error(`Failed to create order ${orderData.orderCode}`);
        }

        // Insert order items with proper typing
        const orderItemsData: NewOrderItem[] = orderData.items.map(item => ({
          orderId: newOrder.id,
          productId: productMap.has(item.articleNumber) ? productMap.get(item.articleNumber)!.id : null,
          position: item.position,
          articleNumber: item.articleNumber,
          description: item.description,
          quantity: item.quantity.toString(),
          unit: item.unit,
          quantity2: item.quantity2.toString(),
          unit2: item.unit2,
          priceNet: item.priceNet.toString(),
          tax: item.tax,
        }));

        await tx.insert(orderItems).values(orderItemsData);

        importedOrders.push({
          id: newOrder.id,
          code: newOrder.code,
          itemCount: orderItemsData.length,
        });
      }

      return importedOrders;
    });

    return NextResponse.json({ 
      success: true,
      message: `Successfully imported ${results.length} orders`,
      orders: results 
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 