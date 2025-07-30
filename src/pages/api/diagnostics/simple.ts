import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { createDiagnosticResultNotification, createTaskNotification } from '@/lib/notifications';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  try {
    const { clientId, clientType, medicalDeviceId } = req.body;

    if (!clientId || !clientType || !medicalDeviceId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const data: any = {
      diagnosticDate: new Date(),
      medicalDevice: { connect: { id: medicalDeviceId } },
      performedBy: { connect: { id: userId } },
      result: {
        create: {
          status: 'PENDING',
        },
      },
    };

    if (clientType === 'Patient') {
      data.patient = { connect: { id: clientId } };
    } else if (clientType === 'Societe') {
      data.Company = { connect: { id: clientId } };
    } else {
        return res.status(400).json({ message: 'Invalid client type' });
    }

    const diagnostic = await prisma.diagnostic.create({ 
      data,
      include: {
        patient: true,
        medicalDevice: true
      }
    });

    await prisma.medicalDevice.update({
        where: { id: medicalDeviceId },
        data: { status: 'RESERVED' }
    });

    // Create notification for diagnostic result pending
    if (diagnostic.patient) {
      try {
        // Create a follow-up notification for diagnostic results
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3); // Due in 3 days
        
        await createDiagnosticResultNotification(
          diagnostic.medicalDeviceId,
          diagnostic.medicalDevice.name,
          diagnostic.patientId!,
          `${diagnostic.patient.firstName} ${diagnostic.patient.lastName}`,
          diagnostic.id, // Use diagnostic ID as parameter ID
          'Résultat de diagnostic',
          diagnostic.patient.userId,
          dueDate
        );

        // Create a task notification for the technician if assigned
        if (diagnostic.patient.technicianId) {
          await createTaskNotification(
            'Diagnostic en attente',
            `Résultat de diagnostic requis pour ${diagnostic.patient.firstName} ${diagnostic.patient.lastName}`,
            diagnostic.patient.technicianId,
            dueDate,
            diagnostic.id
          );
        }
      } catch (notificationError) {
        console.error('Failed to create diagnostic notification:', notificationError);
      }
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Diagnostic created successfully',
      diagnosticId: diagnostic.id
    });

  } catch (error) {
    console.error('Error creating simple diagnostic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
