import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById, updateOrder, deleteOrder } from "@/services/orders";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const order = await getOrderById(parseInt(params.id));
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { items, ...orderData } = orderSchema.parse(body);
    const orderId = parseInt(params.id);

    const order = await updateOrder(orderId, orderData, items);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

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
    const success = await deleteOrder(orderId);
    if (!success) {
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