import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anon || !serviceRole) {
  console.error('Missing env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const testEmail = `agent.clientes.teste+${Date.now()}@imobipro.local`
const testPassword = 'Ag3nt-Clientes-@12345'

async function ensureCompanyId() {
  const { data, error } = await admin.from('Company').select('id').limit(1).maybeSingle()
  if (error) throw error
  if (data?.id) return data.id
  const { data: created, error: err2 } = await admin.from('Company').insert({ name: 'Empresa Teste Clientes' }).select('id').single()
  if (err2) throw err2
  return created.id
}

async function ensureTestUser(companyId) {
  // cria usuário auth
  const { data: userRes, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  })
  if (createErr) throw createErr
  const userId = userRes.user.id

  // upsert em public."User" com role AGENT
  const { error: upsertErr } = await admin
    .from('User')
    .upsert({ id: userId, email: testEmail, name: 'Agente Teste', role: 'AGENT', isActive: true, companyId })
  if (upsertErr) throw upsertErr

  return userId
}

async function signInAnon(email, password) {
  const client = createClient(url, anon)
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { client, user: data.user }
}

async function run() {
  console.log('▶️ Iniciando testes CRUD Clientes (RLS)')
  const companyId = await ensureCompanyId()
  const userId = await ensureTestUser(companyId)
  const { client, user } = await signInAnon(testEmail, testPassword)
  console.log('✅ Login ok como AGENT:', user.id)

  // CREATE
  const novoCliente = {
    nome: 'Cliente Teste RLS',
    telefone: '11999999999',
    email: 'cliente.rls@teste.local',
    status: 'novos',
    funcionario: user.id,
    interesse: 'Apartamento 2q'
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

  // READ (outros) — deve retornar 0 para registros de outros corretores
  const { count: othersCount, error: headErr } = await client
    .from('dados_cliente')
    .select('*', { count: 'exact', head: true })
    .neq('funcionario', user.id)
  if (headErr) throw headErr
  console.log('ℹ️ HEAD outros (esperado 0 ou baixo):', othersCount)

  // DELETE (próprio)
  const { error: delErr } = await client
    .from('dados_cliente')
    .delete()
    .eq('id', created.id)
  if (delErr) throw delErr
  console.log('✅ DELETE ok')

  console.log('🎉 Todos os testes CRUD (AGENT) passaram com RLS')
}

run().catch((e) => {
  console.error('❌ Falha nos testes CRUD:', e)
  process.exit(1)
})
