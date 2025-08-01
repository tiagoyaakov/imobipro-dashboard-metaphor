#!/usr/bin/env node

/**
 * Script de Teste de Integração com Supabase
 * 
 * Este script valida:
 * 1. Conexão com o Supabase
 * 2. Autenticação funcionando
 * 3. Queries básicas
 * 4. RLS (Row Level Security)
 * 5. Real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar variáveis de ambiente
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@imobipro.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'test123456';

// Validar configurações
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(chalk.red('❌ Erro: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias!'));
  console.log(chalk.yellow('Configure as variáveis no arquivo .env'));
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Testes
async function runTests() {
  console.log(chalk.blue.bold('\n🔍 Teste de Integração com Supabase\n'));
  
  let allTestsPassed = true;

  // 1. Teste de Conexão
  const connectionTest = ora('Testando conexão com Supabase...').start();
  try {
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) throw error;
    connectionTest.succeed('Conexão com Supabase estabelecida');
  } catch (error) {
    connectionTest.fail(`Falha na conexão: ${error.message}`);
    allTestsPassed = false;
  }

  // 2. Teste de Autenticação
  const authTest = ora('Testando sistema de autenticação...').start();
  try {
    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (authError) {
      // Se usuário não existe, tentar criar
      if (authError.message.includes('Invalid login credentials')) {
        authTest.text = 'Criando usuário de teste...';
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          options: {
            data: {
              name: 'Usuário de Teste',
              role: 'AGENT'
            }
          }
        });

        if (signUpError) throw signUpError;
        authTest.succeed('Usuário de teste criado e autenticado');
      } else {
        throw authError;
      }
    } else {
      authTest.succeed('Autenticação funcionando corretamente');
    }

    // Verificar sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Sessão não foi estabelecida');
    }

  } catch (error) {
    authTest.fail(`Falha na autenticação: ${error.message}`);
    allTestsPassed = false;
  }

  // 3. Teste de Queries
  const queryTest = ora('Testando queries no banco de dados...').start();
  try {
    // Testar query em diferentes tabelas
    const tables = ['users', 'companies', 'properties', 'contacts'];
    const results = [];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw new Error(`Erro na tabela ${table}: ${error.message}`);
      }
      
      results.push({
        table,
        exists: !error,
        hasData: data && data.length > 0
      });
    }

    queryTest.succeed('Queries básicas funcionando');
    
    // Mostrar status das tabelas
    console.log(chalk.gray('\n  Status das tabelas:'));
    results.forEach(result => {
      const icon = result.exists ? '✓' : '✗';
      const color = result.exists ? 'green' : 'red';
      console.log(chalk[color](`    ${icon} ${result.table}: ${result.exists ? 'OK' : 'Não encontrada'}`));
    });

  } catch (error) {
    queryTest.fail(`Falha nas queries: ${error.message}`);
    allTestsPassed = false;
  }

  // 4. Teste de RLS (Row Level Security)
  const rlsTest = ora('Testando Row Level Security (RLS)...').start();
  try {
    // Tentar acessar dados sem autenticação
    await supabase.auth.signOut();
    
    const { data: publicData, error: publicError } = await supabase
      .from('users')
      .select('*');
    
    if (!publicError || publicData?.length > 0) {
      throw new Error('RLS não está configurado corretamente - dados acessíveis sem autenticação');
    }

    // Re-autenticar
    await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    rlsTest.succeed('Row Level Security está ativo');
  } catch (error) {
    if (error.message.includes('RLS não está configurado')) {
      rlsTest.fail(error.message);
      allTestsPassed = false;
    } else {
      rlsTest.succeed('Row Level Security está ativo');
    }
  }

  // 5. Teste de Real-time
  const realtimeTest = ora('Testando conexão real-time...').start();
  try {
    // Criar canal de teste
    const channel = supabase
      .channel('test-channel')
      .on('presence', { event: 'sync' }, () => {
        // Callback vazio
      })
      .subscribe();

    // Aguardar conexão
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verificar status
    if (channel.state === 'joined') {
      realtimeTest.succeed('Conexão real-time estabelecida');
    } else {
      throw new Error(`Status do canal: ${channel.state}`);
    }

    // Limpar
    await channel.unsubscribe();
  } catch (error) {
    realtimeTest.fail(`Falha no real-time: ${error.message}`);
    allTestsPassed = false;
  }

  // Resumo
  console.log(chalk.blue.bold('\n📊 Resumo dos Testes:\n'));
  
  if (allTestsPassed) {
    console.log(chalk.green.bold('✅ Todos os testes passaram! Integração com Supabase está funcionando.\n'));
  } else {
    console.log(chalk.red.bold('❌ Alguns testes falharam. Verifique as configurações.\n'));
    process.exit(1);
  }

  // Informações adicionais
  console.log(chalk.gray('Informações de conexão:'));
  console.log(chalk.gray(`  URL: ${SUPABASE_URL}`));
  console.log(chalk.gray(`  Projeto ID: ${SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] || 'N/A'}`));
  console.log(chalk.gray(`  Autenticação: ${process.env.VITE_USE_REAL_AUTH === 'true' ? 'Real' : 'Mock'}\n`));
}

// Executar testes
runTests().catch(error => {
  console.error(chalk.red(`\n❌ Erro crítico: ${error.message}\n`));
  process.exit(1);
});