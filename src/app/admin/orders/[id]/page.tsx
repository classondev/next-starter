'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, OrderItem } from '@/db/schema';

interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: {
      id: number;
      name: string;
      articleNumber: string;
      status: string;
    };
  })[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading...</div>;
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-red-500">{error || 'Order not found'}</div>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push('/admin/orders')}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/orders')}
        >
          Back to Orders
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-gray-500">Order Code</dt>
                <dd>{order.code}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Customer ID</dt>
                <dd>{order.customerId}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Created At</dt>
                <dd>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Created By</dt>
                <dd>{order.createdBy}</dd>
              </div>
              {order.note && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-500">Note</dt>
                  <dd>{order.note}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Article Number</th>
                    <th className="p-4 text-left font-medium">Product Name</th>
                    <th className="p-4 text-left font-medium">Quantity</th>
                    <th className="p-4 text-left font-medium">Unit</th>
                    <th className="p-4 text-left font-medium">Price (Net)</th>
                    <th className="p-4 text-left font-medium">Tax (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">{item.product.articleNumber}</td>
                      <td className="p-4">{item.product.name}</td>
                      <td className="p-4">{item.quantity}</td>
                      <td className="p-4">{item.unit}</td>
                      <td className="p-4">{item.priceNet}</td>
                      <td className="p-4">{item.tax}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 