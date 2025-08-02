#!/usr/bin/env node
/**
 * Script para aplicar a migration de RLS completa
 * Executa o arquivo SQL com as políticas de segurança
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Carregar variáveis de ambiente
config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
  process.exit(1)
}

// Cliente admin (sem RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function checkExistingPolicies() {
  log('\n🔍 Verificando políticas existentes...', 'yellow')
  
  try {
    // Query para buscar políticas RLS existentes
    const { data, error } = await supabaseAdmin.rpc('get_policies_info', {})
    
    if (error) {
      // Se a função não existir, criar ela
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION get_policies_info()
          RETURNS TABLE (
            schemaname text,
            tablename text,
            policyname text,
            cmd text
          )
          LANGUAGE sql
          SECURITY DEFINER
          AS $$
            SELECT 
              schemaname,
              tablename,
              policyname,
              cmd::text
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
          $$;
        `
      })
      
      // Tentar novamente
      const retry = await supabaseAdmin.rpc('get_policies_info', {})
      return retry.data || []
    }
    
    return data || []
  } catch (error) {
    log('⚠️  Não foi possível verificar políticas existentes', 'yellow')
    return []
  }
}

async function executeSQLFile(filePath: string) {
  log(`\n📄 Lendo arquivo SQL: ${filePath}`, 'cyan')
  
  try {
    const sqlContent = readFileSync(filePath, 'utf-8')
    
    // Dividir o SQL em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    log(`📊 ${commands.length} comandos SQL encontrados`, 'blue')
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';'
      
      // Pular comentários de bloco
      if (command.includes('====')) continue
      
      // Extrair nome do comando para log
      const commandType = command.match(/^(CREATE|ALTER|DROP|GRANT|INSERT|UPDATE|DELETE)/i)?.[1] || 'SQL'
      const targetMatch = command.match(/(FUNCTION|POLICY|TABLE|INDEX|TRIGGER)\s+"?(\w+)"?/i)
      const target = targetMatch ? `${targetMatch[1]} ${targetMatch[2]}` : ''
      
      process.stdout.write(`\r⏳ Executando comando ${i + 1}/${commands.length}: ${commandType} ${target}...`)
      
      try {
        // Usar RPC para executar SQL diretamente
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: command })
        
        if (error) {
          // Se exec_sql não existir, criar
          if (error.message.includes('could not find')) {
            await supabaseAdmin.rpc('query', { query: `
              CREATE OR REPLACE FUNCTION exec_sql(sql text)
              RETURNS void
              LANGUAGE plpgsql
              SECURITY DEFINER
              AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$;
            ` })
            
            // Tentar novamente
            const retry = await supabaseAdmin.rpc('exec_sql', { sql: command })
            if (retry.error) throw retry.error
          } else {
            throw error
          }
        }
        
        successCount++
      } catch (error: any) {
        errorCount++
        console.log('') // Nova linha
        log(`❌ Erro no comando ${i + 1}: ${error.message}`, 'red')
        
        // Continuar com próximo comando em caso de erro não crítico
        if (!error.message.includes('already exists') && 
            !error.message.includes('does not exist')) {
          // Erros críticos param a execução
          throw error
        }
      }
    }
    
    console.log('') // Nova linha
    log(`\n✅ Execução concluída: ${successCount} sucessos, ${errorCount} erros`, 'green')
    
  } catch (error) {
    log(`\n❌ Erro ao executar SQL: ${error}`, 'red')
    throw error
  }
}

async function verifyRLSEnabled() {
  log('\n🔒 Verificando se RLS está habilitado nas tabelas...', 'yellow')
  
  const tables = [
    'Company', 'User', 'Property', 'Contact', 
    'Appointment', 'Deal', 'Activity', 'Chat', 'Message'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.rpc('check_rls_enabled', { 
        table_name: table 
      })
      
      if (error) {
        // Criar função se não existir
        await supabaseAdmin.rpc('exec_sql', {
          sql: `
            CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
            RETURNS boolean
            LANGUAGE sql
            SECURITY DEFINER
            AS $$
              SELECT relrowsecurity 
              FROM pg_class 
              WHERE relname = table_name 
              AND relnamespace = 'public'::regnamespace;
            $$;
          `
        })
        
        // Tentar novamente
        const retry = await supabaseAdmin.rpc('check_rls_enabled', { 
          table_name: table 
        })
        
        const enabled = retry.data
        log(`${enabled ? '✅' : '❌'} ${table}: RLS ${enabled ? 'habilitado' : 'desabilitado'}`, enabled ? 'green' : 'red')
      } else {
        const enabled = data
        log(`${enabled ? '✅' : '❌'} ${table}: RLS ${enabled ? 'habilitado' : 'desabilitado'}`, enabled ? 'green' : 'red')
      }
    } catch (error) {
      log(`⚠️  ${table}: Não foi possível verificar`, 'yellow')
    }
  }
}

async function listPoliciesPerTable() {
  log('\n📋 Políticas RLS por tabela:', 'cyan')
  
  try {
    const policies = await checkExistingPolicies()
    
    const tableGroups = policies.reduce((acc: any, policy: any) => {
      if (!acc[policy.tablename]) {
        acc[policy.tablename] = []
      }
      acc[policy.tablename].push({
        name: policy.policyname,
        cmd: policy.cmd
      })
      return acc
    }, {})
    
    Object.entries(tableGroups).forEach(([table, policies]: [string, any]) => {
      log(`\n📁 ${table}:`, 'blue')
      policies.forEach((policy: any) => {
        log(`  - ${policy.name} (${policy.cmd})`, 'reset')
      })
    })
    
    const totalPolicies = Object.values(tableGroups).reduce((sum: number, policies: any) => sum + policies.length, 0)
    log(`\n📊 Total: ${totalPolicies} políticas em ${Object.keys(tableGroups).length} tabelas`, 'green')
    
  } catch (error) {
    log('⚠️  Não foi possível listar políticas', 'yellow')
  }
}

// Executar migration
async function main() {
  log('🚀 Aplicando migration de RLS completa...', 'bright')
  
  try {
    // Verificar políticas existentes
    await checkExistingPolicies()
    
    // Executar arquivo SQL
    const migrationPath = resolve(__dirname, '../supabase/migrations/20250801_complete_rls_policies.sql')
    await executeSQLFile(migrationPath)
    
    // Verificar se RLS está habilitado
    await verifyRLSEnabled()
    
    // Listar políticas criadas
    await listPoliciesPerTable()
    
    log('\n✅ Migration aplicada com sucesso!', 'green')
    log('\n💡 Execute npm run test:rls para testar as políticas', 'yellow')
    
  } catch (error) {
    log(`\n❌ Erro ao aplicar migration: ${error}`, 'red')
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

export { main as applyRLSMigration }