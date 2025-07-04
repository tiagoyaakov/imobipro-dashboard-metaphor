import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';

// -----------------------------------------------------------
// Página de registro
// -----------------------------------------------------------

const Register: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Redireciona se já estiver autenticado
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Mostra loading se ainda está inicializando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Container principal */}
      <div className="relative max-w-md w-full space-y-8">
        {/* Logo e branding */}
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              ImobiPRO
            </h1>
            <p className="mt-3 text-base text-slate-400">
              Sistema de gestão imobiliária
            </p>
          </div>
        </div>

        {/* Formulário de registro */}
        <div className="backdrop-blur-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register; 