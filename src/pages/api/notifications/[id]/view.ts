import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: 'COMPLETED'
      }
    });

    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}