import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a23] relative overflow-hidden">
      {/* Shapes/efeitos de fundo */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-tr from-blue-700/40 via-indigo-500/30 to-cyan-400/20 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-cyan-500/30 via-blue-800/20 to-indigo-700/30 rounded-full blur-2xl opacity-50 animate-blob" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-tl from-white/10 to-blue-400/10 rounded-full blur-2xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md p-8 bg-background/80 rounded-2xl shadow-2xl border border-border backdrop-blur-xl">
        <SignIn
          appearance={{
            elements: {
              card: 'shadow-none bg-background/90 border border-border rounded-xl',
              headerTitle: 'text-2xl font-bold text-foreground',
              headerSubtitle: 'text-base text-muted-foreground',
              formButtonPrimary: 'bg-imobipro-blue hover:bg-imobipro-blue/90 text-white font-semibold',
              socialButtonsBlockButton: 'bg-muted text-foreground border border-border',
              dividerText: 'text-muted-foreground',
              footerAction: 'text-sm text-muted-foreground',
            },
            variables: {
              colorPrimary: '#2563eb',
              colorText: '#fff',
              colorBackground: '#18181b',
            }
          }}
          routing="path"
          path="/login"
        />
      </div>
    </div>
  );
} 