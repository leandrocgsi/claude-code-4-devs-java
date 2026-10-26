import '@testing-library/jest-dom';
import axios from 'axios';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './test/msw/server';

axios.defaults.adapter = 'fetch';

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
