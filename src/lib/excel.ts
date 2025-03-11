import { read, utils } from 'xlsx';

export async function readExcelFile(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(worksheet);
    
    return {
      data: jsonData,
      sheetName,
      totalRows: jsonData.length,
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

export async function readExcelSheets(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    
    // Convert all sheets to JSON
    const sheets = workbook.SheetNames.reduce((acc, sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      acc[sheetName] = utils.sheet_to_json(worksheet);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      sheets,
      sheetNames: workbook.SheetNames,
      totalSheets: workbook.SheetNames.length,
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
} 