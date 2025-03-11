import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrders, createOrder } from "@/services/orders";

// Schema for validating order items
const orderItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
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

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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