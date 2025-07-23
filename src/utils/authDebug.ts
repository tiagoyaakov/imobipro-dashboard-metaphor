// =============================================================
// Utilitário de Debug para Problemas de Autenticação
// =============================================================

import { supabase } from '@/integrations/supabase/client';

/**
 * Debug completo do estado de autenticação
 */
export const debugAuthState = async () => {
  console.log('🔍 [AUTH DEBUG] Iniciando diagnóstico completo...');
  
  try {
    // 1. Verificar sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log('📱 [AUTH DEBUG] Sessão:', {
      hasSession: !!sessionData.session,
      user: sessionData.session?.user ? {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
        emailVerified: sessionData.session.user.email_confirmed_at,
        role: sessionData.session.user.user_metadata?.role,
        lastSignIn: sessionData.session.user.last_sign_in_at,
      } : null,
      sessionError,
      accessToken: sessionData.session?.access_token ? 'PRESENTE' : 'AUSENTE',
      refreshToken: sessionData.session?.refresh_token ? 'PRESENTE' : 'AUSENTE',
      expiresAt: sessionData.session?.expires_at,
    });

    // 2. Verificar usuário atual
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    console.log('👤 [AUTH DEBUG] Usuário atual:', {
      hasUser: !!userData.user,
      user: userData.user ? {
        id: userData.user.id,
        email: userData.user.email,
        emailVerified: userData.user.email_confirmed_at,
        userMetadata: userData.user.user_metadata,
        appMetadata: userData.user.app_metadata,
        createdAt: userData.user.created_at,
        updatedAt: userData.user.updated_at,
      } : null,
      userError,
    });

    // 3. Tentar buscar dados customizados se há usuário
    if (userData.user) {
      try {
        const { data: customData, error: customError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            name,
            role,
            is_active,
            company_id,
            avatar_url,
            created_at,
            updated_at
          `)
          .eq('id', userData.user.id)
          .single();

        console.log('📊 [AUTH DEBUG] Dados customizados:', {
          hasCustomData: !!customData,
          customData,
          customError,
          queryUserId: userData.user.id,
        });

        // 4. Testar join com companies se dados customizados funcionam
        if (customData) {
          const { data: joinData, error: joinError } = await supabase
            .from('users')
            .select(`
              id,
              email,
              name,
              role,
              is_active,
              company_id,
              avatar_url,
              company:companies(id, name),
              created_at,
              updated_at
            `)
            .eq('id', userData.user.id)
            .single();

          console.log('🏢 [AUTH DEBUG] Join com companies:', {
            hasJoinData: !!joinData,
            joinData,
            joinError,
          });
        }

      } catch (customErr) {
        console.error('❌ [AUTH DEBUG] Erro ao buscar dados customizados:', customErr);
      }
    }

    // 5. Verificar localStorage
    const localStorageAuth = localStorage.getItem('supabase.auth.token');
    const sessionStorageAuth = sessionStorage.getItem('supabase.auth.token');
    
    console.log('💾 [AUTH DEBUG] Storage:', {
      localStorage: localStorageAuth ? 'PRESENTE' : 'AUSENTE',
      sessionStorage: sessionStorageAuth ? 'PRESENTE' : 'AUSENTE',
      localStorageKeys: Object.keys(localStorage).filter(key => key.includes('supabase')),
      sessionStorageKeys: Object.keys(sessionStorage).filter(key => key.includes('supabase')),
    });

    // 6. Verificar configuração do cliente
    console.log('⚙️ [AUTH DEBUG] Configuração cliente:', {
      supabaseUrl: supabase.supabaseUrl,
      supabaseKey: supabase.supabaseKey ? 'PRESENTE' : 'AUSENTE',
    });

    return {
      success: true,
      session: sessionData.session,
      user: userData.user,
    };

  } catch (error) {
    console.error('💥 [AUTH DEBUG] Erro no diagnóstico:', error);
    return {
      success: false,
      error,
    };
  }
};

/**
 * Limpar completamente o estado de autenticação
 */
export const clearAuthState = async () => {
  console.log('🧹 [AUTH DEBUG] Limpando estado de autenticação...');
  
  try {
    // 1. Fazer logout no Supabase
    await supabase.auth.signOut();
    
    // 2. Limpar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // 3. Limpar sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ [AUTH DEBUG] Estado limpo com sucesso');
    
    // 4. Recarregar página
    window.location.reload();
    
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Erro ao limpar estado:', error);
  }
};

/**
 * Adicionar função de debug ao objeto window (apenas em desenvolvimento)
 */
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugAuth = debugAuthState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).clearAuth = clearAuthState;
  
  console.log('🛠️ [AUTH DEBUG] Funções disponíveis no console:');
  console.log('  - debugAuth() // Diagnóstico completo');
  console.log('  - clearAuth() // Limpar estado e recarregar');
} 