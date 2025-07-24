// =====================================================
// API: GERAR URL DE AUTENTICAÇÃO GOOGLE CALENDAR
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { generateAuthUrlWithValidation } from '@/integrations/google-calendar/auth';
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

    // Extrair userId do corpo da requisição
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'userId é obrigatório'
      });
    }

    // Gerar URL de autenticação
    const authData = await generateAuthUrlWithValidation(userId);

    // Retornar URL de autenticação
    res.status(200).json({
      success: true,
      authUrl: authData.authUrl,
      state: authData.state
    });

  } catch (error) {
    console.error('Erro ao gerar URL de autenticação:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha ao gerar URL de autenticação: ${errorMessage}`
    });
  }
} 