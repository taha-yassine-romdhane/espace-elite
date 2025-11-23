import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

// This endpoint should be called daily by a cron job to unreserve devices
// from diagnostics that have passed their follow-up date
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is an authorized cron request
  // In production, you should use a secret token
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    // Find all PENDING diagnostics where follow-up date has passed
    const expiredDiagnostics = await prisma.diagnostic.findMany({
      where: {
        status: 'PENDING',
        followUpDate: {
          lt: today // Follow-up date is before today
        }
      },
      include: {
        medicalDevice: true,
        patient: true
      }
    });

    let devicesUnreserved = 0;

    // Unreserve devices from expired diagnostics
    for (const diagnostic of expiredDiagnostics) {
      if (!diagnostic.medicalDeviceId) continue;

      // Check if device is still RESERVED
      const device = await prisma.medicalDevice.findUnique({
        where: { id: diagnostic.medicalDeviceId },
        select: { status: true }
      });

      if (device?.status === 'RESERVED') {
        await prisma.medicalDevice.update({
          where: { id: diagnostic.medicalDeviceId },
          data: { status: 'ACTIVE' }
        });

        devicesUnreserved++;

        console.log(`[CRON] Unreserved device ${diagnostic.medicalDevice?.name} (${diagnostic.medicalDeviceId}) from expired diagnostic ${diagnostic.diagnosticCode}`);

        // Optionally create a notification for the employee
        if (diagnostic.performedById) {
          await prisma.notification.create({
            data: {
              title: 'Appareil libéré automatiquement',
              message: `L'appareil ${diagnostic.medicalDevice?.name} a été automatiquement libéré car la date de suivi du diagnostic ${diagnostic.diagnosticCode} (${diagnostic.patient?.firstName} ${diagnostic.patient?.lastName}) est dépassée.`,
              type: 'MAINTENANCE',
              status: 'PENDING',
              userId: diagnostic.performedById,
              metadata: {
                diagnosticId: diagnostic.id,
                diagnosticCode: diagnostic.diagnosticCode,
                deviceId: diagnostic.medicalDeviceId,
                deviceName: diagnostic.medicalDevice?.name,
                followUpDate: diagnostic.followUpDate
              }
            }
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Device unreservation check completed',
      stats: {
        expiredDiagnostics: expiredDiagnostics.length,
        devicesUnreserved
      }
    });

  } catch (error) {
    console.error('Error in device unreservation cron job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
