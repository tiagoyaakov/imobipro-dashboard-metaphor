## Product Requirements Document (PRD): ImobiPRO Dashboard

-----

### 1\. Introdução

  * **Nome do Projeto:** ImobiPRO Dashboard
  * **Versão do Documento:** 1.0
  * **Data:** 01 de Julho de 2025
  * **Autor:** Gemini AI
  * **Analista (Referência):** Claude AI Assistant
  * **Cliente:** Fernando Riolo
  * **Propósito do Documento:** Este documento detalha os requisitos do produto ImobiPRO Dashboard, servindo como um guia para o desenvolvimento, alinhando a visão, funcionalidades e a stack tecnológica, com base no relatório de análise de Dezembro de 2024.

-----

### 2\. Sumário Executivo

O ImobiPRO Dashboard é um sistema de gestão imobiliária (CRM) concebido como uma aplicação web moderna para profissionais do setor imobiliário. Seu objetivo é centralizar a gestão de propriedades, clientes, agenda, pipeline de vendas e relatórios, automatizando processos e fornecendo análises de performance. O projeto já possui uma arquitetura sólida e funcionalidades básicas implementadas com dados mockados, estando em um estágio maduro para expansão com a integração de dados reais.

-----

### 3\. Visão e Metas do Produto

  * **Visão:** Fornecer uma plataforma completa e intuitiva para otimizar a gestão e as operações de profissionais e agências do mercado imobiliário, tornando-os mais eficientes e data-driven.
  * **Propósito Principal:**
      * Atuar como um sistema CRM especializado para o mercado imobiliário.
      * Oferecer gestão centralizada de propriedades, clientes e relacionamentos.
      * Automatizar processos de vendas e locação.
      * Permitir análise de performance e geração de relatórios gerenciais.
  * **Metas (Próximos Passos Prioritários):**
      * **Q1 2025:** Implementar a estrutura de banco de dados essencial no Supabase (tabelas para usuários, propriedades, contatos, agendamentos, atividades, negociações).
      * **Q1 2025:** Desenvolver e integrar o sistema de autenticação (login/logout, proteção de rotas, gestão de sessões, perfis de usuário).
      * **Q2 2025:** Conectar as páginas já funcionais (Dashboard, Propriedades, Contatos, Agenda) ao Supabase, implementando operações CRUD e upload de imagens.
      * **Q3 2025:** Iniciar o desenvolvimento e integração das funcionalidades avançadas (CRM, Pipeline de vendas, Relatórios com dados reais).

-----

### 4\. Público-Alvo

O ImobiPRO Dashboard é destinado a profissionais do setor imobiliário, incluindo corretores independentes, agentes e pequenas e médias imobiliárias que buscam uma ferramenta robusta para gerenciar suas operações e otimizar seu pipeline de vendas e relacionamento com clientes.

-----

### 5\. Escopo - Funcionalidades Inclusas

#### 5.1. Funcionalidades Atualmente Implementadas (com dados mockados)

  * **Dashboard Principal:**
      * Exibição de métricas em tempo real (total de propriedades, clientes ativos, visitas agendadas, receita mensal).
      * Gráficos de performance (placeholders para vendas e propriedades).
      * Feed de atividades recentes.
      * Ações rápidas (atalhos para funcionalidades principais).
  * **Gestão de Propriedades:**
      * Listagem de propriedades em formato de cards visuais com informações detalhadas.
      * Sistema de filtros por tipo, status e características.
      * Busca avançada por endereço e atributos.
      * Estatísticas (total, disponíveis, vendidas, reservadas).
      * Status de propriedades: Disponível, Vendido, Reservado.
      * Detalhes da propriedade: Quartos, banheiros, área, preço, localização.
  * **Gestão de Contatos:**
      * Listagem de contatos com avatares e informações completas.
      * Categorização: Cliente, Lead (com badges coloridos).
      * Status de contato: Ativo, Novo, Inativo.
      * Informações de contato: Email, telefone, último contato.
      * Ações rápidas: Ligar, Chat, Ver perfil.
      * Busca por nome, email ou telefone.
  * **Sistema de Agenda:**
      * Exibição de compromissos do dia, organizados por horário.
      * Tipos de agendamento: Visita, Reunião.
      * Status: Confirmado, Pendente.
      * Calendário (placeholder para futura implementação).

#### 5.2. Funcionalidades em Desenvolvimento / Planejadas (Atualmente em Template)

  * **CRM:** Sistema de gestão de relacionamento avançado.
  * **Pipeline:** Funil de vendas e oportunidades.
  * **Clientes:** Gestão avançada de clientes (diferente de Contatos).
  * **Relatórios:** Analytics e dashboards avançados com dados reais.
  * **Conexões:** Integrações com sistemas externos.
  * **Usuários:** Gestão de equipe e permissões.
  * **Chats:** Sistema de mensagens integrado.
  * **Lei do Inquilino AI:** Assistente jurídico com inteligência artificial.
  * **Configurações:** Configurações gerais do sistema.

#### 5.3. Backend & Infraestrutura

  * **Supabase Integration:**
      * Criação e configuração de tabelas essenciais (`users`, `properties`, `contacts`, `appointments`, `activities`, `deals`).
      * Implementação de autenticação (login/logout, proteção de rotas, gestão de sessões, perfis de usuário).
      * Desenvolvimento de APIs para operações CRUD (Create, Read, Update, Delete) com o Supabase.
      * Sistema de upload de imagens para propriedades.
      * Validação de dados robusta na camada de API.

-----

### 6\. Escopo - Funcionalidades Fora do Escopo (Considerações Futuras)

  * **Mobile App:** Desenvolvimento de aplicativo nativo via React Native.
  * **Integração WhatsApp Business:** Conexão para comunicação direta.
  * **Portal do Cliente:** Área dedicada para clientes acessarem informações de propriedades e agendamentos.
  * **Assinatura Eletrônica:** Ferramenta integrada para contratos.
  * **Marketplace de Imóveis:** Funcionalidade para listar imóveis publicamente.
  * **IA para Análise de Mercado:** Ferramentas de inteligência artificial para insights de mercado.
  * **Tours Virtuais 360°:** Suporte e integração para tours virtuais de propriedades.
  * **Integrações Externas Adicionais:** CRMs (HubSpot, Salesforce), Portais Imobiliários (ZAP, Viva Real), Sistemas de Pagamento, Google Maps/Street View, Cartórios Digitais.

-----

### 7\. Stack Tecnológica e Arquitetura

#### 7.1. Stack Tecnológica

  * **Frontend Framework:** React 18.3.1, TypeScript 5.5.3, Vite 5.4.1
  * **UI/UX Framework:** shadcn/ui (baseado em Radix UI), Tailwind CSS 3.4.11, Lucide React, Next Themes
  * **Gerenciamento de Estado:** TanStack React Query 5.56.2, React Hook Form 7.53.0, Zod 3.23.8
  * **Backend & Database:** Supabase 2.50.2 (PostgreSQL)
  * **Roteamento & Navegação:** React Router DOM 6.26.2
  * **Visualização de Dados:** Recharts 2.12.7
  * **Desenvolvimento & Qualidade:** ESLint 9.9.0, TypeScript ESLint 8.0.1, Autoprefixer 10.4.20, PostCSS 8.4.47

#### 7.2. Arquitetura do Projeto

  * **Estrutura de Diretórios:**
    ```
    src/
    ├── components/           # Componentes reutilizáveis (ui, layout, common)
    ├── pages/               # Páginas da aplicação
    ├── hooks/               # Custom hooks
    ├── integrations/        # Integrações externas (supabase)
    ├── lib/                 # Utilitários e configurações
    └── assets/              # Recursos estáticos
    ```
  * **Componentes de Layout:** DashboardLayout, AppSidebar, DashboardHeader, PageTemplate.
  * **Sistema de Roteamento:** Configurado com React Router DOM e layout aninhado, incluindo página 404.
  * **Design System:**
      * **Tema Principal:** Dark Mode.
      * **Cores Customizadas:** `imobipro-blue`, `imobipro-blue-light`, `imobipro-blue-dark`, `imobipro-gray`.
      * **Componentes Estilizados:** `imobipro-card` (glassmorphism), `imobipro-gradient`, animações suaves (`transition-smooth`), efeitos hover.
      * **Tipografia:** Fonte Inter (Google Fonts) com `rlig` e `calt` ativadas.

-----

### 8\. Casos de Uso / Histórias de Usuário (Exemplos)

  * **Dashboard:**
      * Como um agente imobiliário, eu quero ver um resumo das minhas propriedades, clientes e agendamentos no dashboard para ter uma visão rápida do meu dia.
      * Como um gerente, eu quero visualizar gráficos de performance de vendas e propriedades para analisar o progresso da equipe.
  * **Gestão de Propriedades:**
      * Como um agente, eu quero adicionar uma nova propriedade com todos os detalhes (quartos, banheiros, área, preço, localização) para mantê-la atualizada no sistema.
      * Como um agente, eu quero filtrar e buscar propriedades por status (disponível, vendida, reservada) e tipo para encontrar rapidamente o que preciso.
  * **Gestão de Contatos:**
      * Como um agente, eu quero categorizar contatos como "Cliente" ou "Lead" para identificar o tipo de relacionamento.
      * Como um agente, eu quero realizar ações rápidas como ligar ou iniciar um chat diretamente da lista de contatos para agilizar a comunicação.
  * **Sistema de Agenda:**
      * Como um agente, eu quero ver meus compromissos do dia organizados por horário para planejar minhas atividades.
      * Como um agente, eu quero agendar novos compromissos, especificando o tipo (visita, reunião) e o status (confirmado, pendente).
  * **Autenticação:**
      * Como um usuário, eu quero realizar login e logout para acessar o sistema de forma segura.
      * Como um administrador, eu quero gerenciar perfis de usuário e permissões para controlar o acesso às funcionalidades.

-----

### 9\. Modelo de Dados (Alto Nível)

As seguintes tabelas essenciais serão criadas no Supabase:

  * `users`: Informações dos usuários do sistema (incluindo perfis e permissões).
  * `properties`: Detalhes das propriedades (endereço, características, status, imagens, etc.).
  * `contacts`: Informações de contatos/leads (nome, email, telefone, categoria, último contato).
  * `appointments`: Detalhes dos agendamentos (data, hora, tipo, status, contato/propriedade associados).
  * `activities`: Log de atividades do usuário (criação/edição de propriedades, contatos, agendamentos).
  * `deals`: Informações de negociações e pipeline de vendas.

-----

### 10\. Considerações de Segurança

#### 10.1. Implementadas

  * Utilização de variáveis de ambiente para credenciais sensíveis.
  * TypeScript para validação de tipos e redução de erros em tempo de desenvolvimento.
  * ESLint para garantir a qualidade e boas práticas de código.

#### 10.2. Pendentes

  * Validação de entrada robusta em todas as APIs.
  * Implementação de *rate limiting* para prevenir ataques de força bruta ou abuso.
  * Criptografia de dados sensíveis armazenados e em trânsito.
  * Auditoria detalhada de ações do usuário para rastreabilidade.
  * Configuração de backup automatizado do banco de dados.

-----

### 11\. Considerações de Performance

  * **Otimização de Carregamento:** Implementar *lazy loading* para páginas e componentes.
  * **Otimização de Ativos:** Otimização de imagens e outros recursos estáticos.
  * **Cache de Dados:** Utilização inteligente do cache com TanStack React Query para dados de API.

-----

### 12\. Métricas de Sucesso

  * **Taxa de Conclusão de Funcionalidades:** Medir o percentual de funcionalidades planejadas que são entregues por sprint/fase.
  * **Adoção do Usuário:** Monitorar o número de usuários ativos e a frequência de uso das funcionalidades principais.
  * **Precisão dos Dados:** Avaliar a consistência e acurácia dos dados armazenados e exibidos.
  * **Performance:** Monitorar o tempo de carregamento das páginas e a responsividade da interface.
  * **Feedback do Usuário:** Coletar e analisar o feedback dos usuários para identificar melhorias e novas necessidades.

-----

### 13\. Premissas e Restrições

  * **Premissas:**
      * O Supabase será a plataforma Backend-as-a-Service principal para banco de dados e autenticação.
      * A equipe de desenvolvimento terá acesso e familiaridade com a stack tecnológica definida.
      * Os dados mockados nas páginas funcionais serão substituídos por dados reais do Supabase.
  * **Restrições:**
      * O escopo inicial foca na aplicação web; o desenvolvimento mobile é uma fase futura.
      * O projeto está em estágio inicial de integração com o banco de dados real.

-----

### 14\. Perguntas Abertas / A Serem Determinadas (TBDs)

  * Definição detalhada dos atributos para cada tabela do Supabase (e.g., campos específicos para `properties`, `contacts`).
  * Requisitos específicos para as funcionalidades avançadas (CRM, Pipeline, Relatórios), incluindo fluxos de trabalho e visualizações.
  * Estratégia para a "Lei do Inquilino AI" – quais as fontes de dados e funcionalidades específicas de IA.
  * Requisitos de integração para sistemas externos (e.g., quais portais imobiliários serão priorizados).
  * Detalhes sobre o sistema de permissões de usuário (níveis de acesso, o que cada nível pode fazer).
  * Plano de testes (unitários, integração, end-to-end) e ferramentas a serem utilizadas além do ESLint.

-----