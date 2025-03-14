import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/db/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTranslation } from '@/i18n/useTranslation';

export const getColumns = (locale: "en" | "vi" | "de") => {
  const { t } = useTranslation(locale);

  return [
    {
      accessorKey: "articleNumber",
      header: t('products.columns.articleNumber'),
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
      header: t('products.columns.name'),
      enableColumnFilter: true,
    },
    {
      accessorKey: "category",
      header: t('products.columns.category'),
      enableColumnFilter: true,
    },
    {
      accessorKey: "itemsQuantity",
      header: t('products.columns.stock'),
    },
    {
      accessorKey: "priceNet",
      header: t('products.columns.priceNet'),
      cell: ({ row }) => formatCurrency(row.getValue("priceNet")),
    },
    {
      accessorKey: "priceGross",
      header: t('products.columns.priceGross'),
      cell: ({ row }) => formatCurrency(row.getValue("priceGross")),
    },
    {
      accessorKey: "status",
      header: t('products.columns.status'),
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
            {t(`products.status.${status}`)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t('products.columns.actions'),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => console.log("Edit", row.original)}
              className="text-blue-600 hover:text-blue-800"
            >
              {t('common.edit')}
            </button>
            <button
              onClick={() => console.log("Delete", row.original)}
              className="text-red-600 hover:text-red-800"
            >
              {t('common.delete')}
            </button>
          </div>
        );
      },
    },
  ] as ColumnDef<Product>[];
}; 