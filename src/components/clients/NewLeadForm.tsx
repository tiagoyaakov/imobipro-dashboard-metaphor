/**
 * 🔲 ImobiPRO - Formulário de Novo Lead
 * 
 * Componente para criação de novos leads no funil de vendas.
 * Inclui validação, auto-complete, scoring automático e UX otimizada.
 * 
 * Funcionalidades:
 * - Formulário completo com validação
 * - Auto-complete para campos comuns
 * - Pré-visualização do score calculado
 * - Upload de avatar opcional
 * - Integração com sistema de atribuição
 * - Adição de tags personalizadas
 * 
 * @author ImobiPRO Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, User, Building, DollarSign, Calendar, Tag, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useCreateContact } from '@/hooks/useClients';
import type { CreateContactInput } from '@/types/clients';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const newLeadSchema = z.object({
  // Dados básicos (obrigatórios)
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional().or(z.literal('')),
  
  // Origem do lead
  leadSource: z.string().min(1, 'Fonte do lead é obrigatória'),
  leadSourceDetails: z.string().optional(),
  
  // Informações profissionais
  company: z.string().optional(),
  position: z.string().optional(),
  
  // Qualificação inicial
  budget: z.number().positive('Orçamento deve ser positivo').optional(),
  timeline: z.string().optional(),
  
  // Preferências do cliente
  preferences: z.object({
    propertyType: z.string().optional(),
    location: z.string().optional(),
    bedrooms: z.number().min(0).optional(),
    minArea: z.number().min(0).optional(),
    maxArea: z.number().min(0).optional(),
  }).optional(),
  
  // Segmentação
  tags: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  
  // Consentimentos
  optInWhatsApp: z.boolean().default(false),
  optInEmail: z.boolean().default(false),
  optInSMS: z.boolean().default(false),
  
  // Atribuição
  agentId: z.string().min(1, 'Corretor deve ser selecionado'),
});

type NewLeadFormData = z.infer<typeof newLeadSchema>;

// ============================================================================
// DADOS ESTÁTICOS
// ============================================================================

const LEAD_SOURCES = [
  { value: 'WhatsApp', label: '📱 WhatsApp', quality: 70 },
  { value: 'Site', label: '🌐 Site', quality: 80 },
  { value: 'Indicação', label: '👥 Indicação', quality: 100 },
  { value: 'Facebook', label: '📘 Facebook', quality: 60 },
  { value: 'Instagram', label: '📷 Instagram', quality: 60 },
  { value: 'Google Ads', label: '🎯 Google Ads', quality: 75 },
  { value: 'Cold Call', label: '📞 Cold Call', quality: 30 },
  { value: 'Email Marketing', label: '📧 Email Marketing', quality: 45 },
  { value: 'Evento', label: '🎪 Evento', quality: 85 },
  { value: 'Parceiro', label: '🤝 Parceiro', quality: 90 },
  { value: 'Outros', label: '❓ Outros', quality: 50 },
];

const TIMELINES = [
  { value: 'Imediato', label: '🚀 Imediato', urgency: 100 },
  { value: '1-3 meses', label: '📅 1-3 meses', urgency: 85 },
  { value: '3-6 meses', label: '📆 3-6 meses', urgency: 70 },
  { value: '6-12 meses', label: '📋 6-12 meses', urgency: 55 },
  { value: '1+ anos', label: '🗓️ 1+ anos', urgency: 30 },
  { value: 'Indeterminado', label: '❔ Indeterminado', urgency: 20 },
];

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: '🏢 Apartamento' },
  { value: 'HOUSE', label: '🏠 Casa' },
  { value: 'COMMERCIAL', label: '🏪 Comercial' },
  { value: 'LAND', label: '🌾 Terreno' },
  { value: 'OTHER', label: '❓ Outros' },
];

const COMMON_TAGS = [
  'VIP', 'Investidor', 'Primeira Compra', 'Urgente', 'Financiamento',
  'À Vista', 'Troca', 'Locação', 'Venda', 'Consultor'
];

// ============================================================================
// INTERFACE
// ============================================================================

interface NewLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAgentId?: string;
  onSuccess?: (contact: any) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function NewLeadForm({
  isOpen,
  onClose,
  defaultAgentId,
  onSuccess
}: NewLeadFormProps) {
  const [estimatedScore, setEstimatedScore] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');

  const createContact = useCreateContact();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<NewLeadFormData>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      agentId: defaultAgentId || '',
      priority: 'MEDIUM',
      optInWhatsApp: false,
      optInEmail: false,
      optInSMS: false,
      tags: [],
      preferences: {}
    },
    mode: 'onChange'
  });

  // Watch para cálculo automático do score
  const watchedFields = watch(['leadSource', 'budget', 'timeline']);

  // ============================================================================
  // CÁLCULO DE SCORE EM TEMPO REAL
  // ============================================================================

  useEffect(() => {
    const calculateEstimatedScore = () => {
      let score = 0;
      const [source, budget, timeline] = watchedFields;

      // Score por fonte (20% do total)
      if (source) {
        const sourceData = LEAD_SOURCES.find(s => s.value === source);
        score += (sourceData?.quality || 50) * 0.20;
      }

      // Score por orçamento (20% do total)
      if (budget) {
        let budgetScore = 20;
        if (budget >= 1000000) budgetScore = 100;
        else if (budget >= 500000) budgetScore = 85;
        else if (budget >= 300000) budgetScore = 70;
        else if (budget >= 150000) budgetScore = 55;
        else if (budget >= 50000) budgetScore = 40;
        
        score += budgetScore * 0.20;
      }

      // Score por timeline (15% do total)
      if (timeline) {
        const timelineData = TIMELINES.find(t => t.value === timeline);
        score += (timelineData?.urgency || 40) * 0.15;
      }

      // Score base por ter dados básicos (45% restante distribuído)
      score += 45; // Score base para novo lead

      setEstimatedScore(Math.round(Math.min(100, Math.max(0, score))));
    };

    calculateEstimatedScore();
  }, [watchedFields]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddTag = (tag: string) => {
    const currentTags = watch('tags') || [];
    if (!currentTags.includes(tag)) {
      setValue('tags', [...currentTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      handleAddTag(customTag.trim());
      setCustomTag('');
    }
  };

  const onSubmit = async (data: NewLeadFormData) => {
    try {
      const contactData: CreateContactInput = {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        leadSource: data.leadSource,
        leadSourceDetails: data.leadSourceDetails,
        company: data.company,
        position: data.position,
        budget: data.budget,
        timeline: data.timeline,
        preferences: data.preferences && Object.keys(data.preferences).length > 0 
          ? data.preferences 
          : undefined,
        tags: data.tags,
        priority: data.priority,
        agentId: data.agentId,
      };

      const result = await createContact.mutateAsync(contactData);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      handleClose();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    }
  };

  const handleClose = () => {
    reset();
    setAvatarPreview(null);
    setCustomTag('');
    setEstimatedScore(0);
    onClose();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Baixo';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-imobipro-blue" />
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUNA 1: DADOS BÁSICOS */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback className="text-lg">
                        {watch('name')?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Nome */}
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Ex: João Silva"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="joao@email.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="(11) 99999-9999"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Empresa */}
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      {...register('company')}
                      placeholder="Empresa ABC"
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      {...register('position')}
                      placeholder="Diretor"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLUNA 2: QUALIFICAÇÃO */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Qualificação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fonte do Lead */}
                  <div>
                    <Label>Fonte do Lead *</Label>
                    <Controller
                      name="leadSource"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={errors.leadSource ? 'border-red-500' : ''}>
                            <SelectValue placeholder="Selecione a fonte" />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_SOURCES.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.leadSource && (
                      <p className="text-sm text-red-500 mt-1">{errors.leadSource.message}</p>
                    )}
                  </div>

                  {/* Detalhes da Fonte */}
                  <div>
                    <Label htmlFor="leadSourceDetails">Detalhes da Fonte</Label>
                    <Input
                      id="leadSourceDetails"
                      {...register('leadSourceDetails')}
                      placeholder="Ex: Campanha Facebook Inverno 2024"
                    />
                  </div>

                  {/* Orçamento */}
                  <div>
                    <Label htmlFor="budget">Orçamento (R$)</Label>
                    <Input
                      id="budget"
                      type="number"
                      {...register('budget', { valueAsNumber: true })}
                      placeholder="500000"
                      className={errors.budget ? 'border-red-500' : ''}
                    />
                    {errors.budget && (
                      <p className="text-sm text-red-500 mt-1">{errors.budget.message}</p>
                    )}
                  </div>

                  {/* Timeline */}
                  <div>
                    <Label>Prazo Desejado</Label>
                    <Controller
                      name="timeline"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o prazo" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMELINES.map((timeline) => (
                              <SelectItem key={timeline.value} value={timeline.value}>
                                {timeline.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Prioridade */}
                  <div>
                    <Label>Prioridade</Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">🟢 Baixa</SelectItem>
                            <SelectItem value="MEDIUM">🟡 Média</SelectItem>
                            <SelectItem value="HIGH">🟠 Alta</SelectItem>
                            <SelectItem value="URGENT">🔴 Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Score Estimado */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Score Estimado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Qualificação</span>
                      <span className={`text-sm font-medium ${getScoreColor(estimatedScore)}`}>
                        {getScoreLabel(estimatedScore)}
                      </span>
                    </div>
                    <Progress value={estimatedScore} className="h-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Score calculado em tempo real</span>
                      <span className={`text-lg font-bold ${getScoreColor(estimatedScore)}`}>
                        {estimatedScore}/100
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* COLUNA 3: PREFERÊNCIAS E CONFIGURAÇÕES */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Preferências do Imóvel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipo de Imóvel */}
                  <div>
                    <Label>Tipo de Imóvel</Label>
                    <Controller
                      name="preferences.propertyType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Localização */}
                  <div>
                    <Label htmlFor="location">Localização Preferida</Label>
                    <Input
                      id="location"
                      {...register('preferences.location')}
                      placeholder="Ex: Centro, Vila Madalena"
                    />
                  </div>

                  {/* Quartos */}
                  <div>
                    <Label htmlFor="bedrooms">Quartos</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      min="0"
                      {...register('preferences.bedrooms', { valueAsNumber: true })}
                      placeholder="3"
                    />
                  </div>

                  {/* Área */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="minArea">Área Mín. (m²)</Label>
                      <Input
                        id="minArea"
                        type="number"
                        min="0"
                        {...register('preferences.minArea', { valueAsNumber: true })}
                        placeholder="80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxArea">Área Máx. (m²)</Label>
                      <Input
                        id="maxArea"
                        type="number"
                        min="0"
                        {...register('preferences.maxArea', { valueAsNumber: true })}
                        placeholder="200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Tags Selecionadas */}
                  {watch('tags')?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {watch('tags')?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-red-100"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tags Comuns */}
                  <div className="flex flex-wrap gap-1">
                    {COMMON_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-imobipro-blue hover:text-white"
                        onClick={() => handleAddTag(tag)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Tag Personalizada */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tag personalizada"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomTag}
                      disabled={!customTag.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Consentimentos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Consentimentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optInWhatsApp" className="text-sm">WhatsApp</Label>
                    <Controller
                      name="optInWhatsApp"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="optInWhatsApp"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optInEmail" className="text-sm">Email</Label>
                    <Controller
                      name="optInEmail"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="optInEmail"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="optInSMS" className="text-sm">SMS</Label>
                    <Controller
                      name="optInSMS"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          id="optInSMS"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <Separator />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createContact.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createContact.isPending}
              className="bg-imobipro-blue hover:bg-imobipro-blue/90"
            >
              {createContact.isPending ? 'Criando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}