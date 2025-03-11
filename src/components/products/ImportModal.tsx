import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

type ImportMode = 'override' | 'skip' | 'add';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportModal({ open, onOpenChange, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('skip');
  const [skipHeader, setSkipHeader] = useState(true);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processExcelFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Use { raw: false } to handle all data types properly
          // Use { header: 'A' } to get column letters as keys
          // Use { blankrows: false } to skip empty rows
          const rows = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 'A',
            raw: false,
            blankrows: false
          });
          
          console.log('Total rows in Excel:', rows.length);
          
          // Skip header if needed
          const processedRows = skipHeader ? rows.slice(1) : rows;
          console.log('Rows after header skip:', processedRows.length);
          
          // Map Excel columns to DB fields
          const mappedData = processedRows.map((row: any, index: number) => {
            try {
              // Validate required fields
              const name = row['G']?.toString();
              const articleNumber = row['A']?.toString();
              
              if (!articleNumber) {
                console.log(`Row ${index + 2}: Missing article number`);
                return null;
              }
              
              if (!name) {
                console.log(`Row ${index + 2}: Missing name for article ${articleNumber}`);
                return null;
              }

              // Convert empty strings to appropriate defaults
              const itemsQuantity = row['F'] ? parseInt(row['F']) || 0 : 0;
              const description = row['H']?.toString() || '';
              const priceGross = row['AC']?.toString() || '0';

              return {
                articleNumber,
                itemsQuantity,
                name,
                description,
                priceGross,
                // Set default values for required fields
                priceNet: '0',
                tax: '0',
                status: 'active'
              };
            } catch (error) {
              console.log(`Error processing row ${index + 2}:`, error);
              return null;
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null); // Filter out null items and type assert

          console.log('Valid products after mapping:', mappedData.length);

          if (mappedData.length === 0) {
            throw new Error('No valid products found in the Excel file after processing');
          }

          resolve(mappedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      const data = await processExcelFile(file);
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast({
          title: "Error",
          description: "No valid products found in the Excel file. Please check that your file has the correct format and contains valid data.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: data,
          mode: importMode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = 'Failed to import products';
        if (result.error === 'Validation failed' && result.details) {
          const invalidRows = new Set(result.details.map((d: any) => d.path[1] + 1));
          errorMessage = `Validation failed for rows: ${Array.from(invalidRows).join(', ')}. Please check these rows have all required fields.`;
        }
        throw new Error(errorMessage);
      }

      // Show detailed results
      const successMessage = [
        `Successfully imported ${result.imported} products`,
        result.skipped > 0 ? `Skipped ${result.skipped} existing products` : '',
        result.failed > 0 ? `Failed to import ${result.failed} products` : ''
      ].filter(Boolean).join('\n');

      toast({
        title: "Import Complete",
        description: successMessage,
        duration: 5000,
      });

      // If there were errors, show them in a separate toast
      if (result.failed > 0 && result.errors?.length > 0) {
        const errorDetails = result.errors
          .map((err: { articleNumber: string; error: string }) => 
            `Article ${err.articleNumber}: ${err.error}`
          )
          .join('\n');

        toast({
          title: "Import Errors",
          description: errorDetails,
          variant: "destructive",
          duration: 10000,
        });
      }
      
      onImportComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import products",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Import products from an Excel file. Make sure your file follows the required format.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="col-span-4">
              Excel File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mode" className="col-span-4">
              Import Mode
            </Label>
            <Select
              value={importMode}
              onValueChange={(value: ImportMode) => setImportMode(value)}
            >
              <SelectTrigger className="col-span-4">
                <SelectValue placeholder="Select import mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="override">Override existing</SelectItem>
                <SelectItem value="skip">Skip existing</SelectItem>
                <SelectItem value="add">Add as new</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skipHeader"
              checked={skipHeader}
              onCheckedChange={(checked) => setSkipHeader(checked as boolean)}
            />
            <Label htmlFor="skipHeader">Skip first row (header)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 