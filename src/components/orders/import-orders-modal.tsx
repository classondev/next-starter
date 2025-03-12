'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

// Add helper function for date conversion
const convertTextToDate = (dateText: string): Date => {
  console.log('Converting date text:', dateText);
  
  // Try parsing "DD-MMM-YY" format (e.g., "7-Mar-25")
  const excelDateRegex = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/;
  const match = dateText.match(excelDateRegex);
  
  if (match) {
    const [_, day, month, year] = match;
    const monthMap: { [key: string]: number } = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    // Convert 2-digit year to 4-digit year (assuming 20xx for years 00-99)
    const fullYear = 2000 + parseInt(year);
    const monthIndex = monthMap[month.toLowerCase()];
    
    if (monthIndex !== undefined) {
      const date = new Date(fullYear, monthIndex, parseInt(day));
      console.log('Parsed date:', date);
      return date;
    }
  }
  
  // If the above format doesn't match, try parsing as regular date
  const parsedDate = new Date(dateText);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  throw new Error(`Invalid date format: ${dateText}`);
};

interface ImportOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportResult {
  success: boolean;
  orderCode: string;
  totalItems: number;
  successItems: number;
  failedItems: number;
  errors: string[];
}

export function ImportOrdersModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportOrdersModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const validateItem = (item: Record<string, string>, columns: Record<string, string>) => {
    const errors: string[] = [];
    const { articleNumberColumn, quantityColumn, unitColumn, priceNetColumn, taxColumn } = columns;

    if (!item[articleNumberColumn]) {
      errors.push('Article Number is required');
    }
    if (!item[quantityColumn] || Number(item[quantityColumn]) <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    if (!item[unitColumn]) {
      errors.push('Unit is required');
    }
    if (!item[priceNetColumn] || Number(item[priceNetColumn]) <= 0) {
      errors.push('Price Net must be greater than 0');
    }
    if (!item[taxColumn] || Number(item[taxColumn]) < 0) {
      errors.push('Tax must be greater than or equal to 0');
    }

    return errors;
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file first',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting import process...');

      // Read Excel file
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      console.log('Workbook loaded:', {
        sheetNames: workbook.SheetNames,
        numberOfSheets: workbook.SheetNames.length
      });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      console.log('Using worksheet:', workbook.SheetNames[0]);

      // Helper function to get cell value
      const getCellValue = (col: string, row: number): string => {
        const cell = worksheet[`${col}${row}`];
        const value = cell ? cell.v?.toString() || '' : '';
        console.log(`Getting value at ${col}${row}:`, value);
        return value;
      };

      // Find A N G E B O T row
      let angebotRow = -1;
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      for (let row = range.s.r; row <= range.e.r; row++) {
        const value = getCellValue('B', row + 1);
        console.log(`Row ${row + 1}, Column B:`, value);
        if (value === 'A N G E B O T') {
          angebotRow = row + 1;
          break;
        }
      }

      console.log('Found A N G E B O T at row:', angebotRow);

      if (angebotRow === -1) {
        throw new Error('Could not find A N G E B O T row');
      }

      // Get order code from column D, same row as A N G E B O T
      const orderCode = getCellValue('D', angebotRow);
      console.log('Order Code:', orderCode);

      // Find customer ID row (3 rows after A N G E B O T)
      const customerIdRow = angebotRow + 3;
      const customerId = getCellValue('F', customerIdRow);
      console.log('Customer ID:', customerId);

      // Find date row (6 rows after A N G E B O T)
      const dateRow = angebotRow + 6;
      const createdAt = getCellValue('F', dateRow);
      console.log('Created At:', createdAt);

      // Find items start row (10 rows after A N G E B O T)
      let itemsStartRow = -1;
      for (let row = angebotRow + 4; row <= range.e.r; row++) {
        const value = getCellValue('B', row + 1);
        console.log(`Row ${row + 1}, Column B:`, value);
        if (value === 'Pos') {
          itemsStartRow = row + 2;
          console.log('Items start row:', itemsStartRow);
          break;
        }
      }

      if (itemsStartRow === -1) {
        throw new Error('Could not find items start row');
      }

      const items: Array<{
        position: number;
        articleNumber: string;
        quantity: number;
        unit: string;
        quantity2: number;
        unit2: string;
        description: string;
        priceNet: number;
        tax: number;
      }> = [];

      // Extract items data
      let currentRow = itemsStartRow;
      while (currentRow <= range.e.r) {
        const position = getCellValue('B', currentRow);
        const articleNumber = getCellValue('C', currentRow);
        let description = getCellValue('G', currentRow);
        const quantity = parseFloat(getCellValue('D', currentRow)) || 0;
        const unit = getCellValue('F', currentRow);
        let quantity2 = 0;
        let unit2 = '';
        const priceNet = parseFloat(getCellValue('J', currentRow)) || 0;
        const tax = parseFloat(getCellValue('K', currentRow)) || 0;

        console.log({ currentRow, position, articleNumber, description, quantity, unit, priceNet, tax });
        // Break if we hit position not empty but not a number
        if (position !== '' && isNaN(Number(position))) {
          break;
        }

        // continue if position is empty
        if (position === '') {
          unit2 = getCellValue('D', currentRow);
          if (unit2 !== '' && unit2.startsWith('/')) {
            const arr = unit2.replace('/', '').split(' ');
            if (arr.length === 2) {
              quantity2 = parseFloat(arr[0]) || 0;
              unit2 = arr[1];
            }
            description += getCellValue('G', currentRow);
            description = description.trim();
          }
          
          currentRow++;
          continue;
        }

        items.push({
          position: Number(position),
          articleNumber,
          quantity,
          unit,
          quantity2,
          unit2,
          description,
          priceNet,
          tax
        });

        currentRow++;
      }

      console.log('Extracted items:', items);

      // Validate required fields
      if (!orderCode || !customerId || !createdAt) {
        throw new Error('Missing required order information');
      }

      if (items.length === 0) {
        throw new Error('No items found in the Excel file');
      }

      // Create order data
      const orderData = {
        orderCode,
        customerId,
        createdAt: convertTextToDate(createdAt).toISOString(),
        items
      };

      console.log('Final order data to be sent:', orderData);

      // Send data to API
      const formData = new FormData();
      formData.append('data', JSON.stringify(orderData));

      console.log('Sending data to API...');
      const response = await fetch('/api/orders/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import order');
      }

      toast({
        title: 'Import Complete',
        description: `Order ${orderCode} imported successfully.`,
      });

      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      console.log('Import process completed.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Orders</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing order data. Required columns:
           
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 