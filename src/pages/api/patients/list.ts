import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/db';

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
      const patients = await prisma.patient.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          telephone: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });
      return res.status(200).json({ patients });
    } catch (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Error fetching patients' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
