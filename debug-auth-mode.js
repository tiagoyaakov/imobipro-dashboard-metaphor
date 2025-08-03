// Script para debug do modo de autenticação
// Execute no console do navegador quando estiver logado

console.log('🔍 DEBUG: Analisando modo de autenticação...');

// 1. Verificar variáveis de ambiente
console.log('📋 Variáveis de ambiente:', {
  PROD: import.meta.env.PROD,
  VITE_USE_REAL_AUTH: import.meta.env.VITE_USE_REAL_AUTH,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Configurada' : 'Não configurada',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'
});

// 2. Verificar configuração de auth
try {
  const authConfig = await import('./src/config/auth.ts');
  console.log('⚙️ Configuração de auth:', {
    useRealAuth: authConfig.authConfig.useRealAuth,
    authMode: authConfig.getAuthMode()
  });
} catch (error) {
  console.error('❌ Erro ao carregar config de auth:', error);
}

// 3. Verificar contexto de autenticação atual
console.log('👤 Dados do usuário atual (window.location):', window.location.href);

// 4. Verificar localStorage para dados de sessão
const supabaseSession = localStorage.getItem('supabase.auth.token');
console.log('💾 Sessão no localStorage:', supabaseSession ? 'Existe' : 'Não existe');

// 5. Instruções para debug adicional
console.log(`
🔧 PRÓXIMOS PASSOS PARA DEBUG:

1. Abra o DevTools
2. Vá para Application > Local Storage
3. Procure por chaves relacionadas ao Supabase
4. Vá para Network e procure por chamadas para o Supabase
5. Verifique se há erros no console relacionados à autenticação

🎯 PROBLEMA SUSPEITADO:
- Sistema pode estar usando modo mock em vez de real
- Ou há fallback incorreto no AuthContext
- Ou há cache/dados antigos interferindo
`);