import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  // Only allow PUT requests to mark a notification as viewed
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // In a real implementation, this would update the database
    /*
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        viewedAt: new Date()
      }
    });
    */

    const updatedNotification = {
      id,
      status: 'COMPLETED',
      viewedAt: new Date().toISOString()
    };

    return res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as viewed:', error);
    return res.status(500).json({ message: 'Error marking notification as viewed' });
  }
}