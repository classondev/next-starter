'use client';

import { useRouter } from "next/navigation";
import { OrderForm } from "@/components/orders/order-form";

export default function NewOrderPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      router.push('/admin/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">New Order</h1>
      <OrderForm onSubmit={handleSubmit} />
    </div>
  );
} 