import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, OrderItem } from '@/db/schema';
import { Printer, FileSpreadsheet, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/components/ui/use-toast';

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

interface ViewOrderModalProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOrderModal({ orderId, open, onOpenChange }: ViewOrderModalProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/orders/${orderId}`);
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

    if (open && orderId) {
      fetchOrder();
    }
  }, [orderId, open]);

  const handlePrint = () => {
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableContent = `
      <html>
        <head>
          <title>Order Details - ${order.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .order-info { margin-bottom: 30px; }
            .order-info h2 { margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; }
          </style>
        </head>
        <body>
          <div class="order-info">
            <h2>Order Details - ${order.code}</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Order Code</div>
                <div>${order.code}</div>
              </div>
              <div class="info-item">
                <div class="label">Customer ID</div>
                <div>${order.customerId}</div>
              </div>
              <div class="info-item">
                <div class="label">Created At</div>
                <div>${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="label">Created By</div>
                <div>${order.createdBy}</div>
              </div>
              ${order.note ? `
                <div class="info-item" style="grid-column: span 2;">
                  <div class="label">Note</div>
                  <div>${order.note}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Article Number</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Price Net</th>
                <th>Tax (%)</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product.articleNumber}</td>
                  <td>${item.product.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(parseFloat(item.priceNet))}</td>
                  <td>${item.tax}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExcelExport = () => {
    if (!order) return;

    const worksheet = XLSX.utils.json_to_sheet(
      order.items.map(item => ({
        'Article Number': item.product.articleNumber,
        'Product Name': item.product.name,
        'Quantity': item.quantity,
        'Unit': item.unit,
        'Price Net': item.priceNet,
        'Tax (%)': item.tax,
      }))
    );

    // Add order information at the top
    XLSX.utils.sheet_add_aoa(worksheet, [
      ['Order Details'],
      ['Order Code', order.code],
      ['Customer ID', order.customerId],
      ['Created At', order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'],
      ['Created By', order.createdBy],
      order.note ? ['Note', order.note] : [],
      [], // Empty row for spacing
      ['Order Items'], // Header for items table
    ], { origin: 'A1' });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Details');
    XLSX.writeFile(workbook, `order-${order.code}.xlsx`);
  };

  const handlePdfExport = () => {
    if (!order) return;

    try {
      const doc = new jsPDF();

      // Add order information
      doc.setFontSize(16);
      doc.text(`Order Details - ${order.code}`, 14, 20);

      doc.setFontSize(11);
      doc.text(`Order Code: ${order.code}`, 14, 35);
      doc.text(`Customer ID: ${order.customerId}`, 14, 42);
      doc.text(`Created At: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`, 14, 49);
      doc.text(`Created By: ${order.createdBy}`, 14, 56);

      if (order.note) {
        doc.text('Note:', 14, 63);
        doc.setFontSize(10);
        const splitNote = doc.splitTextToSize(order.note, 180);
        doc.text(splitNote, 14, 70);
      }

      // Add items table
      autoTable(doc, {
        startY: order.note ? 80 : 65,
        head: [['Article Number', 'Product Name', 'Quantity', 'Unit', 'Price Net', 'Tax (%)']],
        body: order.items.map(item => [
          item.product.articleNumber,
          item.product.name,
          item.quantity,
          item.unit,
          new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(parseFloat(item.priceNet)),
          `${item.tax}%`,
        ]),
      });

      doc.save(`order-${order.code}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Order Details</DialogTitle>
            {order && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExcelExport}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePdfExport}
                  className="flex items-center gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">Loading...</div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : order ? (
            <div className="space-y-6">
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
                            <td className="p-4">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(parseFloat(item.priceNet))}</td>
                            <td className="p-4">{item.tax}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 