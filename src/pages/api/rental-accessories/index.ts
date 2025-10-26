import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const accessories = await prisma.rentalAccessory.findMany({
        include: {
          rental: {
            select: {
              rentalCode: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              medicalDevice: {
                select: {
                  name: true,
                  deviceCode: true,
                },
              },
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              brand: true,
              model: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(accessories);
    }

    if (req.method === 'POST') {
      const { rentalId, productId, quantity, unitPrice } = req.body;

      if (!rentalId || !productId || !quantity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Use upsert to update quantity if already exists
      const accessory = await prisma.rentalAccessory.upsert({
        where: {
          rentalId_productId: {
            rentalId,
            productId,
          },
        },
        update: {
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice) || 0,
        },
        create: {
          rentalId,
          productId,
          quantity: parseInt(quantity),
          unitPrice: parseFloat(unitPrice) || 0,
        },
        include: {
          rental: true,
          product: true,
        },
      });

      return res.status(201).json(accessory);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in rental-accessories API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
