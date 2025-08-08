/**
 * 🆕 NovoClienteModal - Modal para Criação de Novos Clientes
 * 
 * Formulário completo para adicionar novos clientes ao sistema MVP
 * Integrado com a tabela dados_cliente e hooks useClientesMVP
 * 
 * @author ImobiPRO Team
 * @version 1.0.0 - Modal de Criação MVP
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  Target, 
  Star,
  Calendar,
  FileText,
  Loader2,
  Check,
  Users,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClientesMutationsMVP } from '@/hooks/useClientesMVP';
import { useToast } from '@/hooks/use-toast';
import { STATUS_CLIENTE_CONFIG, type StatusCliente } from '@/types/clientes';
import type { DadosClienteInsert } from '@/services/dadosCliente.service';
import { supabase } from '@/lib/supabase-client';

// ========================================
// SCHEMA DE VALIDAÇÃO ZOD
// ========================================

const novoClienteSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  telefone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .regex(/^[\d\s()+-]+$/, 'Formato de telefone inválido'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  status: z.enum(['novos', 'contatados', 'qualificados', 'interessados', 'negociando', 'convertidos', 'perdidos'])
    .default('novos'),
  portal: z.string()
    .max(50, 'Portal deve ter no máximo 50 caracteres')
    .optional(),
  interesse: z.string()
    .max(200, 'Interesse deve ter no máximo 200 caracteres')
    .optional(),
  observacoes: z.string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional(),
  funcionario: z.string()
    .optional() // Corretor responsável (apenas para ADMIN/DEV_MASTER)
});

// Tipo para corretor
interface Corretor {
  id: string;
  name: string;
  email: string;
  role: string;
}

type NovoClienteForm = z.infer<typeof novoClienteSchema>;

// ========================================
// PROPS DA INTERFACE
// ========================================

interface NovoClienteModalProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export const NovoClienteModal: React.FC<NovoClienteModalProps> = ({
  onSuccess,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const mutations = useClientesMutationsMVP();
  
  // Estados para corretores
  const [corretores, setCorretores] = useState<Corretor[]>([]);
  const [loadingCorretores, setLoadingCorretores] = useState(false);
  
  // Verificar se usuário pode escolher corretor
  const canSelectAgent = user?.role === 'DEV_MASTER' || user?.role === 'ADMIN';

  // Setup do React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<NovoClienteForm>({
    resolver: zodResolver(novoClienteSchema),
    defaultValues: {
      status: 'novos'
    }
  });

  // Watch para valores dinâmicos
  const watchedStatus = watch('status');

  // Carregar corretores disponíveis
  useEffect(() => {
    const loadCorretores = async () => {
      if (!canSelectAgent) return;
      
      setLoadingCorretores(true);
      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, name, email, role')
          .in('role', ['AGENT', 'ADMIN']) // Carregar AGENT e ADMIN
          .eq('isActive', true)
          .order('name');

        if (error) {
          console.error('Erro ao carregar corretores:', error);
        } else {
          setCorretores(data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar corretores:', error);
      } finally {
        setLoadingCorretores(false);
      }
    };

    loadCorretores();
  }, [canSelectAgent]);

  // ========================================
  // LÓGICA DE SUBMISSÃO
  // ========================================

  const onSubmit = async (data: NovoClienteForm) => {
    try {
      // REGRAS DE NEGÓCIO PARA ATRIBUIÇÃO DE CORRETOR
      let funcionarioId: string | null = null;

      if (user?.role === 'AGENT') {
        // CORRETOR: sempre vincula a si mesmo
        funcionarioId = user.id;
      } else if (user?.role === 'DEV_MASTER' || user?.role === 'ADMIN') {
        // ADMIN/DEV_MASTER: usa o corretor selecionado ou null para atribuição posterior
        funcionarioId = (data.funcionario && data.funcionario !== 'unassigned') ? data.funcionario : null;
      } else {
        // Fallback: vincular ao usuário atual
        funcionarioId = user?.id || null;
      }

      // Preparar dados para inserção
      const clienteData: DadosClienteInsert = {
        nome: data.nome.trim(),
        telefone: data.telefone.trim(),
        email: data.email?.trim() || null,
        status: data.status,
        portal: data.portal?.trim() || null,
        interesse: data.interesse?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
        funcionario: funcionarioId,
      };

      console.log('🔥 [MODAL] Dados a serem enviados:', clienteData);
      console.log('🔥 [MODAL] Role do usuário:', user?.role);
      console.log('🔥 [MODAL] Funcionario atribuído:', funcionarioId);

      // Executar mutation
      await mutations.create.mutateAsync(clienteData);

      // Sucesso - toast e callback
      const corretorNome = funcionarioId 
        ? (corretores.find(c => c.id === funcionarioId)?.name || 'Corretor')
        : 'Atribuição posterior';

      toast({
        title: "Cliente criado com sucesso!",
        description: `${data.nome} foi adicionado ao sistema (${corretorNome}) e aparecerá nas listas.`,
        variant: "default",
      });

      // Reset form e close
      reset();
      onSuccess?.();
      onClose?.();

    } catch (error) {
      console.error('🔥 [MODAL] Erro ao criar cliente:', error);
      toast({
        title: "Erro ao criar cliente",
        description: "Ocorreu um erro ao salvar o cliente. Verifique o console para detalhes.",
        variant: "destructive",
      });
    }
  };

  // ========================================
  // OPÇÕES DE SELECT
  // ========================================

  const portaisDisponiveis = [
    'WhatsApp',
    'Site Institucional', 
    'Indicação',
    'Facebook',
    'Instagram',
    'Google Ads',
    'Outros'
  ];

  const statusOptions = Object.entries(STATUS_CLIENTE_CONFIG).map(([key, config]) => ({
    value: key as StatusCliente,
    label: config.label,
    color: config.color,
    bgColor: config.bgColor
  }));

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* SEÇÃO 1: DADOS BÁSICOS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-imobipro-blue" />
              Dados Básicos
            </CardTitle>
            <CardDescription>
              Informações essenciais do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="nome"
                  placeholder="Digite o nome completo"
                  {...register('nome')}
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone/WhatsApp *
                </Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  {...register('telefone')}
                  className={errors.telefone ? 'border-red-500' : ''}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600">{errors.telefone.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="cliente@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 2: INFORMAÇÕES ADICIONAIS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-imobipro-blue" />
              Informações Adicionais
            </CardTitle>
            <CardDescription>
              Origem e interesse do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Portal/Origem */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Portal/Origem
                </Label>
                <Select onValueChange={(value) => setValue('portal', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Como conheceu a empresa?" />
                  </SelectTrigger>
                  <SelectContent>
                    {portaisDisponiveis.map((portal) => (
                      <SelectItem key={portal} value={portal}>
                        {portal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Interesse */}
              <div className="space-y-2">
                <Label htmlFor="interesse" className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Interesse Principal
                </Label>
                <Input
                  id="interesse"
                  placeholder="Ex: Apartamento 2 quartos, Casa com quintal..."
                  {...register('interesse')}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* SEÇÃO 3: GESTÃO E CONTROLE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-imobipro-blue" />
              Gestão e Controle
            </CardTitle>
            <CardDescription>
              Status inicial, atribuição de corretor e observações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Status Inicial */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Status Inicial
                </Label>
                <Select 
                  defaultValue="novos"
                  onValueChange={(value) => setValue('status', value as StatusCliente)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.bgColor}`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {watchedStatus && (
                  <Badge variant="outline" className="text-xs">
                    Status: {STATUS_CLIENTE_CONFIG[watchedStatus]?.label}
                  </Badge>
                )}
              </div>

              {/* Atribuição de Corretor (apenas para ADMIN/DEV_MASTER) */}
              {canSelectAgent && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Atribuir a Corretor
                  </Label>
                  <Select 
                    onValueChange={(value) => setValue('funcionario', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um corretor ou deixe em branco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          Atribuição posterior (n8n)
                        </div>
                      </SelectItem>
                      {loadingCorretores ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Carregando corretores...
                        </SelectItem>
                      ) : (
                        corretores.map((corretor) => (
                          <SelectItem key={corretor.id} value={corretor.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                corretor.role === 'ADMIN' ? 'bg-blue-500' : 'bg-green-500'
                              }`} />
                              {corretor.name}
                              <Badge variant="outline" className="text-xs ml-2">
                                {corretor.role === 'ADMIN' ? 'Admin' : 'Corretor'}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === 'AGENT' 
                      ? 'Como corretor, clientes serão automaticamente atribuídos a você'
                      : 'Deixe em branco para atribuição automática pelo n8n'
                    }
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className={`space-y-2 ${canSelectAgent ? 'lg:col-span-2' : ''}`}>
                <Label htmlFor="observacoes" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Anotações importantes sobre o cliente..."
                  rows={3}
                  {...register('observacoes')}
                  className={errors.observacoes ? 'border-red-500' : ''}
                />
                {errors.observacoes && (
                  <p className="text-sm text-red-600">{errors.observacoes.message}</p>
                )}
              </div>

            </div>

          </CardContent>
        </Card>

        {/* FOOTER COM BOTÕES */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || mutations.create.isPending}
            className="bg-imobipro-blue hover:bg-imobipro-blue-dark text-white flex-1 sm:flex-none"
          >
            {isSubmitting || mutations.create.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvar Cliente
              </>
            )}
          </Button>
        </DialogFooter>

      </form>
    </div>
  );
};