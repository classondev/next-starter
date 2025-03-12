'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ImportOrdersModal } from '@/components/orders/import-orders-modal';
import { ViewOrderModal } from '@/components/orders/view-order-modal';
import { Order } from '@/db/schema';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTranslation } from '@/i18n/useTranslation';

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

async function getOrders(query?: string): Promise<Order[]> {
  try {
    const url = new URL('/api/orders', window.location.origin);
    if (query) {
      url.searchParams.append('query', query);
    }
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch orders');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}

export default function OrdersPage() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery);
  const { toast } = useToast();
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  const { data: orders = [], isLoading, isError, error, refetch } = useQuery<Order[], Error>({
    queryKey: ['orders', debouncedSearchQuery],
    queryFn: () => getOrders(debouncedSearchQuery),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(locale);
  };

  const handleViewOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsViewModalOpen(true);
  };

  if (isError) {
    return (
      <div className="p-4">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-600">{t('common.loading')}</div>
          <Button onClick={() => refetch()}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={t('orders.searchPlaceholder')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="max-w-xs text-sm"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            size="sm"
            className="text-sm"
          >
            {t('orders.importOrders')}
          </Button>
          <Button asChild size="sm" className="text-sm">
            <Link href="/admin/orders/new">{t('orders.newOrder')}</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {orders.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('orders.noOrders')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">{t('orders.code')}</th>
                <th className="p-3 text-left font-medium">{t('orders.customerId')}</th>
                <th className="p-3 text-left font-medium">{t('orders.createdAt')}</th>
                <th className="p-3 text-left font-medium">{t('orders.createdBy')}</th>
                <th className="p-3 text-left font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-3">{order.code}</td>
                  <td className="p-3">{order.customerId}</td>
                  <td className="p-3">{formatDate(order.createdAt)}</td>
                  <td className="p-3">{order.createdBy}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-sm h-8"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        {t('common.view')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ImportOrdersModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={refetch}
      />

      <ViewOrderModal
        orderId={selectedOrderId}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
      />
    </div>
  );
} 