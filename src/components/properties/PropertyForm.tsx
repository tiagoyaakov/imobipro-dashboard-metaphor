// ================================================
// COMPONENTE: PropertyForm
// ================================================
// Data: 08/08/2025
// Descrição: Formulário de criação/edição de propriedades
// Tecnologias: React Hook Form + Zod, shadcn/ui, Tailwind CSS
// Observação: Este componente não executa side-effects; delega submit
// ================================================

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

import {
  PropertyFormData,
  PropertyListingType,
  PropertyStatus,
  PropertyType,
  BRAZILIAN_STATES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  LISTING_TYPE_LABELS,
} from '@/types/properties'

// ================================================
// ESQUEMA DE VALIDAÇÃO (Zod)
// ================================================

const formSchema = z.object({
  title: z.string().min(3, 'Informe um título válido'),
  description: z.string().optional(),
  propertyType: z.nativeEnum(PropertyType, { required_error: 'Tipo é obrigatório' }),
  status: z.nativeEnum(PropertyStatus, { required_error: 'Status é obrigatório' }),
  listingType: z.nativeEnum(PropertyListingType, { required_error: 'Finalidade é obrigatória' }),

  salePrice: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Valor inválido'),
  rentPrice: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Valor inválido'),
  condominiumFee: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Valor inválido'),
  iptuPrice: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Valor inválido'),

  totalArea: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Área inválida'),
  builtArea: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Área inválida'),
  usefulArea: z.number().optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Área inválida'),

  bedrooms: z.number().int().min(0).or(z.string().transform(v => Number(v))).refine(v => !Number.isNaN(v), 'Número inválido'),
  bathrooms: z.number().int().min(0).or(z.string().transform(v => Number(v))).refine(v => !Number.isNaN(v), 'Número inválido'),
  suites: z.number().int().min(0).or(z.string().transform(v => Number(v))).refine(v => !Number.isNaN(v), 'Número inválido'),
  parkingSpaces: z.number().int().min(0).or(z.string().transform(v => Number(v))).refine(v => !Number.isNaN(v), 'Número inválido'),
  floors: z.number().int().min(0).or(z.string().transform(v => Number(v))).refine(v => !Number.isNaN(v), 'Número inválido'),
  floor: z.number().int().min(0).optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Número inválido'),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional().or(z.string().transform(v => (v === '' ? undefined : Number(v)))).refine(v => v === undefined || !Number.isNaN(v), 'Ano inválido'),

  address: z.string().min(3, 'Endereço é obrigatório'),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(5, 'CEP é obrigatório'),

  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  notes: z.string().optional(),
})

type FormSchema = z.infer<typeof formSchema>

// ================================================
// PROPRIEDADES DO COMPONENTE
// ================================================

export interface PropertyFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<PropertyFormData>
  onSubmit: (values: PropertyFormData) => Promise<void> | void
  onCancel?: () => void
  isSubmitting?: boolean
}

// ================================================
// COMPONENTE PRINCIPAL
// ================================================

const PropertyForm: React.FC<PropertyFormProps> = ({ mode, defaultValues, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      propertyType: defaultValues?.propertyType || PropertyType.APARTMENT,
      status: defaultValues?.status || PropertyStatus.AVAILABLE,
      listingType: defaultValues?.listingType || PropertyListingType.SALE,
      salePrice: defaultValues?.salePrice,
      rentPrice: defaultValues?.rentPrice,
      condominiumFee: defaultValues?.condominiumFee,
      iptuPrice: defaultValues?.iptuPrice,
      totalArea: defaultValues?.totalArea,
      builtArea: defaultValues?.builtArea,
      usefulArea: defaultValues?.usefulArea,
      bedrooms: defaultValues?.bedrooms ?? 0,
      bathrooms: defaultValues?.bathrooms ?? 0,
      suites: defaultValues?.suites ?? 0,
      parkingSpaces: defaultValues?.parkingSpaces ?? 0,
      floors: defaultValues?.floors ?? 0,
      floor: defaultValues?.floor,
      yearBuilt: defaultValues?.yearBuilt,
      address: defaultValues?.address || '',
      number: defaultValues?.number || '',
      complement: defaultValues?.complement || '',
      neighborhood: defaultValues?.neighborhood || '',
      city: defaultValues?.city || '',
      state: defaultValues?.state || 'SP',
      zipCode: defaultValues?.zipCode || '',
      features: defaultValues?.features || [],
      amenities: defaultValues?.amenities || [],
      isFeatured: defaultValues?.isFeatured ?? false,
      notes: defaultValues?.notes || '',
    },
  })

  // Transformar inputs de lista (features/amenities) de texto → string[]
  const parseList = (value: string): string[] =>
    value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)

  // ================================================
  // IMPORTAÇÃO INTELIGENTE (JSON/XML Viva Real, PDF placeholder)
  // ================================================

  type VivaJson = Partial<{
    idx: number
    id: number | string
    listing_id: string
    imagens: string[]
    tipo_categoria: string
    tipo_imovel: string
    descricao: string
    preco: string | number
    tamanho_m2: string | number
    quartos: number
    banheiros: number
    suite: number
    garagem: number
    features: string[]
    andar?: number
    blocos?: number
    cidade: string
    bairro: string
    endereco: string
    numero?: string
    complemento?: string
    cep: string
  }>

  const normalizePrice = (v?: string | number) => {
    if (v === undefined || v === null) return undefined
    if (typeof v === 'number') return v
    // Remove tudo que não é número e vírgula/ponto e tenta converter
    const cleaned = v.replace(/[^0-9,\.]/g, '').replace('.', '').replace(',', '.')
    const num = Number(cleaned)
    return Number.isNaN(num) ? undefined : num
  }

  const mapVivaToForm = (item: VivaJson): Partial<PropertyFormData> => {
    const salePrice = normalizePrice(item.preco)
    const totalArea = typeof item.tamanho_m2 === 'string' ? Number(item.tamanho_m2) : item.tamanho_m2
    // Mapeamento simples de tipo
    const typeMap: Record<string, PropertyType> = {
      'apartamento': PropertyType.APARTMENT,
      'apartment': PropertyType.APARTMENT,
      'casa': PropertyType.HOUSE,
      'house': PropertyType.HOUSE,
      'comercial': PropertyType.COMMERCIAL_BUILDING,
      'loja': PropertyType.RETAIL,
      'terreno': PropertyType.LAND,
      'land': PropertyType.LAND,
      'studio': PropertyType.STUDIO,
      'cobertura': PropertyType.PENTHOUSE,
    }
    const normalizedTypeKey = String(item.tipo_imovel || '').toLowerCase()
    const propertyType = typeMap[normalizedTypeKey] || PropertyType.OTHER

    const titleSuggestion = `${item.tipo_imovel || 'Imóvel'} ${item.bairro ? `- ${item.bairro}` : ''}`.trim()

    return {
      title: titleSuggestion,
      description: item.descricao || '',
      propertyType,
      status: PropertyStatus.AVAILABLE,
      listingType: PropertyListingType.SALE,
      salePrice,
      totalArea: totalArea && !Number.isNaN(totalArea) ? totalArea : undefined,
      bedrooms: item.quartos ?? 0,
      bathrooms: item.banheiros ?? 0,
      suites: item.suite ?? 0,
      parkingSpaces: item.garagem ?? 0,
      floors: 0,
      address: item.endereco || '',
      number: item.numero || '',
      complement: item.complemento || '',
      neighborhood: item.bairro || '',
      city: item.cidade || '',
      state: form.getValues('state') || 'SP',
      zipCode: item.cep || '',
      features: Array.isArray(item.features) ? item.features : [],
      amenities: [],
      isFeatured: false,
      notes: '',
    }
  }

  const setFormFromData = (data: Partial<PropertyFormData>) => {
    const keys = Object.keys(data) as (keyof PropertyFormData)[]
    keys.forEach((k) => {
      // @ts-expect-error setValue tipagem parcial
      form.setValue(k, data[k] as any, { shouldDirty: true, shouldValidate: false })
    })
  }

  const handleJsonPaste = (text: string) => {
    try {
      const parsed = JSON.parse(text)
      const first: VivaJson = Array.isArray(parsed) ? parsed[0] : parsed
      const mapped = mapVivaToForm(first)
      setFormFromData(mapped)
      toast({ title: 'Importação JSON', description: 'Campos pré-preenchidos com sucesso.' })
    } catch (e) {
      toast({ title: 'JSON inválido', description: 'Não foi possível processar o JSON informado.', variant: 'destructive' })
    }
  }

  const parseXmlString = (xmlStr: string): VivaJson | null => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlStr, 'text/xml')
      // Tentativa simples: ler tags comuns (ajuste conforme necessário)
      const get = (tag: string) => doc.getElementsByTagName(tag)?.[0]?.textContent || ''
      const images = Array.from(doc.getElementsByTagName('imagem')).map((n) => n.textContent || '')
      const obj: VivaJson = {
        tipo_imovel: get('tipo') || get('tipo_imovel'),
        descricao: get('descricao'),
        preco: get('venda') || get('preco'),
        tamanho_m2: get('areaTotal') || get('tamanho_m2'),
        quartos: Number(get('quartos') || '0'),
        banheiros: Number(get('banheiros') || '0'),
        garagem: Number(get('vagas') || '0'),
        cidade: get('cidade'),
        bairro: get('bairro'),
        endereco: get('endereco'),
        cep: get('cep'),
        imagens: images,
      }
      return obj
    } catch {
      return null
    }
  }

  const handleFileImport = async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext === 'pdf') {
      toast({ title: 'PDF enviado', description: 'Parsing de PDF não implementado. Arquivo aceito como evidência.', variant: 'default' })
      return
    }
    const text = await file.text()
    if (ext === 'json') {
      handleJsonPaste(text)
      return
    }
    if (ext === 'xml') {
      const viva = parseXmlString(text)
      if (!viva) {
        toast({ title: 'XML inválido', description: 'Não foi possível processar o XML.', variant: 'destructive' })
        return
      }
      const mapped = mapVivaToForm(viva)
      setFormFromData(mapped)
      toast({ title: 'Importação XML', description: 'Campos pré-preenchidos com sucesso.' })
      return
    }
    toast({ title: 'Formato não suportado', description: 'Use JSON ou XML do Viva Real.', variant: 'destructive' })
  }

  const handleSubmit = (values: FormSchema) => {
    const payload: PropertyFormData = {
      ...values,
      features: values.features || [],
      amenities: values.amenities || [],
    }
    return onSubmit(payload)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Importação Inteligente */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Dados (Viva Real)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="jsonPaste">Colar JSON Viva Real</Label>
              <Textarea id="jsonPaste" placeholder="Cole aqui o JSON do Viva Real" onBlur={(e) => {
                if (e.target.value.trim()) handleJsonPaste(e.target.value)
              }} />
              <p className="text-xs text-gray-500">Ao sair do campo, tentaremos pré-preencher automaticamente.</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fileImport">Upload JSON/XML/PDF</Label>
              <Input id="fileImport" type="file" accept=".json,.xml,.pdf" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFileImport(f)
              }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Básico */}
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Nova Propriedade' : 'Editar Propriedade'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input id="title" {...form.register('title')} placeholder="Ex: Apartamento 2 dorm - Centro" />
            {form.formState.errors.title && (
              <span className="text-xs text-red-600">{form.formState.errors.title.message}</span>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...form.register('description')} placeholder="Descrição detalhada do imóvel" />
          </div>

          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select onValueChange={(v) => form.setValue('propertyType', v as PropertyType)} value={form.watch('propertyType')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <Select onValueChange={(v) => form.setValue('status', v as PropertyStatus)} value={form.watch('status')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Finalidade</Label>
            <Select onValueChange={(v) => form.setValue('listingType', v as PropertyListingType)} value={form.watch('listingType')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a finalidade" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Valores */}
      <Card>
        <CardHeader>
          <CardTitle>Valores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label htmlFor="salePrice">Preço de Venda</Label>
            <Input id="salePrice" type="number" min={0} step={1000} {...form.register('salePrice')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rentPrice">Preço de Aluguel</Label>
            <Input id="rentPrice" type="number" min={0} step={50} {...form.register('rentPrice')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="condominiumFee">Condomínio</Label>
            <Input id="condominiumFee" type="number" min={0} step={10} {...form.register('condominiumFee')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="iptuPrice">IPTU</Label>
            <Input id="iptuPrice" type="number" min={0} step={10} {...form.register('iptuPrice')} />
          </div>
        </CardContent>
      </Card>

      {/* Características */}
      <Card>
        <CardHeader>
          <CardTitle>Características</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="space-y-1">
            <Label htmlFor="bedrooms">Quartos</Label>
            <Input id="bedrooms" type="number" min={0} {...form.register('bedrooms')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bathrooms">Banheiros</Label>
            <Input id="bathrooms" type="number" min={0} {...form.register('bathrooms')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="suites">Suítes</Label>
            <Input id="suites" type="number" min={0} {...form.register('suites')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parkingSpaces">Vagas</Label>
            <Input id="parkingSpaces" type="number" min={0} {...form.register('parkingSpaces')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="totalArea">Área Total (m²)</Label>
            <Input id="totalArea" type="number" min={0} step={1} {...form.register('totalArea')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="floor">Andar</Label>
            <Input id="floor" type="number" min={0} {...form.register('floor')} />
          </div>
        </CardContent>
      </Card>

      {/* Localização */}
      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...form.register('address')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="number">Número</Label>
            <Input id="number" {...form.register('number')} />
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label htmlFor="complement">Complemento</Label>
            <Input id="complement" {...form.register('complement')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" {...form.register('neighborhood')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...form.register('city')} />
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <Select onValueChange={(v) => form.setValue('state', v)} value={form.watch('state')}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {BRAZILIAN_STATES.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="zipCode">CEP</Label>
            <Input id="zipCode" {...form.register('zipCode')} />
          </div>
        </CardContent>
      </Card>

      {/* Listas (features/amenities) */}
      <Card>
        <CardHeader>
          <CardTitle>Mais Informações</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="featuresText">Features (separe por vírgula)</Label>
            <Input
              id="featuresText"
              placeholder="Ex: Balcony,Elevator,Gym"
              onChange={(e) => form.setValue('features', parseList(e.target.value))}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {(form.watch('features') || []).map((f, i) => (
                <Badge key={`f-${i}`} variant="outline">{f}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="amenitiesText">Amenidades (separe por vírgula)</Label>
            <Input
              id="amenitiesText"
              placeholder="Ex: Piscina,Academia,Portaria 24h"
              onChange={(e) => form.setValue('amenities', parseList(e.target.value))}
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {(form.watch('amenities') || []).map((a, i) => (
                <Badge key={`a-${i}`} variant="secondary">{a}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...form.register('notes')} />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Salvar Propriedade' : 'Salvar Edições'}
        </Button>
      </div>
    </form>
  )
}

export default PropertyForm


