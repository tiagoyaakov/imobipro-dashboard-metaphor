# 🚀 Guia de Deploy - ImobiPRO Dashboard

Este documento detalha o processo para fazer o deploy (publicação) da aplicação ImobiPRO Dashboard. O projeto é construído como uma **Single Page Application (SPA)** usando React e Vite, o que o torna altamente portátil.

**Resultado do Build:** O comando `pnpm build` gera uma pasta `dist/` que contém todos os arquivos estáticos (HTML, CSS, JavaScript) necessários para rodar a aplicação. O objetivo do deploy é hospedar o conteúdo desta pasta em um servidor web.

---

## Opção 1: Deploy na Vercel (Recomendado e Pré-configurado)

A Vercel é a plataforma recomendada para este projeto, pois oferece performance, segurança e um processo de deploy automatizado. O projeto já contém configurações otimizadas para a Vercel.

### Passos para o Deploy na Vercel

1.  **Conecte seu Repositório Git:**
    *   Crie uma conta na [Vercel](https://vercel.com).
    *   Crie um novo projeto e conecte-o ao seu repositório do GitHub, GitLab ou Bitbucket.

2.  **Configure o Projeto na Vercel:**
    *   **Framework Preset:** A Vercel deve detectar automaticamente que é um projeto **Vite**.
    *   **Build & Output Settings:**
        *   **Build Command:** `pnpm build`
        *   **Output Directory:** `dist`
        *   **Install Command:** `pnpm install`
    *   **Environment Variables:** Adicione as variáveis de ambiente necessárias (como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) no painel de configurações do seu projeto na Vercel.

3.  **Deploy:**
    *   A Vercel fará o deploy automaticamente a cada `push` na branch principal (`main`).
    *   Para um deploy manual, use o Vercel CLI: `npx vercel --prod`.

### Configuração Avançada (Opcional)

Na pasta `hosting-examples/`, você encontrará o arquivo `vercel.json.example`. Se desejar aplicar configurações avançadas de headers, cache ou redirects, você pode renomear este arquivo para `vercel.json` na raiz do projeto e personalizá-lo.

---

## Opção 2: Deploy em Outras Plataformas (Hostinger, Servidor Próprio, etc.)

Você pode hospedar este projeto em qualquer servidor web que suporte Node.js para o processo de build. O conceito principal é o seguinte:

1.  **Gerar os arquivos do projeto:** Rodar `pnpm build` para criar a pasta `dist/`.
2.  **Copiar os arquivos:** Enviar o conteúdo da pasta `dist/` para o seu servidor.
3.  **Configurar o servidor:** Garantir que o servidor consiga lidar com o roteamento de uma SPA.

### Passo a Passo Genérico

1.  **Faça o Build do Projeto:**
    *   No seu ambiente de desenvolvimento ou em um servidor com Node.js instalado, execute:
    ```bash
    pnpm install
    pnpm build
    ```

2.  **Envie os Arquivos para o Servidor:**
    *   Copie **todo o conteúdo** da pasta `dist/` para a pasta raiz do seu site no servidor de hospedagem (geralmente `public_html`, `www`, ou similar). Você pode usar FTP (FileZilla), SCP, ou o gerenciador de arquivos do seu provedor.

3.  **Configure o Redirecionamento (Passo CRÍTICO):**
    *   Como este é um Single Page Application, o servidor precisa ser instruído a sempre servir o arquivo `index.html`, não importa qual URL o usuário acesse (ex: `/propriedades`, `/contatos`). Isso permite que o React Router gerencie as rotas no lado do cliente.
    *   **Se você não fizer isso, receberá erros 404 ao tentar acessar qualquer página diretamente.**

    #### Exemplo para Servidores **Apache** (comum em cPanel, Hostinger):
    *   Crie um arquivo chamado `.htaccess` na mesma pasta onde você colocou os arquivos da `dist/` e adicione o seguinte conteúdo:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```

    #### Exemplo para Servidores **Nginx**:
    *   Você precisará editar o arquivo de configuração do seu site (geralmente em `/etc/nginx/sites-available/`). Na seção `server`, adicione ou modifique o bloco `location`:
    ```nginx
    location / {
      # Tenta servir o arquivo requisitado, depois o diretório, e se não encontrar,
      # redireciona para o index.html para o React Router funcionar.
      try_files $uri $uri/ /index.html;
    }
    ```

4.  **Verifique as Variáveis de Ambiente:**
    *   O projeto usa variáveis de ambiente com o prefixo `VITE_`. O processo de build (`pnpm build`) substitui essas variáveis pelos seus valores reais no código final.
    *   Certifique-se de que o seu ambiente de build tenha acesso a um arquivo `.env` com as variáveis corretas antes de executar o comando. 