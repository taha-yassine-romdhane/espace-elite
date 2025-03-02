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
      const technicians = await prisma.user.findMany({
        where: {
          role: 'EMPLOYEE',
          technician: {
            isNot: null
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          technician: true
        }
      });
      return res.status(200).json(technicians);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching technicians' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
