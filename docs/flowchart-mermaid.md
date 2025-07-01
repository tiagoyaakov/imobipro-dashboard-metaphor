graph TD
    %% Definição dos Subgraphs para organizar o fluxo
    subgraph Usuário
        A[Início: Acessa ImobiPRO]
    end

    subgraph Frontend (Aplicação Web React/TypeScript)
        direction LR
        B(Login / Registro)
        C(Dashboard Principal)
        D(Gestão de Propriedades)
        E(Gestão de Contatos)
        F(Sistema de Agenda)
        G(Módulos em Desenvolvimento: CRM, Pipeline, Relatórios, etc.)
    end

    subgraph Backend (Serviços API - Supabase/Node.js c/ Prisma)
        direction LR
        H[Serviço de Autenticação]
        I[Serviço de Propriedades]
        J[Serviço de Contatos]
        K[Serviço de Agendamentos]
        L[Serviço de Dashboard / Métricas]
        M[Serviço de Gestão de Negócios (Deals)]
        N[Serviço de Atividades]
        O[Outros Serviços (CRM, Usuários, etc.)]
    end

    subgraph Database (Supabase PostgreSQL + Prisma ORM)
        P[Tabela: User]
        Q[Tabela: Property]
        R[Tabela: Contact]
        S[Tabela: Appointment]
        T[Tabela: Deal]
        U[Tabela: Activity]
    end

    %% Fluxos Principais

    %% 1. Fluxo de Autenticação
    A -- Entrar / Registrar --> B
    B -- Credenciais (Email, Senha) --> H
    H -- Consultar/Atualizar --> P
    H -- Retorna Token / Sucesso --> B
    B -- Redireciona --> C

    %% 2. Fluxo do Dashboard
    C -- 1. Solicita Métricas/Atividades --> L
    L -- Consulta Dados: [Properties, Contacts, Appointments, Deals, Activities] --> Q & R & S & T & U
    L -- Agrega e Retorna --> C

    %% 3. Fluxo de Gestão de Propriedades
    C -- 2. Navega para --> D
    D -- Solicita: Listar, Filtrar, Buscar Propriedades --> I
    I -- CRUD: CREATE, READ, UPDATE, DELETE --> Q
    I -- 3. Notifica --> N
    N -- Registra --> U
    I -- Retorna Dados --> D

    %% 4. Fluxo de Gestão de Contatos
    C -- 3. Navega para --> E
    E -- Solicita: Listar, Filtrar, Buscar Contatos --> J
    J -- CRUD: CREATE, READ, UPDATE, DELETE --> R
    J -- 4. Notifica --> N
    N -- Registra --> U
    J -- Retorna Dados --> E

    %% 5. Fluxo de Sistema de Agenda
    C -- 4. Navega para --> F
    F -- Solicita: Listar Agendamentos --> K
    K -- CRUD: CREATE, READ, UPDATE, DELETE --> S
    K -- 5. Notifica --> N
    N -- Registra --> U
    K -- Retorna Dados --> F

    %% 6. Fluxo de Módulos em Desenvolvimento (Exemplo: Pipeline)
    C -- 5. Navega para --> G
    G -- Solicita: Gerenciar Negócios (Deals) --> M
    M -- CRUD: CREATE, READ, UPDATE, DELETE --> T
    M -- 6. Notifica --> N
    N -- Registra --> U
    M -- Retorna Dados --> G

    %% Conexões entre serviços e tabelas do banco de dados (Implícitas via CRUD)
    H -- Gerencia Usuários --> P
    I -- Gerencia Propriedades --> Q
    J -- Gerencia Contatos --> R
    K -- Gerencia Agendamentos --> S
    M -- Gerencia Negócios --> T
    N -- Registra Atividades --> U