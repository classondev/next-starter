import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';

// Mock handlers for API endpoints
export const handlers = [
  http.get('/api/products', () => {
    return HttpResponse.json([
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
    ]);
  }),
];

// Setup MSW server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_NAME = 'Test Store';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test'; 