// =====================================================
// API: SINCRONIZAR AGENDAMENTO COM GOOGLE CALENDAR
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { createGoogleCalendarSync } from '@/integrations/google-calendar/sync';
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

    // Extrair dados do corpo da requisição
    const { appointmentId, userId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'appointmentId é obrigatório'
      });
    }

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

    // Configurar credenciais com refresh token
    // await googleCalendarAuth.setCredentialsFromRefreshToken(user.googleRefreshToken);

    // Mock para teste - assumir que está autenticado
    console.log('Sincronizando agendamento:', appointmentId, 'para usuário:', userId);

    // Criar instância de sincronização
    const sync = createGoogleCalendarSync(googleCalendarAuth);

    // Sincronizar agendamento
    const result = await sync.syncAppointmentToGoogle(appointmentId);

    // Retornar resultado
    res.status(200).json({
      success: true,
      message: result ? 'Agendamento sincronizado com sucesso' : 'Agendamento já sincronizado',
      synced: result
    });

  } catch (error) {
    console.error('Erro na sincronização de agendamento:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha na sincronização: ${errorMessage}`
    });
  }
} 