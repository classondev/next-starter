"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import type { Product } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const productSchema = z.object({
  articleNumber: z.string().min(1, "Article number is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  note: z.string().optional(),
  itemsQuantity: z.coerce.number().int().min(0),
  boxQuantity: z.coerce.number().int().min(0),
  stockNote: z.string().optional(),
  itemsPerBox: z.coerce.number().int().min(1),
  priceNet: z.coerce.number().min(0),
  priceGross: z.coerce.number().min(0),
  tax: z.coerce.number().min(0),
  status: z.enum(["active", "disabled"]),
  category: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: ProductFormValues) => Promise<void>;
}

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const { toast } = useToast();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          articleNumber: initialData.articleNumber,
          name: initialData.name,
          description: initialData.description ?? "",
          note: initialData.note ?? "",
          itemsQuantity: initialData.itemsQuantity ?? 0,
          boxQuantity: initialData.boxQuantity ?? 0,
          stockNote: initialData.stockNote ?? "",
          itemsPerBox: initialData.itemsPerBox ?? 1,
          priceNet: Number(initialData.priceNet),
          priceGross: Number(initialData.priceGross),
          tax: Number(initialData.tax),
          status: initialData.status ?? "active",
          category: initialData.category ?? "",
        }
      : {
          articleNumber: "",
          name: "",
          description: "",
          note: "",
          itemsQuantity: 0,
          boxQuantity: 0,
          stockNote: "",
          itemsPerBox: 1,
          priceNet: 0,
          priceGross: 0,
          tax: 0,
          status: "active",
          category: "",
        },
  });

  const onFormSubmit = async (data: ProductFormValues) => {
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Product saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="articleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Article Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemsQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Items Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="boxQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Box Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="priceNet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Net</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceGross"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Gross</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {initialData ? "Update" : "Create"} Product
        </Button>
      </form>
    </Form>
  );
} 