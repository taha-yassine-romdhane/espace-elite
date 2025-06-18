import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import type { Notification } from '@prisma/client';
import { NotificationStatus } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Notification | { error: string } | { message: string }>
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    // GET - Fetch notification
    if (req.method === 'GET') {
      const notification = await prisma.notification.findUnique({
        where: { id },
        include: { user: true, patient: true, company: true }
      });
      return notification
        ? res.status(200).json(notification)
        : res.status(404).json({ error: 'Notification not found' });
    }

    // PUT - Update notification
    if (req.method === 'PUT') {
      const { status }: { status?: NotificationStatus } = req.body;
      
      if (!status || !Object.values(NotificationStatus).includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { status }
      });
      return res.status(200).json(updated);
    }

    // DELETE - Remove notification
    if (req.method === 'DELETE') {
      await prisma.notification.delete({ where: { id } });
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
