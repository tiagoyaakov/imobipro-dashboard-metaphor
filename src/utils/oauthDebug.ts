// Utilitário de debug para OAuth Google Calendar
export const debugOAuth = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const currentUrl = window.location.href;
  
  console.group('🔍 OAuth Debug Information');
  console.log('Current URL:', currentUrl);
  console.log('Search Params:', window.location.search);
  console.log('Has code param:', urlParams.has('code'));
  console.log('Has error param:', urlParams.has('error'));
  console.log('Code value:', urlParams.get('code'));
  console.log('Error value:', urlParams.get('error'));
  console.log('State value:', urlParams.get('state'));
  console.log('Session auth_started:', sessionStorage.getItem('google_auth_started'));
  console.log('localStorage tokens:', localStorage.getItem('google_calendar_tokens'));
  
  // Variáveis de ambiente
  console.log('Environment variables:');
  console.log('- VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log('- VITE_GOOGLE_REDIRECT_URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
  
  console.groupEnd();
  
  return {
    hasOAuthParams: urlParams.has('code') || urlParams.has('error'),
    code: urlParams.get('code'),
    error: urlParams.get('error'),
    currentUrl
  };
};

// Força verificação de callback OAuth em qualquer página
export const forceOAuthCheck = () => {
  const debug = debugOAuth();
  
  if (debug.hasOAuthParams) {
    console.log('🔄 OAuth parameters detected, processing...');
    
    if (debug.error) {
      console.error('❌ OAuth Error:', debug.error);
      return { success: false, error: debug.error };
    }
    
    if (debug.code) {
      console.log('✅ OAuth Code received:', debug.code.substring(0, 20) + '...');
      return { success: true, code: debug.code };
    }
  }
  
  return { success: false, error: 'No OAuth parameters found' };
};