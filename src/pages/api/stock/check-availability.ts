import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { fromLocationId, productId, quantity } = req.body;

      if (!fromLocationId || !productId || !quantity) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'fromLocationId, productId, and quantity are required'
        });
      }

      const stock = await prisma.stock.findFirst({
        where: {
          locationId: fromLocationId,
          productId,
        },
        include: {
          product: {
            select: {
              name: true,
              type: true
            }
          },
          location: {
            select: {
              name: true
            }
          }
        }
      });

      if (!stock) {
        return res.status(200).json({
          available: false,
          reason: 'Product not found in source location',
          details: {
            hasStock: false,
            availableQuantity: 0,
            requestedQuantity: quantity
          }
        });
      }

      const isAvailable = stock.quantity >= quantity;

      return res.status(200).json({
        available: isAvailable,
        reason: isAvailable ? 'Stock available' : 'Insufficient quantity',
        details: {
          hasStock: true,
          availableQuantity: stock.quantity,
          requestedQuantity: quantity,
          productName: stock.product.name,
          locationName: stock.location.name,
          productType: stock.product.type
        }
      });

    } catch (error) {
      console.error('Error checking stock availability:', error);
      return res.status(500).json({ 
        error: 'Failed to check stock availability',
        message: 'Internal server error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}