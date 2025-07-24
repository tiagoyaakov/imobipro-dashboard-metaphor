import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Shield, Eye, Lock, FileText } from 'lucide-react';

// -----------------------------------------------------------
// Página de Política de Privacidade - Versão Simplificada
// -----------------------------------------------------------

export const PrivacyPolicySimple: React.FC = () => {
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
              Política de Privacidade do ImobiPRO Dashboard
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6 text-sm leading-relaxed">
            {/* Introdução */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                1. Introdução
              </h2>
              <p className="text-muted-foreground">
                O ImobiPRO Dashboard ("nós", "nosso", "aplicação") respeita sua privacidade e está comprometido em proteger seus dados pessoais. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações quando você utiliza nosso 
                sistema de gestão imobiliária.
              </p>
            </section>

            {/* Informações Coletadas */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                2. Informações que Coletamos
              </h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-foreground mb-2">2.1 Informações Pessoais:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Nome completo e informações de contato</li>
                    <li>Endereço de e-mail e número de telefone</li>
                    <li>Informações profissionais (cargo, empresa)</li>
                    <li>Dados de perfil e preferências</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">2.2 Dados de Uso:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Logs de acesso e atividade no sistema</li>
                    <li>Preferências e configurações personalizadas</li>
                    <li>Interações com funcionalidades da plataforma</li>
                    <li>Dados de performance e analytics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">2.3 Dados de Propriedades e Clientes:</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Informações sobre imóveis cadastrados</li>
                    <li>Dados de clientes e leads</li>
                    <li>Histórico de agendamentos e transações</li>
                    <li>Documentos e arquivos anexados</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Como Usamos */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                3. Como Utilizamos suas Informações
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Utilizamos suas informações para os seguintes propósitos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Fornecer e manter o serviço de gestão imobiliária</li>
                  <li>Processar agendamentos e gerenciar propriedades</li>
                  <li>Comunicar-se sobre atualizações e melhorias</li>
                  <li>Fornecer suporte técnico e atendimento ao cliente</li>
                  <li>Melhorar a experiência do usuário e funcionalidades</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                </ul>
              </div>
            </section>

            {/* Compartilhamento */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                4. Compartilhamento de Informações
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Com seu consentimento explícito</li>
                  <li>Para prestadores de serviços essenciais (hosting, analytics)</li>
                  <li>Para cumprir obrigações legais ou regulamentares</li>
                  <li>Para proteger nossos direitos e segurança</li>
                  <li>Em caso de fusão, aquisição ou venda de ativos</li>
                </ul>
              </div>
            </section>

            {/* Segurança */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                5. Segurança dos Dados
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso baseado em roles (RBAC)</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e recuperação de desastres</li>
                  <li>Treinamento da equipe em práticas de segurança</li>
                </ul>
              </div>
            </section>

            {/* Seus Direitos */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                6. Seus Direitos (LGPD)
              </h2>
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li><strong>Acesso:</strong> Solicitar informações sobre seus dados pessoais</li>
                  <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar a exclusão de seus dados pessoais</li>
                  <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                  <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento</li>
                  <li><strong>Oposição:</strong> Opor-se ao tratamento de seus dados</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                7. Cookies e Tecnologias Similares
              </h2>
              <p className="text-muted-foreground">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma 
                e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </section>

            {/* Retenção */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                8. Retenção de Dados
              </h2>
              <p className="text-muted-foreground">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos 
                nesta política, ou conforme exigido por lei. Dados de propriedades e transações podem ser mantidos 
                por períodos mais longos para fins contábeis e legais.
              </p>
            </section>

            {/* Transferências */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                9. Transferências Internacionais
              </h2>
              <p className="text-muted-foreground">
                Seus dados podem ser processados em servidores localizados fora do Brasil. Garantimos que tais 
                transferências sejam realizadas em conformidade com a LGPD e que medidas adequadas de proteção 
                sejam implementadas.
              </p>
            </section>

            {/* Menores */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                10. Proteção de Menores
              </h2>
              <p className="text-muted-foreground">
                Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente informações 
                pessoais de menores. Se você é responsável por um menor e acredita que ele forneceu informações 
                pessoais, entre em contato conosco.
              </p>
            </section>

            {/* Alterações */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                11. Alterações nesta Política
              </h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre mudanças 
                significativas através da plataforma ou por e-mail. Recomendamos revisar esta política regularmente.
              </p>
            </section>

            {/* Contato */}
            <section>
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                12. Contato
              </h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, 
                  entre em contato conosco:
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

export default PrivacyPolicySimple; 