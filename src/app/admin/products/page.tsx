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
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { DataTable } from "@/components/products/products-table";
import { columns } from "@/components/products/columns";
import { ImportModal } from "@/components/products/ImportModal";

async function getProducts(query?: string): Promise<Product[]> {
  try {
    const url = new URL("/api/products", window.location.origin);
    if (query) {
      url.searchParams.append("query", query);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export default function ProductsPage() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const { data: products = [], isLoading, isError, error, refetch } = useQuery<Product[], Error>({
    queryKey: ["products", searchQuery],
    queryFn: () => getProducts(searchQuery),
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load products. Please try again.",
      variant: "destructive",
    });
    
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="text-lg text-red-600">Failed to load products</div>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

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