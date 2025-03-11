import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "articleNumber",
    header: "Article #",
    cell: ({ row }) => {
      return (
        <Button variant="link" asChild>
          <Link href={`/admin/products/${row.original.id}`}>
            {row.getValue("articleNumber")}
          </Link>
        </Button>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    enableColumnFilter: true,
  },
  {
    accessorKey: "category",
    header: "Category",
    enableColumnFilter: true,
  },
  {
    accessorKey: "itemsQuantity",
    header: "Stock",
  },
  {
    accessorKey: "priceNet",
    header: "Price Net",
    cell: ({ row }) => formatCurrency(row.getValue("priceNet")),
  },
  {
    accessorKey: "priceGross",
    header: "Price Gross",
    cell: ({ row }) => formatCurrency(row.getValue("priceGross")),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "active" | "disabled";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => console.log("Edit", row.original)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => console.log("Delete", row.original)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      );
    },
  },
]; 