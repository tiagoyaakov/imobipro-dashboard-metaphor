import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRole) {
  console.error('Faltam envs: VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })

const args = process.argv.slice(2)

let targetEmail = 'n8nlabz@gmail.com'
let newPassword = 'teste123.'
let targetUserId = null

if (args[0] === '--id') {
  // Uso: node change-user-password.mjs --id <userId> <newPassword>
  targetUserId = args[1]
  newPassword = args[2] || newPassword
} else {
  // Uso: node change-user-password.mjs <email> <newPassword>
  targetEmail = args[0] || targetEmail
  newPassword = args[1] || newPassword
}

async function findAuthUserIdByEmail(email) {
  // Evitar consultar public."User" (pode não ter permissão). Tentar via Admin listUsers.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error(`Usuário não encontrado no Auth: ${email}`)
  return user.id
}

async function updatePassword(userId, password) {
  const { error } = await admin.auth.admin.updateUserById(userId, { password })
  if (error) throw error
}

async function run() {
  try {
    let userId = targetUserId
    if (!userId) {
      console.log(`🔎 Buscando usuário por email: ${targetEmail}`)
      userId = await findAuthUserIdByEmail(targetEmail)
    }

    console.log(`👤 ID: ${userId}`)
    await updatePassword(userId, newPassword)
    console.log('✅ Senha atualizada com sucesso')
  } catch (e) {
    console.error('❌ Falha ao atualizar senha:', e)
    process.exit(1)
  }
}

run()
