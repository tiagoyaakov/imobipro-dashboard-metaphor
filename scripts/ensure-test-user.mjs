import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anon = process.env.VITE_SUPABASE_ANON_KEY
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'tiago.ykv@gmail.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Danix123'

if (!url || !anon || !serviceRole) {
  console.error('Missing envs VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
const client = createClient(url, anon)

async function ensureCompanyId() {
  const { data, error } = await admin.from('Company').select('id').limit(1).maybeSingle()
  if (error) throw error
  if (data?.id) return data.id
  const { data: created, error: err2 } = await admin.from('Company').insert({ name: 'Empresa Teste Clientes' }).select('id').single()
  if (err2) throw err2
  return created.id
}

async function getAuthUserId() {
  const { data, error } = await client.auth.signInWithPassword({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD })
  if (error) throw error
  return data.user.id
}

async function upsertPublicUser(userId, companyId) {
  const { error } = await admin
    .from('User')
    .upsert({ id: userId, email: TEST_USER_EMAIL, name: 'Agente Teste', role: 'AGENT', isActive: true, companyId })
  if (error) throw error
}

async function run() {
  console.log('▶️ Garantindo public."User" para usuário de teste')
  const companyId = await ensureCompanyId()
  const userId = await getAuthUserId()
  await upsertPublicUser(userId, companyId)
  console.log('✅ public."User" ok para', TEST_USER_EMAIL)
}

run().catch((e) => { console.error('❌ Falha ao garantir public.User:', e); process.exit(1) })
