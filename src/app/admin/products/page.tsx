"use client";

import { useState } from "react";
import { ProductForm } from "@/components/products/product-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/db/schema";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/products/products-table";
import { columns } from "@/components/products/columns";
import { ImportModal } from "@/components/products/ImportModal";

async function getProducts(query?: string) {
  const url = new URL("/api/products", window.location.origin);
  if (query) {
    url.searchParams.append("query", query);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}

export default function ProductsPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: () => getProducts(searchQuery),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
          >
            Import Products
          </Button>
          <Button>Add Product</Button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={products} 
      />
      
      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => {
          refetch();
        }}
      />
    </div>
  );
} 