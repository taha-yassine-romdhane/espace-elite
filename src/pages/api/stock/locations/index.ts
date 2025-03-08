import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const locations = await prisma.stockLocation.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              stocks: true,
              products: true,
              medicalDevices: true,
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      return res.status(200).json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;

      const location = await prisma.stockLocation.create({
        data: {
          name,
          description,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          },
          _count: {
            select: {
              stocks: true,
              products: true,
              medicalDevices: true,
            }
          }
        }
      });

      return res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      return res.status(500).json({ error: 'Failed to create location' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
