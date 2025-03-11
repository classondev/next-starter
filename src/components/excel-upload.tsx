"use client";

import { useState } from "react";
import { readExcelFile, readExcelSheets } from "@/lib/excel";

interface ExcelUploadProps {
  onDataReceived?: (data: any) => void;
  multiple?: boolean;
}

export function ExcelUpload({ onDataReceived, multiple = false }: ExcelUploadProps) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      const files = event.target.files;
      if (!files?.length) return;

      const file = files[0];
      const result = multiple 
        ? await readExcelSheets(file)
        : await readExcelFile(file);

      onDataReceived?.(result);
    } catch (error) {
      console.error("Error processing Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <label
        htmlFor="excel-upload"
        className="flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg
            className="mb-4 h-8 w-8 text-gray-500"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">Excel files only</p>
        </div>
        <input
          id="excel-upload"
          type="file"
          className="hidden"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          disabled={loading}
        />
      </label>
      {loading && (
        <div className="text-sm text-gray-500">Processing Excel file...</div>
      )}
    </div>
  );
} 