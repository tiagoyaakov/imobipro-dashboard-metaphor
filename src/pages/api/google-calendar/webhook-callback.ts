import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleCalendarWebhooks } from '@/integrations/google-calendar/webhooks';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhooks = new GoogleCalendarWebhooks();
    
    // Processar a notificação do webhook
    const result = await webhooks.processNotification(req.body);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing webhook notification:', error);
    return res.status(500).json({ 
      error: 'Failed to process webhook notification' 
    });
  }
} 