// Vercel Serverless Function: /api/properties
// Métodos: GET (lista), POST (cria)
// Segurança: usa SUPABASE_SERVICE_ROLE_KEY no backend (não exposto no frontend)

import { createClient } from '@supabase/supabase-js'

// Vercel Edge/Node: garantir parse do body JSON
function getBody(req) {
  if (req.body) return req.body
  try {
    return JSON.parse(req?.rawBody || '{}')
  } catch {
    return {}
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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

  try {
    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '20',
        status,
        propertyType,
        city,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        isFeatured,
        search,
      } = req.query

      const pageNum = Math.max(parseInt(page as string, 10) || 1, 1)
      const limitNum = Math.max(parseInt(limit as string, 10) || 20, 1)
      const from = (pageNum - 1) * limitNum
      const to = from + limitNum - 1

      let query = supabase
        .from('imoveisvivareal4')
        .select('*', { count: 'exact' })

      if (status) query = query.eq('status', status)
      if (propertyType) query = query.eq('propertyType', propertyType)
      if (city) query = query.ilike('city', `%${city}%`)
      if (minPrice) query = query.gte('price', Number(minPrice))
      if (maxPrice) query = query.lte('price', Number(maxPrice))
      if (minBedrooms) query = query.gte('bedrooms', Number(minBedrooms))
      if (maxBedrooms) query = query.lte('bedrooms', Number(maxBedrooms))
      if (typeof isFeatured !== 'undefined') query = query.eq('isFeatured', isFeatured === 'true')
      if (search) query = query.or(`title.ilike.%${search}%,address.ilike.%${search}%,description.ilike.%${search}%,city.ilike.%${search}%`)

      query = query.order('created_at', { ascending: false }).range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return res.status(200).json({ items: data || [], total: count || 0, page: pageNum, pages: Math.ceil((count || 0) / limitNum) })
    }

    if (req.method === 'POST') {
      const body = getBody(req)
      const now = new Date().toISOString()
      const payload = {
        id: body.id || crypto.randomUUID(),
        title: body.title || 'Imóvel',
        description: body.description || null,
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        zipCode: body.zipCode || null,
        price: Number(body.salePrice || body.rentPrice || 0),
        area: body.totalArea || null,
        bedrooms: body.bedrooms || null,
        bathrooms: body.bathrooms || null,
        propertyType: body.propertyType || 'OTHER',
        status: body.status || 'AVAILABLE',
        listingType: body.listingType || 'SALE',
        images: Array.isArray(body.images) ? body.images.map((i) => (typeof i === 'string' ? i : i.url)) : [],
        isActive: true,
        created_at: now,
        updated_at: now,
      }

      const { data, error } = await supabase.from('imoveisvivareal4').insert(payload).select().single()
      if (error) throw error
      return res.status(201).json(data)
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (err) {
    console.error('API /properties error:', err)
    return res.status(500).json({ error: 'Internal Server Error', message: err.message })
  }
}


