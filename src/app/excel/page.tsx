"use client";

import { useState } from "react";
import { ExcelUpload } from "@/components/excel-upload";

export default function ExcelPage() {
  const [data, setData] = useState<any>(null);

  const handleDataReceived = (excelData: any) => {
    setData(excelData);
    console.log("Excel data:", excelData);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Excel File Upload</h1>
      
      <div className="mb-8 max-w-xl">
        <ExcelUpload onDataReceived={handleDataReceived} multiple={false} />
      </div>

      {data && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">Uploaded Data</h2>
          <div className="rounded-lg border bg-white p-4">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 