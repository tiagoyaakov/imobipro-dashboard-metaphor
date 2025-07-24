// =====================================================
// API: LISTAR CALENDÁRIOS GOOGLE CALENDAR
// =====================================================

import { NextApiRequest, NextApiResponse } from 'next';
import { createGoogleCalendarClient } from '@/integrations/google-calendar/client';
import { googleCalendarAuth } from '@/integrations/google-calendar/auth';
import { validateGoogleCalendarConfig } from '@/integrations/google-calendar/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar método HTTP
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Apenas requisições GET são permitidas'
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

    // Extrair userId dos query parameters
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
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
    console.log('Listando calendários para usuário:', userId);

    // Criar cliente do Google Calendar
    const client = createGoogleCalendarClient(googleCalendarAuth);

    // Listar calendários
    const calendars = await client.listCalendars();

    // Retornar calendários
    res.status(200).json({
      success: true,
      calendars: calendars.map(calendar => ({
        id: calendar.id,
        summary: calendar.summary,
        description: calendar.description,
        primary: calendar.primary,
        accessRole: calendar.accessRole,
        backgroundColor: calendar.backgroundColor,
        foregroundColor: calendar.foregroundColor,
        selected: calendar.selected,
        timeZone: calendar.timeZone
      }))
    });

  } catch (error) {
    console.error('Erro ao listar calendários:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha ao listar calendários: ${errorMessage}`
    });
  }
} 