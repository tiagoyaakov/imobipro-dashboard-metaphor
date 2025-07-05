import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import App from './App'
import './index.css'

// ================================================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ================================================================
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('🚨 VITE_CLERK_PUBLISHABLE_KEY não encontrada em .env')
}

// ================================================================
// VERIFICAÇÃO DE SEGURANÇA EM PRODUÇÃO
// ================================================================
if (import.meta.env.PROD && !window.location.protocol.startsWith('https')) {
  throw new Error('🔒 Clerk requer HTTPS em produção')
}

// ================================================================
// QUERY CLIENT PARA TANSTACK REACT QUERY
// ================================================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      retry: (failureCount, error: Error & { status?: number }) => {
        // Não fazer retry em erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  }
})

// ================================================================
// CONFIGURAÇÃO DE APARÊNCIA DO CLERK (TEMA DARK)
// ================================================================
const clerkAppearance = {
  elements: {
    rootBox: "mx-auto",
    card: "shadow-xl border-border bg-card text-card-foreground rounded-lg",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md h-10 px-4 py-2 font-medium transition-colors",
    formFieldInput: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    footerActionLink: "text-primary hover:text-primary/90 underline-offset-4 hover:underline",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground",
    socialButtonsIconButton: "border-input bg-background hover:bg-accent hover:text-accent-foreground",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    userButtonAvatarBox: "w-8 h-8",
    userButtonPopoverCard: "bg-popover text-popover-foreground border-border shadow-lg",
    userButtonPopoverActionButton: "text-foreground hover:bg-accent hover:text-accent-foreground",
  },
  variables: {
    colorPrimary: "hsl(var(--primary))",
    colorBackground: "hsl(var(--background))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    colorDanger: "hsl(var(--destructive))",
    colorSuccess: "hsl(var(--primary))",
    colorWarning: "hsl(var(--warning))",
    colorNeutral: "hsl(var(--muted))",
    colorInputBackground: "hsl(var(--background))",
    colorInputText: "hsl(var(--foreground))",
    spacingUnit: "1rem",
    borderRadius: "0.5rem"
  }
}

// ================================================================
// RENDERIZAÇÃO DA APLICAÇÃO
// ================================================================
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
        appearance={clerkAppearance}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <App />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
)
