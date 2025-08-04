import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  name: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Criar cliente Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar se usuário tem permissão (DEV_MASTER ou ADMIN)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Token inválido');
    }

    // Buscar role do usuário
    const { data: userData, error: roleError } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || !userData || !['DEV_MASTER', 'ADMIN'].includes(userData.role)) {
      throw new Error('Sem permissão para criar usuários');
    }

    // Pegar dados da requisição
    const { email, name, userId } = await req.json() as RequestBody;

    if (!email || !name || !userId) {
      throw new Error('Dados incompletos');
    }

    // Gerar link de convite usando Admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        data: {
          name: name,
          invited_at: new Date().toISOString(),
        },
      },
    });

    if (inviteError) {
      throw new Error(`Erro ao gerar convite: ${inviteError.message}`);
    }

    // Enviar email usando Resend (ou outro provedor)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo ao ImobiPRO</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #3b82f6; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao ImobiPRO!</h1>
          </div>
          <div class="content">
            <h2>Olá ${name},</h2>
            <p>Você foi convidado para acessar o sistema ImobiPRO - a plataforma completa para gestão imobiliária.</p>
            <p>Para começar, você precisa criar sua senha de acesso:</p>
            <center>
              <a href="${inviteData.properties?.action_link}" class="button">Criar Minha Senha</a>
            </center>
            <p><strong>Este link é válido por 24 horas.</strong></p>
            <p>Após criar sua senha, você poderá acessar o sistema com seu email e a senha escolhida.</p>
            <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou este acesso, pode ignorar este email com segurança.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 ImobiPRO. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar Resend (ou outro provedor)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (RESEND_API_KEY) {
      // Enviar via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ImobiPRO <noreply@imobipro.com.br>',
          to: [email],
          subject: 'Bem-vindo ao ImobiPRO - Crie sua senha',
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.text();
        console.error('Erro ao enviar email:', error);
        throw new Error('Erro ao enviar email de convite');
      }
    } else {
      // Fallback: usar o sistema de email do Supabase
      const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${Deno.env.get('PUBLIC_SITE_URL')}/reset-password`,
      });

      if (emailError) {
        throw new Error(`Erro ao enviar email: ${emailError.message}`);
      }
    }

    // Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de convite enviado com sucesso',
        email: email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Não autorizado' ? 401 : 400,
      }
    );
  }
});