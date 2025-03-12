import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { POST } from '../route';
import { db } from '@/db';
import { products } from '@/db/schema';

// Mock console.error to prevent noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock products data
const mockProducts = [
  {
    id: 1,
    articleNumber: '1001',
    name: 'Mungsprossen',
    description: null,
    itemsQuantity: 100,
    priceNet: '14.02',
    priceGross: '15.00',
    tax: '7.00',
    status: 'active',
    category: 'Food',
  },
  {
    id: 2,
    articleNumber: '920220467',
    name: 'Reisbandnudeln',
    description: null,
    itemsQuantity: 50,
    priceNet: '2.20',
    priceGross: '2.35',
    tax: '7.00',
    status: 'active',
    category: 'Food',
  },
];

// Mock the database
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(mockProducts)),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    transaction: vi.fn(async (callback) => {
      return callback(db);
    }),
  },
}));

describe('Orders Import API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should import order from Excel data', async () => {
    const excelData = {
      orderCode: '25-1314',
      createdAt: '7-Mar-25',
      customerId: '289',
      items: [
        {
          position: 1,
          articleNumber: '1001',
          quantity: 1,
          unit: 'Kt',
          description: 'Mungsprossen/10Kg /Kiste/Gia dó',
          priceNet: 14.02,
          tax: 7.00,
        },
        {
          position: 2,
          articleNumber: '920220467',
          quantity: 20,
          unit: 'Stk',
          description: 'Reisbandnudeln Lami M 500g/20Pk',
          priceNet: 2.20,
          tax: 7.00,
        },
      ],
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(excelData));

    const request = new Request('http://localhost:3000/api/orders/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('code', excelData.orderCode);
    expect(db.transaction).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledTimes(2); // Once for order, once for items
  });

  it('should handle validation errors', async () => {
    const invalidData = {
      // Missing required fields
      items: [],
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(invalidData));

    const request = new Request('http://localhost:3000/api/orders/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Validation failed');
  });

  it('should handle product not found errors', async () => {
    const excelData = {
      orderCode: '25-1314',
      createdAt: '7-Mar-25',
      customerId: '289',
      items: [
        {
          position: 1,
          articleNumber: 'INVALID-SKU',
          quantity: 1,
          unit: 'Kt',
          description: 'Invalid Product',
          priceNet: 14.02,
          tax: 7.00,
        },
      ],
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(excelData));

    const request = new Request('http://localhost:3000/api/orders/import', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Product not found: INVALID-SKU');
  });
}); 