import fetch from 'node-fetch';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImport(data, mode) {
  try {
    const response = await fetch('http://localhost:3000/api/products/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products: data, mode }),
    });

    const result = await response.json();
    console.log(`\nImport result (${mode} mode):`, result);
    
    // Fetch and display products after import
    const productsResponse = await fetch('http://localhost:3000/api/products');
    const products = await productsResponse.json();
    console.log(`\nProducts after ${mode} import:`);
    products.forEach(p => {
      console.log(`- ${p.articleNumber}: ${p.name} (${p.priceGross})`);
    });
  } catch (error) {
    console.error(`Error testing ${mode} mode:`, error);
  }
}

async function main() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'files', 'Customer Codes List.xlsx');
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 'A' });

    // Skip header row and take next 3 rows for testing
    const testRows = rows.slice(1, 4);
    
    // Map the data according to our schema
    const mappedData = testRows.map(row => {
      const priceGross = parseFloat(row['AC']) || 0;
      const tax = 19;
      const priceNet = (priceGross / (1 + tax / 100)).toFixed(2);

      return {
        articleNumber: row['A']?.toString() || '',
        itemsQuantity: parseInt(row['F']) || 0,
        name: row['G']?.toString() || '',
        description: row['H']?.toString() || '',
        priceGross: priceGross.toFixed(2),
        priceNet: priceNet,
        tax: tax.toString(),
        status: 'active'
      };
    }).filter(item => item.articleNumber && item.name);

    console.log('Test data:', JSON.stringify(mappedData, null, 2));

    // Test each import mode
    console.log('\n=== Testing import modes ===');
    
    // 1. First import with 'skip' mode
    console.log('\nTesting SKIP mode...');
    await testImport(mappedData, 'skip');
    
    // 2. Modify some data and test 'override' mode
    console.log('\nTesting OVERRIDE mode...');
    const modifiedData = mappedData.map(item => ({
      ...item,
      name: item.name + ' (Updated)',
      priceGross: (parseFloat(item.priceGross) * 1.1).toFixed(2), // 10% price increase
    }));
    await testImport(modifiedData, 'override');
    
    // 3. Test 'add' mode with the same data
    console.log('\nTesting ADD mode...');
    await testImport(mappedData, 'add');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the tests
main(); 