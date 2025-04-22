import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { startDate, endDate, assignedTo, diagnosticId, patientId } = req.query;
      
      const tasks = await prisma.task.findMany({
        where: {
          ...(assignedTo ? { userId: assignedTo as string } : {}),
          ...(diagnosticId ? { diagnosticId: diagnosticId as string } : {}),
          ...(patientId ? { patientId: patientId as string } : {}),
          ...(startDate && endDate ? {
            createdAt: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          } : {})
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { title, description, status, priority, startDate, endDate } = req.body;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status,
          priority,
          userId: session.user.id, // Always use the logged-in user's ID
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : new Date(),
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ error: 'Failed to create task' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, title, description, status, priority, startDate, endDate } = req.body;

      // Verify the user owns this task
      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!existingTask || existingTask.userId !== session.user.id) {
        return res.status(403).json({ error: 'Not authorized to modify this task' });
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          title,
          description,
          status,
          priority,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      return res.status(200).json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      return res.status(500).json({ error: 'Failed to update task' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
