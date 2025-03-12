import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { GET, POST } from '../route';
import { db } from '@/db';
import { products } from '@/db/schema';
import { z } from 'zod';

// Mock console.error to prevent noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock database response data
const mockProducts = [
  {
    id: 1,
    articleNumber: 'TEST-001',
    name: 'Test Product',
    description: 'Test Description',
    itemsQuantity: 10,
    priceNet: '100.00',
    priceGross: '120.00',
    tax: '20.00',
    status: 'active',
    category: 'Test Category',
  },
];

// Mock the database
vi.mock('@/db', () => {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(mockProducts),
  };

  const mockSelect = {
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  };

  return {
    db: {
      select: vi.fn(() => mockSelect),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([mockProducts[0]])),
        })),
      })),
    },
  };
});

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return an array of products', async () => {
      const request = new Request('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockProducts);
      expect(db.select).toHaveBeenCalled();
    });

    it('should handle search query', async () => {
      const request = new Request('http://localhost:3000/api/products?query=test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockProducts);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        articleNumber: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        itemsQuantity: 10,
        priceNet: 100.00,
        priceGross: 120.00,
        tax: 20.00,
        status: 'active' as const,
        category: 'Test Category',
      };

      const request = new Request('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe(productData.name);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        // Missing required fields and invalid values
        name: '',
        priceNet: -100,
        priceGross: -120,
        tax: -20,
      };

      const request = new Request('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Validation failed');
      expect(data).toHaveProperty('details');
      
      const errors = data.details as z.ZodIssue[];
      expect(Array.isArray(errors)).toBe(true);
      
      // Helper function to find error by path
      const findError = (path: string[]) => 
        errors.find(error => 
          error.path.join('.') === path.join('.')
        );
      
      // Verify required field error
      const articleNumberError = findError(['articleNumber']);
      expect(articleNumberError).toBeDefined();
      expect(articleNumberError?.code).toBe('invalid_type');
      expect(articleNumberError?.message).toBe('Required');

      // Verify string length error
      const nameError = findError(['name']);
      expect(nameError).toBeDefined();
      expect(nameError?.code).toBe('too_small');
      expect(nameError?.message).toBe('String must contain at least 1 character(s)');

      // Verify number validation error
      const priceNetError = findError(['priceNet']);
      expect(priceNetError).toBeDefined();
      expect(priceNetError?.code).toBe('too_small');
      expect(priceNetError?.message).toBe('Number must be greater than 0');
    });
  });
}); 