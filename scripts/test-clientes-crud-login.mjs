import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'tiago.ykv@gmail.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Danix123'

async function run() {
  console.log('▶️ Iniciando testes CRUD Clientes (RLS) via login do usuário de teste')
  const client = createClient(url, anon)

  // login
  const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  })
  if (loginErr) throw loginErr
  console.log('✅ Login ok como', TEST_USER_EMAIL)

  const user = loginData.user

  // CREATE
  const novoCliente = {
    nome: 'Cliente Teste RLS (login) ',
    telefone: '11999998888',
    email: 'cliente.rls.login@teste.local',
    status: 'novos',
    funcionario: user.id,
    interesse: 'Casa 3q'
  }
  const { data: created, error: createErr } = await client
    .from('dados_cliente')
    .insert(novoCliente)
    .select('*')
    .single()
  if (createErr) throw createErr
  console.log('✅ CREATE ok:', created.id)

  // READ (próprio)
  const { data: readOwn, error: readErr } = await client
    .from('dados_cliente')
    .select('*')
    .eq('id', created.id)
    .maybeSingle()
  if (readErr) throw readErr
  if (!readOwn) throw new Error('Falha ao ler cliente recém-criado')
  console.log('✅ READ próprio ok')

  // UPDATE (próprio)
  const { data: updated, error: updErr } = await client
    .from('dados_cliente')
    .update({ status: 'qualificados' })
    .eq('id', created.id)
    .select('*')
    .single()
  if (updErr) throw updErr
  if (updated.status !== 'qualificados') throw new Error('Falha ao atualizar status')
  console.log('✅ UPDATE ok (status=qualificados)')

  // DELETE (próprio)
  const { error: delErr } = await client
    .from('dados_cliente')
    .delete()
    .eq('id', created.id)
  if (delErr) throw delErr
  console.log('✅ DELETE ok')

  console.log('🎉 Todos os testes CRUD (AGENT via login) passaram com RLS')
}

run().catch((e) => {
  console.error('❌ Falha nos testes CRUD (login):', e)
  process.exit(1)
})
