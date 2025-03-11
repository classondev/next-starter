'use client';

import { useEffect, useState } from "react";
import { Order } from "@/db/schema";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/orders/columns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Orders</h1>
        <Button asChild>
          <Link href="/admin/orders/new">New Order</Link>
        </Button>
      </div>

      {isLoading ? (
        <div>Loading orders...</div>
      ) : (
        <DataTable columns={columns} data={orders} />
      )}
    </div>
  );
} 