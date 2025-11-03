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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid stock ID' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        const { quantity, locationId, status } = req.body;

        const updateData: any = {};

        if (quantity !== undefined) {
          updateData.quantity = parseInt(quantity.toString());
        }
        if (locationId !== undefined) {
          updateData.locationId = locationId;
        }
        if (status !== undefined) {
          updateData.status = status;
        }

        const updatedStock = await prisma.stock.update({
          where: { id },
          data: updateData,
          include: {
            location: true,
            product: true
          }
        });

        return res.status(200).json(updatedStock);

      case 'DELETE':
        await prisma.stock.delete({
          where: { id }
        });

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stock API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
