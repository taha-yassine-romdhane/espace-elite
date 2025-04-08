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
      const { locationId, search } = req.query;

      const stocks = await prisma.stock.findMany({
        where: {
          ...(locationId ? { locationId: locationId as string } : {}),
          ...(search ? {
            OR: [
              { product: { name: { contains: search as string, mode: 'insensitive' } } },
              { product: { model: { contains: search as string, mode: 'insensitive' } } },
            ]
          } : {}),
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              model: true,
              brand: true,
              type: true,
            }
          }
        },
        orderBy: [
          { location: { name: 'asc' } },
          { product: { name: 'asc' } }
        ]
      });

      return res.status(200).json(stocks);
    } catch (error) {
      console.error('Error fetching stock:', error);
      return res.status(500).json({ error: 'Failed to fetch stock' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
