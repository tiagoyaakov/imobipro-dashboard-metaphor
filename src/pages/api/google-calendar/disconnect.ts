// =====================================================
// API: DESCONECTAR GOOGLE CALENDAR
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { googleCalendarAuth } from '@/integrations/google-calendar/auth';
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

    // TODO: Verificar se usuário tem tokens válidos
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { googleRefreshToken: true, googleTokenExpiry: true }
    // });

    // if (!user?.googleRefreshToken) {
    //   return res.status(401).json({
    //     error: 'Not authenticated',
    //     message: 'Usuário não tem Google Calendar conectado'
    //   });
    // }

    // Configurar credenciais com refresh token para revogar
    // await googleCalendarAuth.setCredentialsFromRefreshToken(user.googleRefreshToken);

    // Mock para teste - assumir que está autenticado
    console.log('Desconectando Google Calendar para usuário:', userId);

    // Revogar tokens
    await googleCalendarAuth.revokeTokens();

    // TODO: Limpar tokens do banco de dados
    // await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     googleRefreshToken: null,
    //     googleAccessToken: null,
    //     googleTokenExpiry: null,
    //     googleCalendarId: null
    //   }
    // });

    // Retornar sucesso
    res.status(200).json({
      success: true,
      message: 'Google Calendar desconectado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desconectar Google Calendar:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha ao desconectar: ${errorMessage}`
    });
  }
} 