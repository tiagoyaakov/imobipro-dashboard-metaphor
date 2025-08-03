import { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';

/**
 * Wrapper simples para testes sem JSX syntax
 * Para evitar problemas de parsing no Vitest
 */
export function createTestWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: ReactNode }) {
    // Retorna apenas os children para evitar problemas de JSX
    // O QueryClient será mockado pelos testes
    return children;
  };
}

/**
 * Mock simples para contextos nos testes
 */
export const mockWrapper = ({ children }: any) => children;