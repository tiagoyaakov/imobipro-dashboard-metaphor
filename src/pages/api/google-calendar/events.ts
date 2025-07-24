// =====================================================
// API: LISTAR EVENTOS GOOGLE CALENDAR
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

    // Extrair parâmetros dos query parameters
    const { 
      userId, 
      calendarId = 'primary',
      timeMin,
      timeMax,
      maxResults = '10',
      q 
    } = req.query;

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
    console.log('Listando eventos para usuário:', userId, 'calendário:', calendarId);

    // Criar cliente do Google Calendar
    const client = createGoogleCalendarClient(googleCalendarAuth);

    // Preparar parâmetros de busca
    const params: Record<string, unknown> = {
      singleEvents: true,
      orderBy: 'startTime'
    };

    if (timeMin) params.timeMin = timeMin;
    if (timeMax) params.timeMax = timeMax;
    if (maxResults) params.maxResults = parseInt(maxResults as string);
    if (q) params.q = q;

    // Listar eventos
    const events = await client.listEvents(calendarId as string, params);

    // Retornar eventos
    res.status(200).json({
      success: true,
      events: events.map(event => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        status: event.status,
        htmlLink: event.htmlLink,
        attendees: event.attendees,
        reminders: event.reminders,
        created: event.created,
        updated: event.updated
      }))
    });

  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    res.status(500).json({
      error: 'Internal server error',
      message: `Falha ao listar eventos: ${errorMessage}`
    });
  }
} 