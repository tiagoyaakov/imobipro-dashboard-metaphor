import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  Monitor,
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componentes UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Hooks e schemas
import { useAuth } from '@/hooks/useAuth';
import { AccountSettingsSchema } from '@/schemas/auth';
import type { AccountSettingsData } from '@/schemas/auth';

// -----------------------------------------------------------
// Página de Configurações Avançadas
// -----------------------------------------------------------

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados locais
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('notifications');

  // Formulário de configurações
  const form = useForm<AccountSettingsData>({
    resolver: zodResolver(AccountSettingsSchema),
    defaultValues: {
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      preferences: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        theme: 'dark',
      },
      privacy: {
        profileVisibility: 'company',
        showEmail: false,
        showPhone: false,
      },
    },
  });

  /**
   * Salvar configurações
   */
  const handleSaveSettings = async (data: AccountSettingsData) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      // Simular salvamento no backend
      console.log('Salvando configurações:', data);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSaveMessage(null), 3000);
      
    } catch (error) {
      setSaveError('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Traduzir tema para português
   */
  const translateTheme = (theme: string) => {
    const themeMap: Record<string, string> = {
      'light': 'Claro',
      'dark': 'Escuro',
      'system': 'Sistema',
    };
    return themeMap[theme] || theme;
  };

  /**
   * Traduzir idioma para português
   */
  const translateLanguage = (lang: string) => {
    const langMap: Record<string, string> = {
      'pt-BR': 'Português (Brasil)',
      'en-US': 'English (United States)',
    };
    return langMap[lang] || lang;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">
              Personalize sua experiência no ImobiPRO
            </p>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {saveMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{saveMessage}</AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Notificações
                </TabsTrigger>
                <TabsTrigger value="preferences">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferências
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <Shield className="mr-2 h-4 w-4" />
                  Privacidade
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
                  
                  {/* Aba de Notificações */}
                  <TabsContent value="notifications" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Configurações de Notificação</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Escolha como deseja receber notificações sobre atividades importantes.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="notifications.email"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Notificações por Email
                              </FormLabel>
                              <FormDescription>
                                Receba atualizações importantes por email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Push */}
                      <FormField
                        control={form.control}
                        name="notifications.push"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notificações Push
                              </FormLabel>
                              <FormDescription>
                                Receba notificações instantâneas no navegador
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* SMS */}
                      <FormField
                        control={form.control}
                        name="notifications.sms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Notificações por SMS
                              </FormLabel>
                              <FormDescription>
                                Receba notificações urgentes por SMS
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Aba de Preferências */}
                  <TabsContent value="preferences" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Preferências do Sistema</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Personalize a aparência e comportamento do sistema.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Idioma */}
                      <FormField
                        control={form.control}
                        name="preferences.language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Idioma
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o idioma" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                <SelectItem value="en-US">English (United States)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Idioma da interface do sistema
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tema */}
                      <FormField
                        control={form.control}
                        name="preferences.theme"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Tema da Interface</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-4"
                              >
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="light" id="light" />
                                  <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                                    <Sun className="h-4 w-4" />
                                    Claro
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="dark" id="dark" />
                                  <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                                    <Moon className="h-4 w-4" />
                                    Escuro
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="system" id="system" />
                                  <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                                    <Monitor className="h-4 w-4" />
                                    Sistema
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormDescription>
                              Escolha a aparência que prefere
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fuso Horário */}
                      <FormField
                        control={form.control}
                        name="preferences.timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fuso Horário</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o fuso horário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                                <SelectItem value="America/New_York">Nova York (GMT-5)</SelectItem>
                                <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                                <SelectItem value="Asia/Tokyo">Tóquio (GMT+9)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Fuso horário para exibição de datas e horários
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Aba de Privacidade */}
                  <TabsContent value="privacy" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Configurações de Privacidade</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Controle como suas informações são compartilhadas.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Visibilidade do Perfil */}
                      <FormField
                        control={form.control}
                        name="privacy.profileVisibility"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Visibilidade do Perfil</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-2"
                              >
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="public" id="public" />
                                  <div className="flex-1">
                                    <Label htmlFor="public" className="cursor-pointer font-medium">
                                      Público
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      Visível para todos os usuários
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="company" id="company" />
                                  <div className="flex-1">
                                    <Label htmlFor="company" className="cursor-pointer font-medium">
                                      Empresa
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      Visível apenas para colegas da empresa
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg border p-4">
                                  <RadioGroupItem value="private" id="private" />
                                  <div className="flex-1">
                                    <Label htmlFor="private" className="cursor-pointer font-medium">
                                      Privado
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                      Visível apenas para você
                                    </p>
                                  </div>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Mostrar Email */}
                      <FormField
                        control={form.control}
                        name="privacy.showEmail"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Mostrar Email no Perfil</FormLabel>
                              <FormDescription>
                                Permite que outros vejam seu endereço de email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Mostrar Telefone */}
                      <FormField
                        control={form.control}
                        name="privacy.showPhone"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Mostrar Telefone no Perfil</FormLabel>
                              <FormDescription>
                                Permite que outros vejam seu número de telefone
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {/* Botão de Salvar */}
                  <div className="flex justify-end pt-6 border-t">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="min-w-32"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage; 