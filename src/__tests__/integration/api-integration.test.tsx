import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { renderWithIntegration, createAuthMock } from '@/test-utils/integration-test-utils';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

// Mock dos hooks do Clerk
const mockAuth = {
  useAuth: vi.fn(),
};

vi.mock('@clerk/react-router', async () => {
  const actual = await vi.importActual('@clerk/react-router');
  return {
    ...actual,
    useAuth: mockAuth.useAuth,
  };
});

// Mock do toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('🔌 Testes de Integração - APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('🔑 Chamadas Autenticadas', () => {
    it('deve fazer chamada autenticada bem-sucedida', async () => {
      const mockToken = 'valid_jwt_token';
      const mockResponse = { data: 'test data' };
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useAuthenticatedFetch(), {
        wrapper: ({ children }) => renderWithIntegration(children as React.ReactElement, {
          authScenario: 'authenticated'
        }).container
      });

      await waitFor(async () => {
        const response = await result.current('/api/test');
        const data = await response.json();
        
        expect(mockFetch).toHaveBeenCalledWith('/api/test', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        });
        expect(data).toEqual(mockResponse);
      });
    });

    it('deve incluir token JWT nas requisições', async () => {
      const mockToken = 'jwt_token_123';
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await result.current('/api/protected');
        
        expect(mockFetch).toHaveBeenCalledWith('/api/protected', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        });
      });
    });

    it('deve enviar dados JSON em requisições POST', async () => {
      const mockToken = 'jwt_token_123';
      const postData = { name: 'Test Property' };
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1, ...postData }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await result.current('/api/properties', {
          method: 'POST',
          body: JSON.stringify(postData),
        });
        
        expect(mockFetch).toHaveBeenCalledWith('/api/properties', {
          method: 'POST',
          body: JSON.stringify(postData),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        });
      });
    });
  });

  describe('🔄 Renovação de Token', () => {
    it('deve renovar token automaticamente em caso de 401', async () => {
      const firstToken = 'expired_token';
      const refreshedToken = 'refreshed_token';
      
      const mockGetToken = vi.fn()
        .mockResolvedValueOnce(firstToken)
        .mockResolvedValueOnce(refreshedToken);

      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: mockGetToken,
      });

      // Primeira tentativa: token expirado (401)
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' }),
        })
        // Segunda tentativa: sucesso com token renovado
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
        });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        const response = await result.current('/api/test');
        const data = await response.json();
        
        // Deve ter tentado 2 vezes
        expect(mockFetch).toHaveBeenCalledTimes(2);
        
        // Primeira tentativa com token expirado
        expect(mockFetch).toHaveBeenNthCalledWith(1, '/api/test', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${firstToken}`,
          },
        });
        
        // Segunda tentativa com token renovado
        expect(mockFetch).toHaveBeenNthCalledWith(2, '/api/test', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshedToken}`,
          },
        });
        
        expect(data).toEqual({ data: 'success' });
      });
    });

    it('deve falhar após esgotar tentativas de renovação', async () => {
      const mockGetToken = vi.fn().mockResolvedValue('expired_token');

      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: mockGetToken,
      });

      // Sempre retorna 401 (token sempre expirado)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token expired' }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/test')).rejects.toThrow('Sessão expirada');
        
        // Deve ter tentado 3 vezes (configuração padrão)
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(toast.error).toHaveBeenCalledWith('Sessão expirada. Faça login novamente.');
      });
    });
  });

  describe('🚨 Tratamento de Erros', () => {
    it('deve tratar erro 403 (Forbidden) adequadamente', async () => {
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue('valid_token'),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/admin')).rejects.toThrow('Você não tem permissão');
        expect(toast.error).toHaveBeenCalledWith('Você não tem permissão para acessar este recurso.');
      });
    });

    it('deve tratar erro 404 (Not Found) adequadamente', async () => {
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue('valid_token'),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not Found' }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/nonexistent')).rejects.toThrow('Recurso não encontrado');
        expect(toast.error).toHaveBeenCalledWith('Recurso não encontrado.');
      });
    });

    it('deve tratar erro 500 (Server Error) adequadamente', async () => {
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue('valid_token'),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/test')).rejects.toThrow('Erro interno do servidor');
        expect(toast.error).toHaveBeenCalledWith('Erro interno do servidor. Tente novamente mais tarde.');
      });
    });

    it('deve tratar erro de rede adequadamente', async () => {
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue('valid_token'),
      });

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/test')).rejects.toThrow('Network error');
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('deve não mostrar toast de erro quando showErrorToast é false', async () => {
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue('valid_token'),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server Error' }),
      });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/test', { showErrorToast: false })).rejects.toThrow();
        expect(toast.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('🔍 Integração com React Query', () => {
    it('deve fazer query autenticada com React Query', async () => {
      const mockToken = 'valid_token';
      const mockData = [{ id: 1, name: 'Property 1' }];
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const { result } = renderHook(() => 
        useAuthenticatedQuery({
          queryKey: ['properties'],
          url: '/api/properties',
        })
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockData);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/properties', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockToken}`,
        },
      });
    });

    it('deve não fazer query quando usuário não está autenticado', async () => {
      mockAuth.useAuth.mockReturnValue(createAuthMock('unauthenticated'));

      const { result } = renderHook(() => 
        useAuthenticatedQuery({
          queryKey: ['properties'],
          url: '/api/properties',
        })
      );

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('deve cachear dados corretamente', async () => {
      const mockToken = 'valid_token';
      const mockData = [{ id: 1, name: 'Property 1' }];
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      // Primeira query
      const { result: result1 } = renderHook(() => 
        useAuthenticatedQuery({
          queryKey: ['properties'],
          url: '/api/properties',
          staleTime: 5000, // 5 segundos
        })
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Segunda query com mesma chave - deve usar cache
      const { result: result2 } = renderHook(() => 
        useAuthenticatedQuery({
          queryKey: ['properties'],
          url: '/api/properties',
          staleTime: 5000,
        })
      );

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
        expect(result2.current.data).toEqual(mockData);
      });

      // Deve ter feito apenas uma chamada de API
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('🔄 Rate Limiting e Retry', () => {
    it('deve fazer retry em caso de erro temporário', async () => {
      const mockToken = 'valid_token';
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      // Primeira tentativa falha, segunda sucede
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'success' }),
        });

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        const response = await result.current('/api/test');
        const data = await response.json();
        
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(data).toEqual({ data: 'success' });
      });
    });

    it('deve respeitar limite de retries customizado', async () => {
      const mockToken = 'valid_token';
      
      mockAuth.useAuth.mockReturnValue({
        ...createAuthMock('authenticated'),
        getToken: vi.fn().mockResolvedValue(mockToken),
      });

      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const { result } = renderHook(() => useAuthenticatedFetch());

      await waitFor(async () => {
        await expect(result.current('/api/test', { retries: 1 })).rejects.toThrow('Persistent error');
        
        // Deve ter tentado apenas 1 vez (sem retry)
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });
}); 