import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrder, deleteOrder } from "@/services/orders";
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Schema for validating order items
const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit: z.string().min(1),
  quantity2: z.number().int(),
  unit2: z.string(),
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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('GET /api/orders/[id] - Start', { orderId: params.id });
  
  try {
    const orderId = parseInt(params.id);
    console.log('Parsed order ID:', orderId);

    if (isNaN(orderId)) {
      console.log('Invalid order ID:', params.id);
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    console.log('Fetching order from database...');
    const order = await db.select().from(orders)
      .where(eq(orders.id, orderId))
      .leftJoin(
        orderItems,
        eq(orders.id, orderItems.orderId)
      )
      .leftJoin(
        products,
        eq(orderItems.productId, products.id)
      );

    console.log('Database query result:', JSON.stringify(order, null, 2));

    if (!order || order.length === 0) {
      console.log('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform the joined data into the expected format
    const transformedOrder = {
      ...order[0].orders,
      items: order.map(row => ({
        ...row.order_items,
        product: row.products
      })).filter(item => item.product !== null)
    };

    console.log('Transformed order:', JSON.stringify(transformedOrder, null, 2));
    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const order = await db
      .update(orders)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!order || order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // First delete related order items
    await db
      .delete(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Then delete the order
    const result = await db
      .delete(orders)
      .where(eq(orders.id, orderId))
      .returning();

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
} 