import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { myLocation, status } = req.query;

      // Build where clause
      const whereClause: any = {
        type: 'DIAGNOSTIC_DEVICE',
      };

      // Filter by user's stock location if requested
      if (myLocation === 'true') {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            stockLocation: {
              select: { id: true }
            }
          }
        });

        if (user?.stockLocation?.id) {
          whereClause.stockLocationId = user.stockLocation.id;
        }
      }

      // Filter by status if provided
      if (status) {
        whereClause.status = status;
      }

      const devices = await prisma.medicalDevice.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
          status: true,
          stockLocationId: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(devices);
    } catch (error) {
      console.error('Error fetching diagnostic devices:', error);
      return res.status(500).json({ error: 'Error fetching diagnostic devices' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
