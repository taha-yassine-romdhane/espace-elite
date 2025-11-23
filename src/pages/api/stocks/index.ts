import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { locationId, productId } = req.query;

        // If both locationId and productId are provided, get specific stock
        if (locationId && productId && typeof locationId === 'string' && typeof productId === 'string') {
          const stock = await prisma.stock.findUnique({
            where: {
              locationId_productId: {
                locationId,
                productId,
              },
            },
            include: {
              location: true,
              product: true,
            },
          });

          return res.status(200).json({ stock });
        }

        // If only locationId is provided, get all stocks for that location
        if (locationId && typeof locationId === 'string') {
          const stocks = await prisma.stock.findMany({
            where: { locationId },
            include: {
              location: true,
              product: true,
            },
          });

          return res.status(200).json({ stocks });
        }

        // If only productId is provided, get all stocks for that product
        if (productId && typeof productId === 'string') {
          const stocks = await prisma.stock.findMany({
            where: { productId },
            include: {
              location: true,
              product: true,
            },
          });

          return res.status(200).json({ stocks });
        }

        // If no query params, return all stocks
        const stocks = await prisma.stock.findMany({
          include: {
            location: true,
            product: true,
          },
        });

        return res.status(200).json({ stocks });
      } catch (error) {
        console.error('Error fetching stocks:', error);
        return res.status(500).json({ error: 'Failed to fetch stocks' });
      }

    case 'POST':
      try {
        const { productId, locationId, quantity } = req.body;

        // Validate required fields
        if (!productId || !locationId) {
          return res.status(400).json({ error: 'Product ID and Location ID are required' });
        }

        // Check if stock already exists for this product-location combination
        const existingStock = await prisma.stock.findUnique({
          where: {
            locationId_productId: {
              locationId,
              productId,
            },
          },
        });

        if (existingStock) {
          // If stock exists, update the quantity
          const updatedStock = await prisma.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: existingStock.quantity + (parseInt(quantity?.toString() || '0')),
            },
            include: {
              location: true,
              product: true,
            },
          });

          return res.status(200).json(updatedStock);
        }

        // Create new stock entry
        const newStock = await prisma.stock.create({
          data: {
            quantity: parseInt(quantity?.toString() || '0'),
            product: {
              connect: { id: productId },
            },
            location: {
              connect: { id: locationId },
            },
          },
          include: {
            location: true,
            product: true,
          },
        });

        console.log('Stock created successfully:', newStock.id);

        return res.status(201).json(newStock);
      } catch (error) {
        console.error('Error creating stock:', error);
        return res.status(500).json({ error: 'Failed to create stock' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
