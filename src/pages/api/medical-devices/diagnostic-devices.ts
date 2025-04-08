import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

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
      const devices = await prisma.medicalDevice.findMany({
        where: {
          type: 'DIAGNOSTIC_DEVICE',
        },
        select: {
          id: true,
          name: true,
          brand: true,
          model: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
      return res.status(200).json({ devices });
    } catch (error) {
      console.error('Error fetching diagnostic devices:', error);
      return res.status(500).json({ error: 'Error fetching diagnostic devices' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
