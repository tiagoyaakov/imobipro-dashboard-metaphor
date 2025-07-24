import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, FileText, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

// -----------------------------------------------------------
// Página de Termos de Serviço - Versão Simplificada
// -----------------------------------------------------------

export const TermsOfServiceSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header simples */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">I</span>
              </div>
              <span className="text-xl font-bold text-primary">ImobiPRO</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b bg-muted/50">
            <CardTitle className="text-2xl font-bold text-primary">
              Termos de Serviço do ImobiPRO Dashboard
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6 text-sm leading-relaxed">
            {/* Introdução */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                1. Aceitação dos Termos
              </h2>
              <p className="text-muted-foreground">
                Ao acessar e utilizar o ImobiPRO Dashboard ("Serviço"), você concorda em cumprir e estar vinculado 
                a estes Termos de Serviço ("Termos"). Se você não concordar com qualquer parte destes termos, 
                não deve utilizar nosso serviço.
              </p>
            </section>

            {/* Descrição do Serviço */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                2. Descrição do Serviço
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  O ImobiPRO Dashboard é uma plataforma de gestão imobiliária que oferece:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Gestão de propriedades e imóveis</li>
                  <li>Sistema de agendamentos e visitas</li>
                  <li>Controle de clientes e leads</li>
                  <li>Pipeline de vendas e negociações</li>
                  <li>Relatórios e análises de performance</li>
                  <li>Integração com Google Calendar e WhatsApp</li>
                  <li>Ferramentas de CRM avançado</li>
                </ul>
              </div>
            </section>

            {/* Registro e Conta */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                3. Registro e Conta de Usuário
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Para utilizar nossos serviços, você deve:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Criar uma conta válida com informações precisas</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                  <li>Notificar imediatamente sobre uso não autorizado</li>
                  <li>Ter pelo menos 18 anos de idade ou autorização legal</li>
                </ul>
              </div>
            </section>

            {/* Uso Aceitável */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                4. Uso Aceitável
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Você concorda em utilizar o serviço apenas para propósitos legais e de acordo com estes Termos. 
                  É proibido:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Usar o serviço para atividades ilegais ou fraudulentas</li>
                  <li>Violar direitos de propriedade intelectual</li>
                  <li>Transmitir vírus, malware ou código malicioso</li>
                  <li>Tentar acessar sistemas não autorizados</li>
                  <li>Interferir no funcionamento da plataforma</li>
                  <li>Compartilhar credenciais de acesso</li>
                  <li>Usar o serviço para spam ou marketing não autorizado</li>
                </ul>
              </div>
            </section>

            {/* Propriedade Intelectual */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                5. Propriedade Intelectual
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  O ImobiPRO Dashboard e todo seu conteúdo, incluindo mas não se limitando a:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Software, código fonte e algoritmos</li>
                  <li>Design, layout e interface do usuário</li>
                  <li>Marcas registradas, logotipos e identidade visual</li>
                  <li>Documentação e materiais de suporte</li>
                  <li>Conteúdo e funcionalidades exclusivas</li>
                </ul>
                <p className="text-muted-foreground">
                  São protegidos por direitos autorais, marcas registradas e outras leis de propriedade intelectual. 
                  Você mantém a propriedade dos dados que inserir na plataforma.
                </p>
              </div>
            </section>

            {/* Privacidade */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                6. Privacidade e Proteção de Dados
              </h2>
              <p className="text-muted-foreground">
                O uso de suas informações pessoais é regido por nossa Política de Privacidade, que faz parte 
                integrante destes Termos. Ao utilizar nosso serviço, você concorda com a coleta e uso de informações 
                conforme descrito na Política de Privacidade.
              </p>
            </section>

            {/* Disponibilidade */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                7. Disponibilidade do Serviço
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Nos esforçamos para manter o serviço disponível 24/7, mas não garantimos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Disponibilidade ininterrupta ou sem erros</li>
                  <li>Compatibilidade com todos os dispositivos ou navegadores</li>
                  <li>Velocidade específica de carregamento</li>
                  <li>Funcionamento durante manutenções programadas</li>
                </ul>
                <p className="text-muted-foreground">
                  Reservamo-nos o direito de modificar, suspender ou descontinuar o serviço a qualquer momento, 
                  com aviso prévio quando possível.
                </p>
              </div>
            </section>

            {/* Limitação de Responsabilidade */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                8. Limitação de Responsabilidade
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Em nenhuma circunstância o ImobiPRO Dashboard será responsável por:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Danos indiretos, incidentais ou consequenciais</li>
                  <li>Perda de lucros, dados ou oportunidades de negócio</li>
                  <li>Danos resultantes de uso inadequado do serviço</li>
                  <li>Problemas de conectividade ou infraestrutura de terceiros</li>
                  <li>Ações de outros usuários da plataforma</li>
                </ul>
                <p className="text-muted-foreground">
                  Nossa responsabilidade total será limitada ao valor pago pelos serviços nos últimos 12 meses.
                </p>
              </div>
            </section>

            {/* Indenização */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                9. Indenização
              </h2>
              <p className="text-muted-foreground">
                Você concorda em indenizar e isentar o ImobiPRO Dashboard de qualquer reclamação, dano, perda 
                ou despesa (incluindo honorários advocatícios) decorrentes de seu uso do serviço ou violação 
                destes Termos.
              </p>
            </section>

            {/* Rescisão */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                10. Rescisão
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Podemos suspender ou encerrar sua conta a qualquer momento por:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Violação destes Termos de Serviço</li>
                  <li>Uso inadequado ou fraudulento do serviço</li>
                  <li>Inatividade prolongada da conta</li>
                  <li>Solicitação do usuário</li>
                  <li>Descontinuação do serviço</li>
                </ul>
                <p className="text-muted-foreground">
                  Após a rescisão, você perderá o acesso ao serviço e seus dados poderão ser excluídos conforme 
                  nossa Política de Privacidade.
                </p>
              </div>
            </section>

            {/* Lei Aplicável */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                11. Lei Aplicável e Jurisdição
              </h2>
              <p className="text-muted-foreground">
                Estes Termos são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos tribunais 
                competentes do Brasil, com renúncia expressa a qualquer outro foro.
              </p>
            </section>

            {/* Disposições Gerais */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                12. Disposições Gerais
              </h2>
              <div className="space-y-3">
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Integralidade:</strong> Estes Termos constituem o acordo completo entre as partes</li>
                  <li><strong>Renúncia:</strong> A falha em exercer um direito não constitui renúncia</li>
                  <li><strong>Divisibilidade:</strong> Se alguma cláusula for inválida, as demais permanecem válidas</li>
                  <li><strong>Força Maior:</strong> Não seremos responsáveis por eventos fora de nosso controle</li>
                  <li><strong>Atribuição:</strong> Você não pode transferir seus direitos sem nosso consentimento</li>
                </ul>
              </div>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                13. Alterações nos Termos
              </h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas 
                serão comunicadas através da plataforma ou por e-mail. O uso continuado do serviço após as 
                modificações constitui aceitação dos novos termos.
              </p>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                14. Contato
              </h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium text-foreground">ImobiPRO Dashboard</p>
                  <p className="text-muted-foreground">E-mail: imobprodashboard@gmail.com</p>
                  <p className="text-muted-foreground">Horário de atendimento: Segunda a Sexta, 9h às 18h (BRT)</p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Footer simples */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-imobipro-blue to-imobipro-blue-dark rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ImobiPRO Dashboard. Todos os direitos reservados.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServiceSimple; 