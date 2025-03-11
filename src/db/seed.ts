import { db } from './index';
import { products } from './schema';

const mockProducts = [
  {
    articleNumber: 'PRD-001',
    name: 'Premium Coffee Beans',
    description: 'High-quality Arabica coffee beans from Colombia',
    note: 'Best seller',
    itemsQuantity: 1000,
    boxQuantity: 100,
    stockNote: 'Reorder when below 200',
    itemsPerBox: 10,
    priceNet: '15.00',
    priceGross: '18.00',
    tax: '20.00',
    status: 'active',
    category: 'Beverages',
    createdBy: 'system',
    modifiedBy: 'system'
  },
  {
    articleNumber: 'PRD-002',
    name: 'Organic Green Tea',
    description: 'Premium Japanese green tea leaves',
    note: 'Seasonal product',
    itemsQuantity: 500,
    boxQuantity: 50,
    stockNote: 'Limited stock',
    itemsPerBox: 10,
    priceNet: '12.50',
    priceGross: '15.00',
    tax: '20.00',
    status: 'active',
    category: 'Beverages',
    createdBy: 'system',
    modifiedBy: 'system'
  }
] as const;

async function seed() {
  console.log('Seeding database...');
  
  try {
    // Clear existing data
    await db.delete(products);
    
    // Insert mock data
    for (const product of mockProducts) {
      await db.insert(products).values(product);
    }
    
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 