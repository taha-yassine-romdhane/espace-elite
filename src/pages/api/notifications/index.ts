import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import type { Notification } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { type = 'all', status, startDate, endDate } = req.query;

      // Build query conditions
      const where: any = {
        userId: session.user.id
      };

      // Filter by type if specified
      if (type !== 'all') {
        const typeMap: Record<string, string> = {
          'diagnostic': 'FOLLOW_UP',  // Map diagnostic to FOLLOW_UP type
          'task': 'MAINTENANCE',
          'repair': 'MAINTENANCE',
          'payment': 'PAYMENT_DUE',
          'other': 'OTHER',
          'appointment': 'APPOINTMENT'
        };

        const notificationType = typeMap[type as string];
        if (notificationType) {
          where.type = notificationType;
        }
      }

      // Filter by status if specified
      if (status) {
        where.status = status;
      }

      // Filter by date range if specified
      if (startDate && endDate) {
        where.dueDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        };
      }

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          patient: true,
          company: true
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Format the response
      const formattedNotifications = notifications.map(notification => {
        // Parse the message field if it contains JSON data
        let additionalData = {};
        try {
          if (notification.message) {
            const parsedMessage = JSON.parse(notification.message);
            if (typeof parsedMessage === 'object') {
              additionalData = parsedMessage;
            }
          }
        } catch  {
          // If parsing fails, just use the message as is
        }

        return {
          id: notification.id,
          title: notification.title,
          description: notification.message,
          type: notification.type,
          status: notification.status,
          dueDate: notification.dueDate,
          createdAt: notification.createdAt,
          updatedAt: notification.updatedAt,
          patientId: notification.patientId,
          patientName: notification.patient ? `${notification.patient.firstName} ${notification.patient.lastName}` : null,
          companyId: notification.companyId,
          companyName: notification.company ? notification.company.companyName : null,
          ...additionalData
        };
      });

      return res.status(200).json(formattedNotifications);
    }

    if (req.method === 'POST') {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { 
        title, 
        message, 
        type, 
        status = 'PENDING',
        dueDate,
        patientId,
        companyId,
        // For diagnostic result parameters
        deviceId,
        deviceName,
        parameterId,
        parameterName,
        resultDueDate,
        ...additionalData 
      } = req.body;

      if (!title || !type) {
        return res.status(400).json({ message: 'Missing required fields: title and type are required' });
      }

      // Store additional data as JSON in the message field if needed
      let messageContent = message || '';

      // If we have additional data for diagnostic results, store it in the message field
      if (type === 'DIAGNOSTIC_RESULT' && (deviceId || parameterId)) {
        const diagnosticData = {
          deviceId,
          deviceName,
          parameterId,
          parameterName,
          resultDueDate
        };
        messageContent = JSON.stringify(diagnosticData);
      }

      const notification = await prisma.notification.create({
        data: {
          title,
          message: messageContent,
          type,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          patientId,
          companyId,
          userId: session.user.id
        }
      });

      return res.status(201).json(notification);
    }

    if (req.method === 'PUT') {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: 'Missing required fields: id and status are required' });
      }

      const notification = await prisma.notification.update({
        where: { id },
        data: { status }
      });

      return res.status(200).json(notification);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
