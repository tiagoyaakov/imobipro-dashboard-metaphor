import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleCalendarWebhooks } from '@/integrations/google-calendar/webhooks';
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

    const { calendarId, webhookUrl } = req.body;

    if (!calendarId || !webhookUrl) {
      return res.status(400).json({ 
        error: 'calendarId and webhookUrl are required' 
      });
    }

    const webhooks = new GoogleCalendarWebhooks();
    const result = await webhooks.setupWebhook(
      session.user.id,
      calendarId,
      webhookUrl
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error setting up webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to setup webhook' 
    });
  }
} 