import { notFound } from "next/navigation";
import { getOrderById } from "@/services/orders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrderById(parseInt(params.id));

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Order Details</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-medium">Order Code</dt>
                <dd>{order.code}</dd>
              </div>
              <div>
                <dt className="font-medium">Customer ID</dt>
                <dd>{order.customerId}</dd>
              </div>
              <div>
                <dt className="font-medium">Created At</dt>
                <dd>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</dd>
              </div>
              <div>
                <dt className="font-medium">Created By</dt>
                <dd>{order.createdBy || "-"}</dd>
              </div>
              {order.note && (
                <div className="col-span-2">
                  <dt className="font-medium">Note</dt>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Price Net</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  const priceNet = parseFloat(item.priceNet);
                  const tax = parseFloat(item.tax);
                  const total = priceNet * (1 + tax / 100) * Number(item.quantity2 || item.quantity);

                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.productId}</TableCell>
                      <TableCell>{item.articleNumber}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.quantity2}</TableCell>
                      <TableCell>{item.unit2}</TableCell>
                      <TableCell>${priceNet.toFixed(2)}</TableCell>
                      <TableCell>{tax}%</TableCell>
                      <TableCell>${total.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 