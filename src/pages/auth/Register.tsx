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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            ImobiPRO
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de gestão imobiliária
          </p>
        </div>

        {/* Formulário de registro */}
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register; 