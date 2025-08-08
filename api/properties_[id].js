// Vercel Serverless Function: /api/properties/:id
// Métodos: GET (detalhe), PUT (atualiza), DELETE (remove)

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase backend not configured' })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Extrair id do path /api/properties/:id
  const id = (req.query?.id || (req.url?.split('/').pop())) as string
  if (!id) return res.status(400).json({ error: 'Missing id' })

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('imoveisvivareal4')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'PUT') {
      const body = req.body || {}
      const updates = {
        ...body,
        price: body.salePrice || body.rentPrice ? Number(body.salePrice || body.rentPrice) : undefined,
        area: body.totalArea ?? undefined,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('imoveisvivareal4')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('imoveisvivareal4').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('API /properties/:id error:', err)
    return res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
}


