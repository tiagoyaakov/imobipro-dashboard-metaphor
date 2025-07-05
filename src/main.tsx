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
// CONFIGURAÇÃO DE APARÊNCIA DO CLERK (TEMA DARK PERSONALIZADO)
// ================================================================
const clerkAppearance = {
  elements: {
    // Layout principal
    rootBox: "mx-auto w-full max-w-md",
    card: "shadow-soft-lg border-border bg-card text-card-foreground rounded-xl p-6",
    
    // Cabeçalho
    headerTitle: "text-2xl font-bold text-foreground mb-2",
    headerSubtitle: "text-muted-foreground text-sm leading-relaxed",
    
    // Botões
    formButtonPrimary: "bg-imobipro-blue text-white hover:bg-imobipro-blue-dark rounded-lg h-11 px-6 py-2 font-medium transition-all duration-200 focus:ring-2 focus:ring-imobipro-blue focus:ring-offset-2",
    formButtonSecondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg h-11 px-6 py-2 font-medium transition-all duration-200",
    
    // Inputs
    formFieldInput: "flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-imobipro-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    formFieldLabel: "text-sm font-medium text-foreground mb-2",
    formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground transition-colors",
    
    // Links e navegação
    footerActionLink: "text-imobipro-blue hover:text-imobipro-blue-dark underline-offset-4 hover:underline font-medium transition-colors",
    footerActionText: "text-muted-foreground text-sm",
    footerActionLinkText: "text-imobipro-blue hover:text-imobipro-blue-dark font-medium",
    
    // Dividers
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-sm font-medium",
    
    // Botões sociais
    socialButtonsIconButton: "border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg h-11 px-4 transition-colors",
    socialButtonsBlockButton: "border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg h-11 px-4 transition-colors",
    
    // Identidade e perfil
    identityPreviewText: "text-foreground font-medium",
    identityPreviewEditButton: "text-imobipro-blue hover:text-imobipro-blue-dark font-medium",
    identityPreviewEditButtonIcon: "text-imobipro-blue hover:text-imobipro-blue-dark",
    
    // Avatar e menu de usuário
    userButtonAvatarBox: "w-10 h-10 ring-2 ring-imobipro-blue ring-offset-2 ring-offset-background",
    userButtonPopoverCard: "bg-popover text-popover-foreground border-border shadow-soft-lg rounded-xl",
    userButtonPopoverActionButton: "text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors",
    userButtonPopoverActionButtonIcon: "text-muted-foreground",
    
    // Badges e status
    badge: "bg-imobipro-blue text-white rounded-full px-2 py-1 text-xs font-medium",
    
    // Alertas e notificações
    alertText: "text-foreground text-sm",
    alertIcon: "text-imobipro-blue",
    
    // Formulário de verificação
    formResendCodeLink: "text-imobipro-blue hover:text-imobipro-blue-dark font-medium",
    
    // OTP Input
    otpCodeFieldInput: "w-12 h-12 rounded-lg border-2 border-input bg-background text-center text-lg font-bold text-foreground focus:border-imobipro-blue focus:outline-none transition-colors",
    
    // Loading states
    spinner: "text-imobipro-blue",
    spinnerIcon: "text-imobipro-blue",
    
    // Navbar (para UserProfile)
    navbarButton: "text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-2 font-medium transition-colors",
    navbarButtonIcon: "text-muted-foreground",
    
    // Seções de perfil
    profileSectionTitle: "text-lg font-semibold text-foreground mb-4",
    profileSectionContent: "text-muted-foreground text-sm leading-relaxed",
    
    // Accordion
    accordionTriggerButton: "text-foreground hover:bg-accent rounded-lg px-3 py-2 font-medium transition-colors",
    
    // Tabs
    tabButton: "text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-imobipro-blue font-medium transition-colors",
    tabButtonActive: "text-imobipro-blue border-imobipro-blue font-semibold",
    
    // Mensagens de erro
    formFieldErrorText: "text-destructive text-sm mt-1",
    formFieldWarningText: "text-warning text-sm mt-1",
    formFieldSuccessText: "text-success text-sm mt-1",
    
    // Loading overlay
    loadingOverlay: "bg-background/80 backdrop-blur-sm",
    
    // Modal
    modalContent: "bg-card text-card-foreground border-border rounded-xl shadow-soft-lg",
    modalCloseButton: "text-muted-foreground hover:text-foreground transition-colors",
  },
  variables: {
    // Cores principais
    colorPrimary: "hsl(220, 91%, 51%)", // imobipro-blue
    colorBackground: "hsl(var(--background))",
    colorText: "hsl(var(--foreground))",
    colorTextSecondary: "hsl(var(--muted-foreground))",
    
    // Estados
    colorDanger: "hsl(0, 84%, 60%)",
    colorSuccess: "hsl(142, 76%, 36%)",
    colorWarning: "hsl(38, 92%, 50%)",
    colorNeutral: "hsl(var(--muted))",
    
    // Inputs
    colorInputBackground: "hsl(var(--background))",
    colorInputText: "hsl(var(--foreground))",
    
    // Espaçamento e bordas
    spacingUnit: "1rem",
    borderRadius: "0.75rem",
    
    // Fontes
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    }
  },
  layout: {
    logoImageUrl: undefined,
    logoLinkUrl: "/dashboard",
    showOptionalFields: true,
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "bottom" as const,
    privacyPageUrl: "/privacy",
    termsPageUrl: "/terms",
    helpPageUrl: "/help",
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
