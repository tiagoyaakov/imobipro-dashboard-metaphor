#!/usr/bin/env node

/**
 * 📧 SCRIPT DE CONFIGURAÇÃO DE EMAIL PARA PRODUÇÃO
 * 
 * Este script automatiza a configuração do sistema de email do ImobiPRO
 * para produção usando a API do Supabase.
 * 
 * Uso: node scripts/setup-production-email.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do projeto
const PROJECT_CONFIG = {
  projectRef: 'eeceyvenrnyyqvilezgr',
  dashboardUrl: 'https://supabase.com/dashboard/project/eeceyvenrnyyqvilezgr',
  productionUrl: 'https://imobipro-brown.vercel.app',
  developmentUrl: 'http://localhost:5173'
};

// Templates de email
const EMAIL_TEMPLATES = {
  invite: {
    subject: 'Bem-vindo ao ImobiPRO - Crie sua senha',
    bodyPath: path.join(__dirname, '../email-templates/invite-user.html')
  }
};

// Provedores de email suportados
const EMAIL_PROVIDERS = {
  resend: {
    name: 'Resend',
    host: 'smtp.resend.com',
    port: 587,
    username: 'resend',
    documentation: 'https://resend.com/docs/send-with-supabase-smtp'
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    username: 'apikey',
    documentation: 'https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp'
  },
  ses: {
    name: 'AWS SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    documentation: 'https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html'
  }
};

/**
 * Exibe as informações de configuração
 */
function displayConfiguration() {
  console.log('📧 CONFIGURAÇÃO DE EMAIL PARA PRODUÇÃO - IMOBIPRO');
  console.log('=' .repeat(60));
  console.log();
  
  console.log('🎯 INFORMAÇÕES DO PROJETO:');
  console.log(`   Project Ref: ${PROJECT_CONFIG.projectRef}`);
  console.log(`   Dashboard: ${PROJECT_CONFIG.dashboardUrl}`);
  console.log(`   Produção: ${PROJECT_CONFIG.productionUrl}`);
  console.log();
  
  console.log('📋 PASSOS NECESSÁRIOS:');
  console.log();
  
  console.log('1️⃣  CONFIGURAR PROVEDOR DE EMAIL');
  console.log('   Escolha um dos provedores abaixo:');
  console.log();
  
  Object.entries(EMAIL_PROVIDERS).forEach(([key, provider]) => {
    console.log(`   🔹 ${provider.name}`);
    console.log(`      Host: ${provider.host}`);
    console.log(`      Port: ${provider.port}`);
    console.log(`      Username: ${provider.username}`);
    console.log(`      Docs: ${provider.documentation}`);
    console.log();
  });
  
  console.log('2️⃣  CONFIGURAR SMTP NO SUPABASE');
  console.log(`   📍 Acessar: ${PROJECT_CONFIG.dashboardUrl}/settings/auth`);
  console.log('   - Habilitar "Enable custom SMTP"');
  console.log('   - Preencher dados do provedor escolhido');
  console.log('   - Definir "From Email" (ex: noreply@seudominio.com.br)');
  console.log('   - Definir "From Name" como "ImobiPRO"');
  console.log();
  
  console.log('3️⃣  CONFIGURAR TEMPLATES');
  console.log(`   📍 Acessar: ${PROJECT_CONFIG.dashboardUrl}/auth/templates`);
  console.log('   - Copiar template HTML personalizado (veja abaixo)');
  console.log('   - Configurar assunto como: "Bem-vindo ao ImobiPRO - Crie sua senha"');
  console.log();
  
  console.log('4️⃣  CONFIGURAR URLS');
  console.log(`   📍 Acessar: ${PROJECT_CONFIG.dashboardUrl}/auth/url-configuration`);
  console.log(`   - Site URL: ${PROJECT_CONFIG.productionUrl}`);
  console.log(`   - Redirect URLs: ${PROJECT_CONFIG.productionUrl}/reset-password/**`);
  console.log();
  
  console.log('5️⃣  AJUSTAR RATE LIMITS');
  console.log(`   📍 Acessar: ${PROJECT_CONFIG.dashboardUrl}/auth/rate-limits`);
  console.log('   - Email rate limit: 100 por hora (ajustar conforme necessidade)');
  console.log('   - OTP rate limit: 60 por hora');
  console.log();
}

/**
 * Exibe o template de email
 */
function displayEmailTemplate() {
  console.log('📧 TEMPLATE DE EMAIL PERSONALIZADO:');
  console.log('=' .repeat(60));
  console.log();
  
  const templatePath = EMAIL_TEMPLATES.invite.bodyPath;
  
  if (fs.existsSync(templatePath)) {
    const template = fs.readFileSync(templatePath, 'utf8');
    console.log('✅ Template encontrado em:', templatePath);
    console.log();
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Copie o conteúdo HTML abaixo');
    console.log('2. Cole no campo "Message (HTML)" no Dashboard do Supabase');
    console.log('3. Configure o assunto como:', EMAIL_TEMPLATES.invite.subject);
    console.log();
    console.log('🔗 HTML TEMPLATE:');
    console.log('-' .repeat(60));
    console.log(template);
    console.log('-' .repeat(60));
  } else {
    console.log('❌ Template não encontrado em:', templatePath);
    console.log('   Execute este script a partir da raiz do projeto');
  }
}

/**
 * Exibe comandos para deploy da Edge Function
 */
function displayEdgeFunctionCommands() {
  console.log('🚀 COMANDOS PARA DEPLOY DA EDGE FUNCTION:');
  console.log('=' .repeat(60));
  console.log();
  
  console.log('📁 PREPARAR EDGE FUNCTION:');
  console.log('   cd supabase/functions/send-user-invite');
  console.log();
  
  console.log('🚀 DEPLOY:');
  console.log(`   supabase functions deploy send-user-invite --project-ref ${PROJECT_CONFIG.projectRef}`);
  console.log();
  
  console.log('🔐 CONFIGURAR SECRETS:');
  console.log(`   supabase secrets set RESEND_API_KEY=re_XXXXXXXX --project-ref ${PROJECT_CONFIG.projectRef}`);
  console.log(`   supabase secrets set PUBLIC_SITE_URL=${PROJECT_CONFIG.productionUrl} --project-ref ${PROJECT_CONFIG.projectRef}`);
  console.log();
  
  console.log('🧪 TESTAR:');
  console.log('   curl -X POST \\');
  console.log(`     \'https://${PROJECT_CONFIG.projectRef}.supabase.co/functions/v1/send-user-invite\' \\`);
  console.log('     -H \'Authorization: Bearer [SEU_ACCESS_TOKEN]\' \\');
  console.log('     -H \'Content-Type: application/json\' \\');
  console.log('     -d \'{"email":"teste@exemplo.com","name":"Teste","userId":"uuid"}\'');
  console.log();
}

/**
 * Exibe checklist final
 */
function displayChecklist() {
  console.log('✅ CHECKLIST DE PRODUÇÃO:');
  console.log('=' .repeat(60));
  console.log();
  
  const checklist = [
    'Provedor de email configurado (Resend/SendGrid/SES)',
    'SMTP configurado no Supabase Dashboard',
    'Template de email personalizado aplicado',
    'URLs de redirecionamento configuradas',
    'Rate limits ajustados para produção',
    'Edge Function deployada (opcional)',
    'Secrets configuradas (se usando Edge Function)',
    'Teste completo do fluxo de convite',
    'Monitoramento configurado',
    'Domínio verificado com SPF/DKIM (recomendado)'
  ];
  
  checklist.forEach((item, index) => {
    console.log(`   [ ] ${index + 1}. ${item}`);
  });
  
  console.log();
  console.log('🎉 APÓS COMPLETAR O CHECKLIST:');
  console.log('   ✅ Sistema de convites totalmente funcional');
  console.log('   ✅ Emails profissionais com branding ImobiPRO');
  console.log('   ✅ Alta entregabilidade com provedor dedicado');
  console.log('   ✅ Escalabilidade para milhares de usuários');
  console.log();
}

/**
 * Função principal
 */
function main() {
  console.clear();
  
  displayConfiguration();
  displayEmailTemplate();
  displayEdgeFunctionCommands();
  displayChecklist();
  
  console.log('📚 DOCUMENTAÇÃO ADICIONAL:');
  console.log('   - CONFIGURACAO_EMAIL_PRODUCAO.md (guia completo)');
  console.log('   - SISTEMA_CONVITE_EMAIL_USUARIOS.md (implementação)');
  console.log();
  
  console.log('💡 DICA: Execute este script sempre que precisar das instruções!');
  console.log();
}

// Executar script
main();

export {
  PROJECT_CONFIG,
  EMAIL_TEMPLATES,
  EMAIL_PROVIDERS
};