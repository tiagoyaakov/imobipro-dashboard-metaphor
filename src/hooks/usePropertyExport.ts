// ================================================================
// HOOK: usePropertyExport
// ================================================================
// Gera exportações de Propriedades em XML (Viva Real simplificado)
// e PDF (via janela de impressão). Sem dependências externas.
// ================================================================

import { useCallback } from 'react'
import type { Property } from '@/types/properties'
import { toast } from '@/hooks/use-toast'

function formatCurrencyBRL(value?: number): string {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value)
}

function escapeXml(value?: string | number | null): string {
  const s = String(value ?? '')
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildPropertyXML(property: Property): string {
  const images = (property.images || [])
    .map((img) => `      <imagem>${escapeXml(img.url)}</imagem>`)
    .join('\n')

  const features = (property.features || [])
    .map((f) => `      <caracteristica>${escapeXml(f)}</caracteristica>`)
    .join('\n')

  const amenities = (property.amenities || [])
    .map((a) => `      <amenidade>${escapeXml(a)}</amenidade>`)
    .join('\n')

  return (
    `  <imovel id="${escapeXml(property.id)}">\n` +
    `    <titulo>${escapeXml(property.title)}</titulo>\n` +
    `    <descricao>${escapeXml(property.description)}</descricao>\n` +
    `    <tipo>${escapeXml(property.propertyType)}</tipo>\n` +
    `    <status>${escapeXml(property.status)}</status>\n` +
    `    <finalidade>${escapeXml(property.listingType)}</finalidade>\n` +
    `    <precos>\n` +
    `      <venda>${escapeXml(property.salePrice ?? '')}</venda>\n` +
    `      <aluguel>${escapeXml(property.rentPrice ?? '')}</aluguel>\n` +
    `      <condominio>${escapeXml(property.condominiumFee ?? '')}</condominio>\n` +
    `      <iptu>${escapeXml(property.iptuPrice ?? '')}</iptu>\n` +
    `    </precos>\n` +
    `    <caracteristicas>\n` +
    `      <areaTotal>${escapeXml(property.totalArea ?? '')}</areaTotal>\n` +
    `      <quartos>${escapeXml(property.bedrooms)}</quartos>\n` +
    `      <banheiros>${escapeXml(property.bathrooms)}</banheiros>\n` +
    `      <suites>${escapeXml(property.suites)}</suites>\n` +
    `      <vagas>${escapeXml(property.parkingSpaces)}</vagas>\n` +
    (features ? features + '\n' : '') +
    (amenities ? amenities + '\n' : '') +
    `    </caracteristicas>\n` +
    `    <localizacao>\n` +
    `      <endereco>${escapeXml(property.address)}</endereco>\n` +
    `      <bairro>${escapeXml(property.neighborhood)}</bairro>\n` +
    `      <cidade>${escapeXml(property.city)}</cidade>\n` +
    `      <estado>${escapeXml(property.state)}</estado>\n` +
    `      <cep>${escapeXml(property.zipCode)}</cep>\n` +
    `      <latitude>${escapeXml(property.latitude ?? '')}</latitude>\n` +
    `      <longitude>${escapeXml(property.longitude ?? '')}</longitude>\n` +
    `    </localizacao>\n` +
    (images ? `    <imagens>\n${images}\n    </imagens>\n` : '') +
    `    <origem>\n` +
    `      <vivaRealId>${escapeXml(property.vivaRealId ?? '')}</vivaRealId>\n` +
    `      <vivaRealListingId>${escapeXml(property.vivaRealListingId ?? '')}</vivaRealListingId>\n` +
    `      <vivaRealUrl>${escapeXml(property.vivaRealUrl ?? '')}</vivaRealUrl>\n` +
    `    </origem>\n` +
    `  </imovel>`
  )
}

function buildPropertyHTML(property: Property): string {
  const css = `
    body { font-family: Inter, system-ui, Arial, sans-serif; padding: 24px; }
    h1 { margin: 0 0 8px; font-size: 20px; }
    h2 { margin: 24px 0 8px; font-size: 16px; }
    p, li, td { font-size: 12px; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .table { width: 100%; border-collapse: collapse; }
    .table td { border: 1px solid #e5e7eb; padding: 6px 8px; }
    .imgs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .imgs img { width: 100%; height: 96px; object-fit: cover; border-radius: 4px; }
  `

  const money = (v?: number) => (v || v === 0 ? formatCurrencyBRL(v) : '-')

  const images = (property.images || [])
    .map((img) => `<img src="${img.url}" alt="${property.title}" />`)
    .join('')

  const features = (property.features || []).map((f) => `<li>${f}</li>`).join('')
  const amenities = (property.amenities || []).map((a) => `<li>${a}</li>`).join('')

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeXml(property.title)}</title>
    <style>${css}</style>
  </head>
  <body>
    <h1>${escapeXml(property.title)}</h1>
    <p class="muted">${escapeXml(property.address)} — ${escapeXml(property.neighborhood)} — ${escapeXml(property.city)}/${escapeXml(property.state)}</p>

    ${images ? `<div class="imgs">${images}</div>` : ''}

    <h2>Informações</h2>
    <table class="table">
      <tr><td>Tipo</td><td>${escapeXml(property.propertyType)}</td></tr>
      <tr><td>Status</td><td>${escapeXml(property.status)}</td></tr>
      <tr><td>Finalidade</td><td>${escapeXml(property.listingType)}</td></tr>
      <tr><td>Área Total</td><td>${escapeXml(property.totalArea ?? '-')} m²</td></tr>
      <tr><td>Quartos</td><td>${escapeXml(property.bedrooms)}</td></tr>
      <tr><td>Banheiros</td><td>${escapeXml(property.bathrooms)}</td></tr>
      <tr><td>Vagas</td><td>${escapeXml(property.parkingSpaces)}</td></tr>
    </table>

    <h2>Valores</h2>
    <table class="table">
      <tr><td>Venda</td><td>${money(property.salePrice)}</td></tr>
      <tr><td>Aluguel</td><td>${money(property.rentPrice)}</td></tr>
      <tr><td>Condomínio</td><td>${money(property.condominiumFee)}</td></tr>
      <tr><td>IPTU</td><td>${money(property.iptuPrice)}</td></tr>
    </table>

    ${(features || amenities) ? `<h2>Características</h2>` : ''}
    ${features ? `<ul>${features}</ul>` : ''}
    ${amenities ? `<ul>${amenities}</ul>` : ''}

    ${property.description ? `<h2>Descrição</h2><p>${escapeXml(property.description)}</p>` : ''}
  </body>
  </html>`
}

function download(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function usePropertyExport() {
  const exportPropertyXML = useCallback((property: Property) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<imoveis>\n${buildPropertyXML(property)}\n</imoveis>`
    download(`imovel_${property.id}.xml`, 'application/xml;charset=utf-8', xml)
    toast({ title: 'Exportação XML', description: 'Arquivo XML gerado.' })
  }, [])

  const exportAllXML = useCallback((properties: Property[], fileName: string = 'imoveis.xml') => {
    const body = properties.map((p) => buildPropertyXML(p)).join('\n')
    const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<imoveis>\n${body}\n</imoveis>`
    download(fileName, 'application/xml;charset=utf-8', xml)
    toast({ title: 'Exportação XML', description: 'Arquivo XML com múltiplos imóveis gerado.' })
  }, [])

  const getXMLString = useCallback((property: Property) => {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<imoveis>\n${buildPropertyXML(property)}\n</imoveis>`
  }, [])

  const getHTMLString = useCallback((property: Property) => {
    return buildPropertyHTML(property)
  }, [])

  const exportPropertyPDF = useCallback((property: Property) => {
    const html = buildPropertyHTML(property)
    const w = window.open('', '_blank')
    if (!w) {
      toast({ title: 'Exportação PDF', description: 'Não foi possível abrir a janela de impressão.', variant: 'destructive' })
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    toast({ title: 'Exportação PDF', description: 'Use a caixa de diálogo para salvar como PDF.' })
  }, [])

  return {
    exportPropertyXML,
    exportAllXML,
    getXMLString,
    exportPropertyPDF,
    getHTMLString,
  }
}

export default usePropertyExport


