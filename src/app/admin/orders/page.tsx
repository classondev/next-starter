'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImportOrdersModal } from '@/components/orders/import-orders-modal';
import { Order } from '@/db/schema';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            Import Orders
          </Button>
          <Button asChild>
            <Link href="/admin/orders/new">New Order</Link>
          </Button>
        </div>
      </div>

      <ImportOrdersModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={fetchOrders}
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-md border">
          {orders.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No orders found. Import some orders to get started.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Code</th>
                  <th className="p-4 text-left font-medium">Customer ID</th>
                  <th className="p-4 text-left font-medium">Created At</th>
                  <th className="p-4 text-left font-medium">Created By</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-4">{order.code}</td>
                    <td className="p-4">{order.customerId}</td>
                    <td className="p-4">{formatDate(order.createdAt)}</td>
                    <td className="p-4">{order.createdBy}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>View</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
} 