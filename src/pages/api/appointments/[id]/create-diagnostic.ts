import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de rendez-vous invalide' });
    }

    const {
      medicalDeviceId,
      diagnosticDate,
      followUpDate,
      performedById,
      status,
      result,
      notes,
      uploadedFiles,
    } = req.body;

    // Validate required fields
    if (!medicalDeviceId) {
      return res.status(400).json({ error: 'L\'appareil médical est requis' });
    }

    if (!diagnosticDate) {
      return res.status(400).json({ error: 'La date du diagnostic est requise' });
    }

    // Fetch the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (!appointment.patientId) {
      return res.status(400).json({ error: 'Le rendez-vous doit être lié à un patient' });
    }

    // Generate diagnostic code
    const lastDiagnostic = await prisma.diagnostic.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { diagnosticCode: true },
    });

    let nextNumber = 1;
    if (lastDiagnostic?.diagnosticCode) {
      const match = lastDiagnostic.diagnosticCode.match(/DIAG-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const diagnosticCode = `DIAG-${String(nextNumber).padStart(6, '0')}`;

    // Create the diagnostic
    const diagnostic = await prisma.diagnostic.create({
      data: {
        diagnosticCode,
        medicalDeviceId,
        patientId: appointment.patientId,
        diagnosticDate: new Date(diagnosticDate),
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        followUpRequired: !!followUpDate,
        performedById: performedById || null,
        status: status || 'PENDING',
        notes: notes || null,
        result: result
          ? {
              create: {
                iah: result.iah || null,
                idValue: result.idValue || null,
                status: result.status || status || 'PENDING',
                remarque: result.remarque || notes || null,
              },
            }
          : undefined,
      },
      include: {
        patient: true,
        medicalDevice: true,
        performedBy: true,
        result: true,
      },
    });

    // Update appointment status to COMPLETED
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        notes: notes
          ? `${appointment.notes || ''}\n\nDiagnostic créé: ${diagnosticCode}`.trim()
          : appointment.notes,
      },
    });

    // Create follow-up task if follow-up date is set
    if (followUpDate && appointment.patient && (performedById || appointment.assignedToId)) {
      const taskCode = `TASK-${Date.now()}`;
      const patientName = `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim() || 'Patient';

      await prisma.task.create({
        data: {
          taskCode: taskCode,
          title: `Suivi polygraphie - ${patientName}`,
          description: `Suivi du diagnostic ${diagnosticCode} pour le patient ${patientName}`,
          status: 'TODO',
          priority: 'MEDIUM',
          startDate: new Date(followUpDate),
          endDate: new Date(followUpDate),
          diagnosticId: diagnostic.id,
          userId: performedById || appointment.assignedToId,
        },
      });
    }

    // Create notification for diagnostic result
    if (appointment.patient) {
      const patientName = `${appointment.patient.firstName || ''} ${appointment.patient.lastName || ''}`.trim() || 'Patient';

      await prisma.notification.create({
        data: {
          title: 'Résultat de polygraphie disponible',
          message: `Les résultats de la polygraphie pour ${patientName} (${diagnosticCode}) sont maintenant disponibles.`,
          type: 'FOLLOW_UP',
          status: 'PENDING',
          userId: performedById || session.user.id,
          patientId: appointment.patientId,
          diagnosticId: diagnostic.id,
          dueDate: new Date(),
        },
      });
    }

    // Create file records if files were uploaded
    if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      await prisma.file.createMany({
        data: uploadedFiles.map((file: any) => ({
          url: file.url,
          type: file.type,
          fileName: file.name,
          fileSize: file.size,
          category: 'POLYGRAPHIE',
          patientId: appointment.patientId,
          diagnosticId: diagnostic.id,
          uploadedById: session.user.id,
        })),
      });
    }

    return res.status(200).json({
      success: true,
      diagnostic,
      message: 'Diagnostic créé avec succès et rendez-vous complété',
    });
  } catch (error) {
    console.error('Error creating diagnostic from appointment:', error);
    return res.status(500).json({
      error: 'Erreur lors de la création du diagnostic',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
