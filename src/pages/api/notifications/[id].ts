import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  // Handle GET request to fetch a specific notification
  if (req.method === 'GET') {
    try {
      // In a real implementation, this would query the database
      // For now, we'll just return mock data
      const notification = {
        id,
        title: 'Résultat d\'échographie en attente',
        description: 'Le résultat d\'échographie pour Mohamed Ben Ali est attendu',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        status: 'PENDING',
        priority: 'MEDIUM',
        type: 'DIAGNOSTIC_RESULT',
        deviceId: 'dev-001',
        deviceName: 'Scanner à ultrasons XYZ',
        patientId: 'pat-001',
        patientName: 'Mohamed Ben Ali',
        parameterId: 'param-001',
        parameterName: 'Résultat d\'échographie',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      };

      return res.status(200).json(notification);
    } catch (error) {
      console.error('Error fetching notification:', error);
      return res.status(500).json({ message: 'Error fetching notification' });
    }
  }

  // Handle PUT request to update a notification
  if (req.method === 'PUT') {
    try {
      const { status, ...updateData } = req.body;

      // In a real implementation, this would update the database
      /*
      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: {
          status,
          ...updateData,
          updatedAt: new Date()
        }
      });
      */

      const updatedNotification = {
        id,
        status: status || 'PENDING',
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json(updatedNotification);
    } catch (error) {
      console.error('Error updating notification:', error);
      return res.status(500).json({ message: 'Error updating notification' });
    }
  }

  // Handle DELETE request to delete a notification
  if (req.method === 'DELETE') {
    try {
      // In a real implementation, this would delete from the database
      /*
      await prisma.notification.delete({
        where: { id }
      });
      */

      return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ message: 'Error deleting notification' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
