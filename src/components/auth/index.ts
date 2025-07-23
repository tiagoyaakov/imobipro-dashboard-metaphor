// -----------------------------------------------------------
// Exportações dos Componentes de Autenticação
// -----------------------------------------------------------

// Componentes de Formulário
export { LoginForm, LoginModalForm } from './LoginForm';
export { SignupForm, SignupSuccess } from './SignupForm';
export { 
  ForgotPasswordForm, 
  ForgotPasswordSuccess, 
  ResetPasswordForm 
} from './ForgotPasswordForm';

// Páginas de Autenticação
export { LoginPage } from '../../pages/auth/LoginPage';
export { SignupPage } from '../../pages/auth/SignupPage';
export { ForgotPasswordPage } from '../../pages/auth/ForgotPasswordPage';
export { UnauthorizedPage } from '../../pages/auth/UnauthorizedPage';

// Páginas de Perfil e Configurações
export { ProfilePage } from '../../pages/auth/ProfilePage';
export { SettingsPage } from '../../pages/auth/SettingsPage';

// Proteção de Rotas
export { 
  PrivateRoute, 
  PublicRoute, 
  AdminRoute, 
  DevMasterRoute, 
  AgentRoute,
  withAuthGuard,
  usePermissions 
} from './PrivateRoute';

// Guards e Controles
export { 
  AuthGuard,
  DevMasterOnly,
  AdminOrDevMaster,
  AuthenticatedOnly,
  FeatureGuard,
  useFeatureAccess,
} from './AuthGuard';

// Componentes de UI
export { 
  AuthLoadingSpinner,
  AuthInitializingSpinner,
  AuthVerifyingSpinner,
  AuthRedirectingSpinner 
} from './AuthLoadingSpinner';

export { 
  AuthErrorDisplay,
  AuthSessionExpired,
  AuthNetworkError,
  AuthPermissionDenied 
} from './AuthErrorDisplay';

// Tipos (re-exportados para conveniência)
export type { 
  LoginFormData, 
  SignupFormData, 
  ForgotPasswordData 
} from '../../schemas/auth'; 