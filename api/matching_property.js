// Vercel Serverless Function: /api/matching/property
// Método: POST { id: string } => retorna interesses similares

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase backend not configured' })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  try {
    const { id } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing property id' })

    // Buscar imóvel base
    const { data: imovel, error: e1 } = await supabase
      .from('imoveisvivareal4')
      .select('id, propertyType, city, price, bedrooms, bathrooms')
      .eq('id', id)
      .single()
    if (e1) throw e1

    // Buscar interesses (join básico; filtragem complementar abaixo)
    const { data: interesses, error: e2 } = await supabase
      .from('interesse_imoveis')
      .select('*')
      .eq('status', 'ativo')
    if (e2) throw e2

    // Filtragem simples: tipo, cidade e faixa de preço ±20%
    const priceMin = (imovel?.price || 0) * 0.8
    const priceMax = (imovel?.price || 0) * 1.2

    const matches = (interesses || []).filter((it) => {
      const sameCity = !imovel?.city || !it.cidade ? true : String(it.cidade).toLowerCase() === String(imovel.city).toLowerCase()
      const sameType = !imovel?.propertyType || !it.tipo_interesse ? true : true // placeholder (sem campo tipo do lado de interesse)
      const inRange = !it.valor_proposta ? true : (it.valor_proposta >= priceMin && it.valor_proposta <= priceMax)
      return sameCity && sameType && inRange
    })

    return res.status(200).json({ matches })
  } catch (err) {
    console.error('API /matching/property error:', err)
    return res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
}


