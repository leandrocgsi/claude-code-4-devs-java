import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, RenderHookOptions } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient: QueryClient = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

export function renderWithProviders(ui: ReactElement, queryClient: QueryClient = createTestQueryClient()) {
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient) }) };
}

export function renderHookWithProviders<Result, Props>(
  hook: (props: Props) => Result,
  options: Omit<RenderHookOptions<Props>, 'wrapper'> = {},
  queryClient: QueryClient = createTestQueryClient(),
) {
  return { queryClient, ...renderHook(hook, { ...options, wrapper: createWrapper(queryClient) }) };
}
