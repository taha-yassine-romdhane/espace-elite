import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET request to fetch notifications
  if (req.method === 'GET') {
    try {
      const { type = 'all' } = req.query;
      
      // Mock data for now - in a real implementation, this would query the database
      const allNotifications = [
        {
          id: '1',
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
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        },
        {
          id: '2',
          title: 'Résultat d\'électrocardiogramme en retard',
          description: 'Le résultat d\'électrocardiogramme pour Fatima Trabelsi est en retard',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          status: 'PENDING',
          priority: 'HIGH',
          type: 'DIAGNOSTIC_RESULT',
          deviceId: 'dev-002',
          deviceName: 'Appareil ECG CardioPlus',
          patientId: 'pat-002',
          patientName: 'Fatima Trabelsi',
          parameterId: 'param-002',
          parameterName: 'Résultat d\'électrocardiogramme',
          dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
        },
        {
          id: '3',
          title: 'Maintenance du respirateur artificiel',
          description: 'Tâche de maintenance programmée pour le respirateur artificiel',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          status: 'PENDING',
          priority: 'HIGH',
          type: 'TASK',
          taskId: 'task-001',
          assigneeId: 'tech-001',
          assigneeName: 'Ahmed Technicien',
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), // In 2 days
        },
        {
          id: '4',
          title: 'Réparation du moniteur cardiaque',
          description: 'Réparation en cours pour le moniteur cardiaque de la chambre 203',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          type: 'REPAIR',
          deviceId: 'dev-003',
          deviceName: 'Moniteur cardiaque BedSide',
          repairId: 'rep-001',
          technicianId: 'tech-002',
          technicianName: 'Sami Réparateur',
        },
      ];

      // Filter notifications based on type
      let filteredNotifications = allNotifications;
      if (type !== 'all') {
        const typeMap: Record<string, string> = {
          'diagnostic': 'DIAGNOSTIC_RESULT',
          'task': 'TASK',
          'repair': 'REPAIR'
        };
        
        const notificationType = typeMap[type as string];
        if (notificationType) {
          filteredNotifications = allNotifications.filter(
            notification => notification.type === notificationType
          );
        }
      }

      // In a real implementation, this would be something like:
      /*
      const where: any = {};
      
      if (type !== 'all') {
        const typeMap: Record<string, string> = {
          'diagnostic': 'DIAGNOSTIC_RESULT',
          'task': 'TASK',
          'repair': 'REPAIR'
        };
        
        const notificationType = typeMap[type as string];
        if (notificationType) {
          where.type = notificationType;
        }
      }
      
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          // Include related data based on notification type
        }
      });
      */

      return res.status(200).json(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Error fetching notifications' });
    }
  }

  // Handle POST request to create a new notification
  if (req.method === 'POST') {
    try {
      const { title, description, type, priority, ...additionalData } = req.body;

      if (!title || !description || !type) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // In a real implementation, this would create a notification in the database
      /*
      const notification = await prisma.notification.create({
        data: {
          title,
          description,
          type,
          priority: priority || 'MEDIUM',
          status: 'PENDING',
          ...additionalData
        }
      });
      */

      const notification = {
        id: Math.random().toString(36).substring(2, 9),
        title,
        description,
        type,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        ...additionalData
      };

      return res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Error creating notification' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
