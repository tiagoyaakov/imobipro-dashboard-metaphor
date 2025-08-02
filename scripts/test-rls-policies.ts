#!/usr/bin/env node
/**
 * Script para testar as políticas RLS implementadas
 * Verifica se o isolamento entre empresas e a hierarquia de permissões estão funcionando
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

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
  }
})

// Dados de teste
const testData = {
  companies: [
    { id: 'company-1', name: 'Imobiliária Alfa', active: true },
    { id: 'company-2', name: 'Imobiliária Beta', active: true }
  ],
  users: [
    // Company 1
    { id: 'creator-1', email: 'creator@imobipro.com', name: 'Creator User', role: 'CREATOR', companyId: 'company-1', password: 'Test123!@#' },
    { id: 'admin-1', email: 'admin1@imobipro.com', name: 'Admin Company 1', role: 'ADMIN', companyId: 'company-1', password: 'Test123!@#' },
    { id: 'agent-1a', email: 'agent1a@imobipro.com', name: 'Agent 1A', role: 'AGENT', companyId: 'company-1', password: 'Test123!@#' },
    { id: 'agent-1b', email: 'agent1b@imobipro.com', name: 'Agent 1B', role: 'AGENT', companyId: 'company-1', password: 'Test123!@#' },
    // Company 2
    { id: 'admin-2', email: 'admin2@imobipro.com', name: 'Admin Company 2', role: 'ADMIN', companyId: 'company-2', password: 'Test123!@#' },
    { id: 'agent-2a', email: 'agent2a@imobipro.com', name: 'Agent 2A', role: 'AGENT', companyId: 'company-2', password: 'Test123!@#' },
  ],
  properties: [
    // Company 1 properties
    { id: 'prop-1a', title: 'Casa Company 1 - Agent 1A', agentId: 'agent-1a', price: 500000 },
    { id: 'prop-1b', title: 'Apto Company 1 - Agent 1B', agentId: 'agent-1b', price: 300000 },
    // Company 2 properties
    { id: 'prop-2a', title: 'Casa Company 2 - Agent 2A', agentId: 'agent-2a', price: 700000 },
  ],
  contacts: [
    // Company 1 contacts
    { id: 'contact-1a', name: 'João Silva', agentId: 'agent-1a', email: 'joao@email.com' },
    { id: 'contact-1b', name: 'Maria Santos', agentId: 'agent-1b', email: 'maria@email.com' },
    // Company 2 contacts
    { id: 'contact-2a', name: 'Pedro Oliveira', agentId: 'agent-2a', email: 'pedro@email.com' },
  ]
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function cleanupTestData() {
  log('\n🧹 Limpando dados de teste anteriores...', 'yellow')
  
  try {
    // Deletar na ordem correta (respeitando foreign keys)
    await supabaseAdmin.from('Contact').delete().in('id', testData.contacts.map(c => c.id))
    await supabaseAdmin.from('Property').delete().in('id', testData.properties.map(p => p.id))
    await supabaseAdmin.from('User').delete().in('id', testData.users.map(u => u.id))
    await supabaseAdmin.from('Company').delete().in('id', testData.companies.map(c => c.id))
    
    log('✅ Dados de teste limpos', 'green')
  } catch (error) {
    log(`❌ Erro ao limpar dados: ${error}`, 'red')
  }
}

async function setupTestData() {
  log('\n📦 Configurando dados de teste...', 'yellow')
  
  try {
    // Criar empresas
    const { error: companyError } = await supabaseAdmin
      .from('Company')
      .insert(testData.companies)
    
    if (companyError) throw companyError
    
    // Criar usuários no Auth
    for (const user of testData.users) {
      const { error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role,
          companyId: user.companyId
        }
      })
      
      if (authError && !authError.message.includes('already been registered')) {
        throw authError
      }
    }
    
    // Criar usuários no banco
    const { error: userError } = await supabaseAdmin
      .from('User')
      .upsert(testData.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        companyId: u.companyId,
        isActive: true
      })))
    
    if (userError) throw userError
    
    // Criar propriedades
    const { error: propError } = await supabaseAdmin
      .from('Property')
      .insert(testData.properties.map(p => ({
        ...p,
        description: `Descrição ${p.title}`,
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        area: 100,
        bedrooms: 3,
        bathrooms: 2,
        type: 'HOUSE',
        status: 'AVAILABLE'
      })))
    
    if (propError) throw propError
    
    // Criar contatos
    const { error: contactError } = await supabaseAdmin
      .from('Contact')
      .insert(testData.contacts.map(c => ({
        ...c,
        phone: '11999999999',
        category: 'CLIENT',
        status: 'ACTIVE'
      })))
    
    if (contactError) throw contactError
    
    log('✅ Dados de teste configurados', 'green')
  } catch (error) {
    log(`❌ Erro ao configurar dados: ${error}`, 'red')
    throw error
  }
}

async function createUserClient(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  return createClient(supabaseUrl, data.session!.access_token, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function runTest(testName: string, testFn: () => Promise<void>) {
  try {
    await testFn()
    log(`✅ ${testName}`, 'green')
  } catch (error) {
    log(`❌ ${testName}: ${error}`, 'red')
  }
}

async function runRLSTests() {
  log('\n🧪 Executando testes RLS...', 'cyan')
  
  // Teste 1: CREATOR vê tudo
  await runTest('CREATOR vê todas as empresas', async () => {
    const client = await createUserClient('creator@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Company').select('*')
    if (error) throw error
    if (data.length !== 2) throw new Error(`Esperado 2 empresas, encontrado ${data.length}`)
  })
  
  await runTest('CREATOR vê todos os usuários', async () => {
    const client = await createUserClient('creator@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('User').select('*')
    if (error) throw error
    if (data.length !== 6) throw new Error(`Esperado 6 usuários, encontrado ${data.length}`)
  })
  
  await runTest('CREATOR vê todas as propriedades', async () => {
    const client = await createUserClient('creator@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Property').select('*')
    if (error) throw error
    if (data.length !== 3) throw new Error(`Esperado 3 propriedades, encontrado ${data.length}`)
  })
  
  // Teste 2: ADMIN vê apenas sua empresa
  await runTest('ADMIN vê apenas sua empresa', async () => {
    const client = await createUserClient('admin1@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Company').select('*')
    if (error) throw error
    if (data.length !== 1) throw new Error(`Esperado 1 empresa, encontrado ${data.length}`)
    if (data[0].id !== 'company-1') throw new Error('ADMIN viu empresa errada')
  })
  
  await runTest('ADMIN vê apenas usuários da sua empresa', async () => {
    const client = await createUserClient('admin1@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('User').select('*')
    if (error) throw error
    if (data.length !== 4) throw new Error(`Esperado 4 usuários da empresa 1, encontrado ${data.length}`)
  })
  
  await runTest('ADMIN vê todas as propriedades da sua empresa', async () => {
    const client = await createUserClient('admin1@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Property').select('*')
    if (error) throw error
    if (data.length !== 2) throw new Error(`Esperado 2 propriedades da empresa 1, encontrado ${data.length}`)
  })
  
  await runTest('ADMIN vê todos os contatos da sua empresa', async () => {
    const client = await createUserClient('admin1@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Contact').select('*')
    if (error) throw error
    if (data.length !== 2) throw new Error(`Esperado 2 contatos da empresa 1, encontrado ${data.length}`)
  })
  
  // Teste 3: AGENT vê apenas seus dados
  await runTest('AGENT vê apenas suas propriedades', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Property').select('*')
    if (error) throw error
    if (data.length !== 1) throw new Error(`Esperado 1 propriedade do agent1a, encontrado ${data.length}`)
    if (data[0].agentId !== 'agent-1a') throw new Error('AGENT viu propriedade de outro agente')
  })
  
  await runTest('AGENT vê apenas seus contatos', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { data, error } = await client.from('Contact').select('*')
    if (error) throw error
    if (data.length !== 1) throw new Error(`Esperado 1 contato do agent1a, encontrado ${data.length}`)
    if (data[0].agentId !== 'agent-1a') throw new Error('AGENT viu contato de outro agente')
  })
  
  // Teste 4: Isolamento entre empresas
  await runTest('ADMIN da empresa 2 não vê dados da empresa 1', async () => {
    const client = await createUserClient('admin2@imobipro.com', 'Test123!@#')
    const { data: properties } = await client.from('Property').select('*')
    const { data: contacts } = await client.from('Contact').select('*')
    
    // Deve ver apenas propriedades da empresa 2
    if (properties.length !== 1) throw new Error(`Esperado 1 propriedade, encontrado ${properties.length}`)
    if (properties[0].agentId !== 'agent-2a') throw new Error('Viu propriedade de outra empresa')
    
    // Deve ver apenas contatos da empresa 2
    if (contacts.length !== 1) throw new Error(`Esperado 1 contato, encontrado ${contacts.length}`)
    if (contacts[0].agentId !== 'agent-2a') throw new Error('Viu contato de outra empresa')
  })
  
  // Teste 5: Permissões de escrita
  await runTest('AGENT pode criar propriedade para si mesmo', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { error } = await client.from('Property').insert({
      id: 'prop-test-1',
      title: 'Nova Casa Test',
      agentId: 'agent-1a',
      price: 600000,
      description: 'Test',
      address: 'Rua Test',
      city: 'SP',
      state: 'SP',
      zipCode: '12345-678',
      area: 150
    })
    if (error) throw error
  })
  
  await runTest('AGENT não pode criar propriedade para outro agente', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { error } = await client.from('Property').insert({
      id: 'prop-test-2',
      title: 'Casa Outro Agente',
      agentId: 'agent-1b', // Tentando criar para outro agente
      price: 700000,
      description: 'Test',
      address: 'Rua Test',
      city: 'SP',
      state: 'SP',
      zipCode: '12345-678',
      area: 200
    })
    if (!error) throw new Error('AGENT conseguiu criar propriedade para outro agente')
  })
  
  await runTest('AGENT pode atualizar sua própria propriedade', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { error } = await client
      .from('Property')
      .update({ price: 550000 })
      .eq('id', 'prop-1a')
    if (error) throw error
  })
  
  await runTest('AGENT não pode atualizar propriedade de outro agente', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { error } = await client
      .from('Property')
      .update({ price: 350000 })
      .eq('id', 'prop-1b')
    if (!error) throw new Error('AGENT conseguiu atualizar propriedade de outro agente')
  })
  
  await runTest('AGENT não pode deletar propriedades', async () => {
    const client = await createUserClient('agent1a@imobipro.com', 'Test123!@#')
    const { error } = await client
      .from('Property')
      .delete()
      .eq('id', 'prop-1a')
    if (!error) throw new Error('AGENT conseguiu deletar propriedade')
  })
  
  await runTest('ADMIN pode deletar propriedades da sua empresa', async () => {
    const client = await createUserClient('admin1@imobipro.com', 'Test123!@#')
    const { error } = await client
      .from('Property')
      .delete()
      .eq('id', 'prop-test-1')
    if (error) throw error
  })
  
  log('\n📊 Resumo dos testes RLS', 'cyan')
}

// Executar testes
async function main() {
  log('🚀 Iniciando testes de RLS...', 'bright')
  
  try {
    await cleanupTestData()
    await setupTestData()
    await runRLSTests()
    
    log('\n✅ Testes concluídos!', 'green')
  } catch (error) {
    log(`\n❌ Erro fatal: ${error}`, 'red')
    process.exit(1)
  } finally {
    await cleanupTestData()
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
}

export { main as testRLS }