import { db } from "@/db";
import { orders, orderItems, products, type Order, type NewOrder, type OrderItem, type NewOrderItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getOrders(): Promise<Order[]> {
  return await db.select().from(orders);
}

export async function getOrderById(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
  const result = await db.transaction(async (tx) => {
    const order = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order.length) return undefined;

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return {
      ...order[0],
      items,
    };
  });

  return result;
}

export async function createOrder(data: NewOrder, items: Omit<NewOrderItem, 'orderId'>[]): Promise<Order> {
  return await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values(data).returning();

    if (items.length > 0) {
      await tx.insert(orderItems).values(
        items.map(item => ({
          ...item,
          orderId: order.id,
          priceNet: item.priceNet.toString(),
          tax: item.tax.toString(),
        }))
      );
    }

    return order;
  });
}

export async function updateOrder(
  id: number,
  data: Partial<NewOrder>,
  items?: Omit<NewOrderItem, 'orderId'>[]
): Promise<Order> {
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();

    if (items) {
      // Delete existing items
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));

      // Insert new items
      if (items.length > 0) {
        await tx.insert(orderItems).values(
          items.map(item => ({
            ...item,
            orderId: order.id,
            priceNet: item.priceNet.toString(),
            tax: item.tax.toString(),
          }))
        );
      }
    }

    return order;
  });
}

export async function deleteOrder(id: number): Promise<Order> {
  const [order] = await db
    .delete(orders)
    .where(eq(orders.id, id))
    .returning();
  return order;
}

// For backwards compatibility
class OrderService {
  getAll = getOrders;
  getById = getOrderById;
  create = createOrder;
  update = updateOrder;
  delete = deleteOrder;
}

export const orderService = new OrderService(); 