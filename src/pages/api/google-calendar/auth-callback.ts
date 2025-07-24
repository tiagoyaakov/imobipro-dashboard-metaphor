// =====================================================
// API: CALLBACK DE AUTENTICAÇÃO GOOGLE CALENDAR
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { processAuthCallback } from '@/integrations/google-calendar/auth';
import { validateGoogleCalendarConfig } from '@/integrations/google-calendar/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Apenas requisições POST são permitidas'
    });
  }

  try {
    // Validar configuração do Google Calendar
    if (!validateGoogleCalendarConfig()) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Configuração do Google Calendar incompleta'
      });
    }

    // Extrair dados do corpo da requisição
    const { code, userId } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'code é obrigatório'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'userId é obrigatório'
      });
    }

    // Processar callback de autenticação
    const tokens = await processAuthCallback(code, userId);

    // TODO: Salvar tokens no banco de dados
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     googleRefreshToken: tokens.refresh_token,
    //     googleAccessToken: tokens.access_token,
    //     googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
    //   }
    // });

    // Retornar sucesso
    res.status(200).json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      tokens: {
        access_token: tokens.access_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date
      }
    });

  } catch (error) {
    console.error('Erro no callback de autenticação:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha na autenticação: ${errorMessage}`
    });
  }
} 