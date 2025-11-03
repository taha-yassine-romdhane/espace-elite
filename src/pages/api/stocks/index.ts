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

  try {
    switch (req.method) {
      case 'GET':
        const { locationId: queryLocationId, productId: queryProductId } = req.query;

        if (queryLocationId && queryProductId) {
          // Get specific stock for location and product
          const stock = await prisma.stock.findUnique({
            where: {
              locationId_productId: {
                locationId: queryLocationId as string,
                productId: queryProductId as string
              }
            },
            include: {
              location: true,
              product: true
            }
          });

          return res.status(200).json({ stock });
        }

        // Get all stocks
        const stocks = await prisma.stock.findMany({
          include: {
            location: true,
            product: true
          }
        });

        return res.status(200).json(stocks);

      case 'POST':
        const { productId, locationId, quantity, status } = req.body;

        if (!productId || !locationId) {
          return res.status(400).json({ error: 'productId and locationId are required' });
        }

        // Check if stock already exists for this product in this location
        const existingStock = await prisma.stock.findFirst({
          where: {
            productId,
            locationId
          }
        });

        if (existingStock) {
          return res.status(400).json({ error: 'Stock already exists for this product in this location' });
        }

        const newStock = await prisma.stock.create({
          data: {
            productId,
            locationId,
            quantity: quantity || 0,
            status: status || 'FOR_SALE'
          },
          include: {
            location: true,
            product: true
          }
        });

        return res.status(201).json(newStock);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Stock API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
