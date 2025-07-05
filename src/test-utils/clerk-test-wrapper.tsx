import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ClerkProvider } from '@clerk/react-router';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface ClerkTestWrapperProps {
  children: React.ReactNode;
}

export function ClerkTestWrapper({ children }: ClerkTestWrapperProps) {
  const queryClient = createTestQueryClient();
  const publishableKey = "pk_test_Y2xlcmsuY29tcGFueSQkLXRlc3QtaWQ"; // Chave de teste segura

  return (
    <BrowserRouter>
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ClerkProvider>
    </BrowserRouter>
  );
}

// Função de renderização customizada que já inclui todos os providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ClerkTestWrapper,
    ...options,
  });
} 