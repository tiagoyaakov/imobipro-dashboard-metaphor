import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleCalendarSync } from '@/integrations/google-calendar/sync';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { direction = 'bidirectional' } = req.body;
    
    // Validar direção da sincronização
    if (!['bidirectional', 'to-google', 'from-google'].includes(direction)) {
      return res.status(400).json({ 
        error: 'Invalid direction. Use: bidirectional, to-google, or from-google' 
      });
    }

    const sync = new GoogleCalendarSync();
    const result = await sync.syncAppointments(session.user.id, direction);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error syncing appointments:', error);
    return res.status(500).json({ 
      error: 'Failed to sync appointments' 
    });
  }
} 