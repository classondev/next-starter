'use client';

import { useState, useEffect, useRef } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Printer, FileSpreadsheet, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { parseNumber } from '@/lib/utils';
import { EditableCell } from '../EditableCell';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useTranslation } from '@/i18n/useTranslation';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const showDescription = (description: string, separator: string = '...') => {
  const arr = description.split(separator);
  if (arr.length > 1) {
    return arr[0].trim() + '<br/><span style="font-size: 12px; padding-top: 2px; color: gray;">' + arr[1].trim() + '</span>';
  }
  return description;
}

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

interface FilePreview {
  file: File;
  orderCode: string;
  customerId: string;
  date?: Date;
  items: Array<{
    position: number;
    articleNumber: string;
    quantity: number;
    unit: string;
    quantity2: number;
    unit2: string;
    description: string;
    priceNet: number;
    tax: number;
  }>;
}

interface GroupedItem {
  articleNumber: string;
  description: string;
  unit: string;
  unit2: string;
  priceNet: number;
  tax: number;
  totalQuantity: number;
  totalQuantity2: number;
  orderCode: string;
  sources: Array<{
    fileName: string;
    orderCode: string;
    position: number;
    quantity: number;
    quantity2: number;
  }>;
}

export function ImportOrdersModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportOrdersModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, GroupedItem>>({});
  const [disabledFiles, setDisabledFiles] = useState<Set<number>>(new Set());
  const [headerTitle, setHeaderTitle] = useState<string>(new Date().toLocaleDateString('de-DE'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { locale } = useLanguage();
  const { t } = useTranslation(locale);

  // Update groupedItems when filePreviews or disabledFiles changes
  useEffect(() => {
    const newGroupedItems: Record<string, GroupedItem> = {};
    
    filePreviews.forEach((preview, index) => {
      // Skip disabled files
      if (disabledFiles.has(index)) return;

      preview.items.forEach(item => {
        if (!item.articleNumber) return; // Skip items without article number

        if (!newGroupedItems[item.articleNumber]) {
          newGroupedItems[item.articleNumber] = {
            articleNumber: item.articleNumber,
            description: item.description,
            unit: item.unit,
            unit2: item.unit2,
            priceNet: item.priceNet,
            tax: item.tax,
            totalQuantity: 0,
            totalQuantity2: 0,
            orderCode: preview.orderCode,
            sources: []
          };
        }

        // Add quantities
        newGroupedItems[item.articleNumber].totalQuantity += item.quantity;
        newGroupedItems[item.articleNumber].totalQuantity2 += item.quantity2;

        // Add source information
        newGroupedItems[item.articleNumber].sources.push({
          fileName: preview.file.name,
          orderCode: preview.orderCode,
          position: item.position,
          quantity: item.quantity,
          quantity2: item.quantity2
        });
      });
    });

    setGroupedItems(newGroupedItems);
  }, [filePreviews, disabledFiles]);

  const toggleFileEnabled = (index: number) => {
    setDisabledFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Generate previews for new files
      for (const file of files) {
        try {
          const preview = await generatePreview(file);
          setFilePreviews(prev => [...prev, preview]);
        } catch (error) {
          console.error(`Error generating preview for ${file.name}:`, error);
          toast({
            title: 'Error',
            description: `Failed to preview ${file.name}. Please check if it's a valid Excel file.`,
            variant: 'destructive',
          });
        }
      }
    }
  };

  const generatePreview = async (file: File): Promise<FilePreview> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const getCellValue = (col: string, row: number): string => {
      const cell = worksheet[`${col}${row}`];
      return cell ? cell.v?.toString() || '' : '';
    };

    // Find A N G E B O T row
    let angebotRow = -1;
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      if (getCellValue('B', row + 1) === 'A N G E B O T') {
        angebotRow = row + 1;
        break;
      }
    }

    if (angebotRow === -1) {
      throw new Error('Could not find A N G E B O T row');
    }

    const orderCode = getCellValue('D', angebotRow);
    const customerId = getCellValue('D', angebotRow + 1);
    const dateText = getCellValue('D', angebotRow + 2);
    let date: Date | undefined;
    try {
      date = convertTextToDate(dateText);
    } catch (error) {
      console.error('Error parsing date:', error);
    }

    // Find items start row
    let itemsStartRow = -1;
    for (let row = angebotRow + 4; row <= range.e.r; row++) {
      if (getCellValue('B', row + 1) === 'Pos') {
        itemsStartRow = row + 2;
        break;
      }
    }

    if (itemsStartRow === -1) {
      throw new Error('Could not find items start row');
    }

    const items = [];
    let currentRow = itemsStartRow;

    while (currentRow <= range.e.r) {
      const position = getCellValue('B', currentRow);
      const articleNumber = getCellValue('C', currentRow);
      let description = getCellValue('G', currentRow);
      let quantity = parseNumber(getCellValue('D', currentRow));
      let unit = getCellValue('F', currentRow);
      let quantity2: number = 0;
      let unit2 = '';
      
      if (unit.toLocaleLowerCase() === 'kt') {
        quantity2 = quantity;
        unit2 = unit;
      }
      const priceNet = parseNumber(getCellValue('J', currentRow));
      const tax = parseNumber(getCellValue('K', currentRow));

      if (position !== '' && isNaN(Number(position))) {
        break;
      }

      if (position === '') {
        unit2 = getCellValue('D', currentRow);
        if (unit2 !== '' && unit2.startsWith('/')) {
          const arr = unit2.replace('/', '').split(' ');
          if (arr.length === 2) {
            quantity2 = parseNumber(arr[0]); // Kt quantity
            unit2 = arr[1]; 
          }
        }
        if (description !== '') {
          items[items.length - 1].description += `...${description}`;
        }
        if (quantity2 > 0) {
          items[items.length - 1].quantity2 = quantity2;
          items[items.length - 1].unit2 = unit2;
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

    console.log(items);
    return { 
      file, 
      orderCode, 
      customerId,
      date,
      items 
    };
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Only send enabled files
      const enabledPreviews = filePreviews.filter((_, index) => !disabledFiles.has(index));

      const response = await fetch('/api/orders/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enabledPreviews.map(preview => ({
          orderCode: preview.orderCode,
          customerId: preview.customerId,
          items: preview.items
        }))),
      });

      if (!response.ok) {
        throw new Error('Failed to import orders');
      }

      const result = await response.json();

      toast({
        title: 'Import Complete',
        description: result.message || `Successfully imported ${result.orders.length} orders`,
        variant: 'default',
      });

      if (result.success && onSuccess) {
        onSuccess();
      }

      // Clear files after successful import
      setSelectedFiles([]);
      setFilePreviews([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: 'Failed to import orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const enabledPreviews = filePreviews.filter((_, index) => !disabledFiles.has(index));
    
    const fileColumns = enabledPreviews.map(preview => 
      `<th class="text-right text-xs"><div style="width: 40px; writing-mode: vertical-rl; transform: rotate(180deg);">${preview.orderCode}</div></th>`
    ).join('');

    const tableContent = `
      <html>
        <head>
          <title>${headerTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>${headerTitle}</h2>
          <table>
            <thead>
              <tr>
                <th>${t('orders.details.articleNumber')}</th>
                <th>${t('orders.details.description')}</th>
                <th class="text-right">${t('orders.details.kt')}</th>
                <th class="text-right">${t('orders.details.stk')}</th>
                ${fileColumns}
                <th>${t('orders.note')}</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(groupedItems).map(item => {
                const fileQuantities = enabledPreviews.map(preview => {
                  const matchingItem = preview.items.find(i => i.articleNumber === item.articleNumber);
                  return `<td class="text-right" style="width:50px">${matchingItem ? matchingItem.quantity : ''}</td>`;
                }).join('');

                return `
                  <tr>
                    <td class="text-xs" style="width:10%">${item.articleNumber}</td>
                    <td class="text-xs" style="width:30%">${showDescription(item.description)}</td>
                    <td class="text-right text-xs" style="width:50px">${item.totalQuantity2}</td>
                    <td class="text-right text-xs" style="width:50px">
                      ${item.totalQuantity}
                    </td>
                    ${fileQuantities}
                    <td></td>
                  </tr>
                `;
              }).join('')}
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
    const enabledPreviews = filePreviews.filter((_, index) => !disabledFiles.has(index));

    // Create headers including all file columns
    const headers = [
      t('orders.details.articleNumber'),
      t('orders.details.description'),
      t('orders.details.kt'),
      t('orders.details.stk'),
      ...enabledPreviews.map(preview => preview.orderCode)
    ];

    // Create data rows
    const data = Object.values(groupedItems).map(item => {
      const baseData: Record<string, string | number> = {
        [t('orders.details.articleNumber')]: item.articleNumber,
        [t('orders.details.description')]: item.description,
        [t('orders.details.kt')]: item.totalQuantity2,
        [t('orders.details.stk')]: item.totalQuantity
      };

      // Add quantities for each enabled file
      enabledPreviews.forEach(preview => {
        const matchingItem = preview.items.find(i => i.articleNumber === item.articleNumber);
        baseData[preview.orderCode] = matchingItem ? matchingItem.quantity : '';
      });

      return baseData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, headerTitle);
    XLSX.writeFile(workbook, `${headerTitle}.xlsx`);
  };

  const handlePdfExport = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(14);
      doc.text(headerTitle, 14, 15);

      const enabledPreviews = filePreviews.filter((_, index) => !disabledFiles.has(index));

      // Create headers including all file columns
      const headers = [
        t('orders.details.articleNumber'),
        t('orders.details.description'),
        t('orders.details.kt'),
        t('orders.details.stk'),
        ...enabledPreviews.map(preview => preview.orderCode),
        t('orders.note')
      ];

      // Create data rows
      const tableData = Object.values(groupedItems).map(item => {
        const baseData = [
          item.articleNumber,
          item.description,
          item.totalQuantity2,
          item.totalQuantity
        ];

        // Add quantities for each enabled file
        enabledPreviews.forEach(preview => {
          const matchingItem = preview.items.find(i => i.articleNumber === item.articleNumber);
          baseData.push(matchingItem ? matchingItem.quantity.toString() : '');
        });

        return baseData;
      });

      // Calculate column widths based on content
      const columnStyles: { [key: string]: Partial<unknown> } = {
        0: { cellWidth: 20 }, // Article Number
        1: { cellWidth: 'auto' }, // Description
        2: { cellWidth: 10, halign: 'right' }, // Kt
        3: { cellWidth: 10, halign: 'right' }, // Stk.
      };

      // Add widths for file columns
      enabledPreviews.forEach((_, index) => {
        columnStyles[`${index + 4}`] = { cellWidth: 10, halign: 'right' };
      });

      columnStyles[`${enabledPreviews.length + 4}`] = { cellWidth: 'auto' };

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 20,
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [0, 0, 0],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles,
        theme: 'grid',
        margin: { top: 10 }
      });

      doc.save(`${headerTitle}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: t('common.error'),
        description: t('orders.details.exportError'),
        variant: 'destructive',
      });
    }
  };

  const handleCellEdit = (item: GroupedItem, field: string, value: string | number, fileIndex?: number) => {
    if (field === 'articleNumber' || field === 'description') {
      setGroupedItems(prev => {
        const newItems = { ...prev };
        const updatedItem = { ...newItems[item.articleNumber] };
        updatedItem[field as keyof Pick<GroupedItem, 'articleNumber' | 'description'>] = value.toString();
        newItems[item.articleNumber] = updatedItem;
        return newItems;
      });
    } else if (field === 'quantity' && typeof fileIndex === 'number') {
      // Update quantity in the specific file preview
      setFilePreviews(prev => {
        const newPreviews = [...prev];
        const preview = { ...newPreviews[fileIndex] };
        const itemIndex = preview.items.findIndex(i => i.articleNumber === item.articleNumber);
        if (itemIndex !== -1) {
          preview.items[itemIndex] = {
            ...preview.items[itemIndex],
            quantity: typeof value === 'number' ? value : parseFloat(value) || 0
          };
        }
        newPreviews[fileIndex] = preview;
        return newPreviews;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('orders.importOrders')}</DialogTitle>
          {/* <DialogDescription>
            Upload Excel files containing order data to import. Items with the same article number will be grouped together.
          </DialogDescription> */}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {filePreviews.length > 0 && (
            <ScrollArea className="h-[calc(90vh-12rem)] w-full pr-3" style={{ overflowX: 'auto', display: 'block' }} type="auto">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between pr-4">
                    <Input
                      value={headerTitle}
                      onChange={(e) => setHeaderTitle(e.target.value)}
                      className="w-[300]"
                      placeholder={t('orders.details.enterTitle')}
                    />
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        {t('common.print')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExcelExport}
                        className="flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        {t('common.export.excel')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePdfExport}
                        className="flex items-center gap-2"
                      >
                        <FileDown className="h-4 w-4" />
                        {t('common.export.pdf')}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-[800px] w-full caption-bottom text-sm">
                          <thead>
                            <tr className="border rounded-md">
                              <th className="h-10 border px-2 text-left align-middle font-medium whitespace-nowrap">
                                {t('orders.details.articleNumber')}
                              </th>
                              <th className="h-10 border px-2 text-left align-middle font-medium whitespace-nowrap">
                                {t('orders.details.description')}
                              </th>
                              <th className="h-10 border px-2 text-right align-middle font-medium whitespace-nowrap">
                                {t('orders.details.kt')}
                              </th>
                              <th className="h-10 border px-2 text-right align-middle font-medium whitespace-nowrap">
                                {t('orders.details.stk')}
                              </th>
                              {filePreviews.map((preview, index) => (
                                !disabledFiles.has(index) && (
                                  <th key={index} className="h-10 border rounded-md px-2 text-right align-middle font-medium whitespace-nowrap" style={{ width: '50px' }}>
                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{preview.orderCode}</div>
                                  </th>
                                )
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.values(groupedItems).map((item) => (
                              <tr
                                key={item.articleNumber}
                                className="border transition-colors hover:bg-muted/50"
                              >
                                <td className="p-2 border align-middle font-medium whitespace-nowrap" style={{ width: '20px' }}>
                                  <EditableCell
                                    value={item.articleNumber}
                                    onSave={(value) => handleCellEdit(item, 'articleNumber', value)}
                                    className="whitespace-nowrap"
                                  />
                                </td>
                                <td className="p-2 border align-middle whitespace-nowrap" style={{ width: '200px' }}>
                                  <EditableCell
                                    value={item.description}
                                    onSave={(value) => handleCellEdit(item, 'description', value)}
                                    className="whitespace-nowrap"
                                  />
                                </td>
                                <td className="p-2 border align-middle text-right whitespace-nowrap" style={{ width: '50px' }}>
                                  {item.totalQuantity2}
                                </td>
                                <td className="p-2 border align-middle text-right whitespace-nowrap" style={{ width: '50px' }}>
                                  {item.totalQuantity}
                                </td>
                                {filePreviews.map((preview, index) => (
                                  !disabledFiles.has(index) && (
                                    <td key={index} className="p-2 border bg-muted/50 text-muted-foreground align-middle text-right whitespace-nowrap">
                                      {preview.items
                                        .filter((item1) => item.articleNumber === item1.articleNumber)
                                        .map((fileItem) => (
                                          <div key={`${index}-${item.articleNumber}`}>
                                            <EditableCell
                                              value={fileItem.quantity}
                                              type="number"
                                              onSave={(value) => handleCellEdit(item, 'quantity', value, index)}
                                              className="text-right"
                                            />
                                            {fileItem.quantity2 > 0 && (
                                              <span className="text-xs text-gray-500 block">
                                                {fileItem.quantity2} Kt
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                    </td>
                                  )
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Accordion type="single" collapsible defaultValue="">
                    <AccordionItem value="original-files">
                      <AccordionTrigger className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{t('orders.details.originalFiles')}</span>
                          <span className="text-sm text-muted-foreground">
                            ({filePreviews.length} {t('common.files')})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {filePreviews.map((preview, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!disabledFiles.has(index)}
                                    onChange={() => toggleFileEnabled(index)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                  <span className="font-medium truncate">
                                    {preview.file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => removeFile(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {t('orders.details.order')}: {preview.orderCode} • {t('orders.details.customer')}: {preview.customerId}
                                  {preview.date && ` • ${preview.date.toLocaleDateString(locale)}`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-4">
          <div className="flex w-full items-center justify-between">
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.pdf"
              multiple
              className="w-[400px]"
            />
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleImport} disabled={isLoading || selectedFiles.length === 0}>
                {isLoading ? t('common.loading') : t('orders.importOrders')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 