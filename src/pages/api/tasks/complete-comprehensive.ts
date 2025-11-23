import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/db';

/**
 * API endpoint to complete tasks from the calendar view
 * Handles different task types: TASK, APPOINTMENT_REMINDER, DIAGNOSTIC_PENDING, etc.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { taskId, taskType } = req.body;

  if (!taskId || !taskType) {
    return res.status(400).json({ error: 'ID et type de tâche requis' });
  }

  try {
    let result;

    switch (taskType) {
      case 'TASK':
        // Complete manual task
        result = await prisma.task.update({
          where: { id: taskId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedById: session.user.id
          }
        });

        // Update related notifications
        await prisma.notification.updateMany({
          where: {
            type: 'FOLLOW_UP',
            relatedId: taskId
          },
          data: {
            status: 'READ',
            readAt: new Date()
          }
        });
        break;

      case 'APPOINTMENT_REMINDER':
        // Extract appointment ID from taskId format: "appointment-{id}"
        const appointmentId = taskId.replace('appointment-', '');
        result = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: 'COMPLETED'
          }
        });
        break;

      case 'DIAGNOSTIC_PENDING':
        // For diagnostics, we just mark as acknowledged (user needs to enter results)
        // We don't actually complete the diagnostic here
        return res.status(400).json({
          error: 'Les diagnostics doivent être complétés via la page de saisie des résultats',
          requiresAction: true,
          actionUrl: '/roles/admin/diagnostics' // Will be overridden by the task's actionUrl
        });

      case 'PAYMENT_DUE':
      case 'PAYMENT_PERIOD_END':
        // Payments cannot be marked as "completed" - they need to be paid
        return res.status(400).json({
          error: 'Les paiements doivent être traités via la page du patient',
          requiresAction: true
        });

      case 'RENTAL_EXPIRING':
      case 'RENTAL_ALERT':
      case 'RENTAL_TITRATION':
      case 'RENTAL_APPOINTMENT':
        // Rental reminders are informational - we can dismiss them by updating their status
        // or creating a "dismissed" flag. For now, we'll return an error since there's no direct way
        return res.status(400).json({
          error: 'Les rappels de location doivent être traités via la page du patient',
          requiresAction: true
        });

      case 'CNAM_RENEWAL':
        // CNAM renewals need to be processed via the patient page
        return res.status(400).json({
          error: 'Les renouvellements CNAM doivent être traités via la page du patient',
          requiresAction: true
        });

      case 'SALE_RAPPEL_2YEARS':
      case 'SALE_RAPPEL_7YEARS':
        // Sale rappels are informational - user should contact patient
        // We could add a "dismissed" field or just let them view the sale
        return res.status(400).json({
          error: 'Les rappels de vente doivent être traités via la page du patient',
          requiresAction: true
        });

      default:
        return res.status(400).json({ error: 'Type de tâche non supporté' });
    }

    return res.status(200).json({
      success: true,
      message: 'Tâche complétée avec succès',
      data: result
    });

  } catch (error) {
    console.error('Error completing task:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la complétion de la tâche' });
  }
}
