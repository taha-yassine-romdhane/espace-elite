import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/db';

/**
 * API endpoint to update notes for tasks and appointments from the calendar view
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  // Only allow PATCH/PUT method
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { taskId, taskType, notes } = req.body;

  if (!taskId || !taskType) {
    return res.status(400).json({ error: 'ID et type de tâche requis' });
  }

  // Notes can be empty string (to clear notes)
  if (notes === undefined || notes === null) {
    return res.status(400).json({ error: 'Le champ notes est requis' });
  }

  try {
    let result;

    switch (taskType) {
      case 'TASK':
        // Update task description (which serves as notes)
        result = await prisma.task.update({
          where: { id: taskId },
          data: {
            description: notes,
            updatedAt: new Date()
          }
        });
        break;

      case 'APPOINTMENT_REMINDER':
        // Extract appointment ID from taskId format: "appointment-{id}"
        const appointmentId = taskId.replace('appointment-', '');
        result = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            notes: notes,
            updatedAt: new Date()
          }
        });
        break;

      default:
        return res.status(400).json({ error: 'Type de tâche non supporté pour la mise à jour des notes' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notes mises à jour avec succès',
      data: result
    });

  } catch (error) {
    console.error('Error updating notes:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour des notes' });
  }
}
