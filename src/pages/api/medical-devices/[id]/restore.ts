import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'POST') {
    try {
      const { stockLocationId, notes, rentalId } = req.body;

      if (!stockLocationId) {
        return res.status(400).json({ message: 'Stock location ID is required' });
      }

      // Verify the device exists
      const device = await prisma.medicalDevice.findUnique({
        where: { id: id as string },
      });

      if (!device) {
        return res.status(404).json({ message: 'Medical device not found' });
      }

      // Verify the stock location exists
      const stockLocation = await prisma.stockLocation.findUnique({
        where: { id: stockLocationId },
      });

      if (!stockLocation) {
        return res.status(404).json({ message: 'Stock location not found' });
      }

      // Update device location and status
      const updatedDevice = await prisma.medicalDevice.update({
        where: { id: id as string },
        data: {
          stockLocationId: stockLocationId,
          location: stockLocation.name,
          status: 'ACTIVE', // Set device as available
        },
      });

      // If rentalId is provided, update rental status to COMPLETED
      if (rentalId) {
        await prisma.rental.update({
          where: { id: rentalId },
          data: {
            status: 'COMPLETED',
            endDate: new Date(),
          },
        });
      }

      // Create a patient history entry for the restoration
      if (rentalId) {
        const rental = await prisma.rental.findUnique({
          where: { id: rentalId },
          include: { patient: true },
        });

        if (rental) {
          await prisma.patientHistory.create({
            data: {
              patientId: rental.patientId,
              action: 'DEVICE_RESTORED',
              description: `Appareil ${device.name} (${device.deviceCode || 'N/A'}) restauré au stock ${stockLocation.name}. ${notes ? `Notes: ${notes}` : ''}`,
              performedById: session.user.id,
            },
          });
        }
      }

      return res.status(200).json({
        message: 'Device restored successfully',
        device: updatedDevice,
      });
    } catch (error) {
      console.error('Error restoring device:', error);
      return res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
