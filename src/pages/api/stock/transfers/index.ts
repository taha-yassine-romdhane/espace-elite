import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { startDate, endDate, locationId, search } = req.query;

      const transfers = await prisma.stockTransfer.findMany({
        where: {
          ...(startDate && endDate ? {
            transferDate: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          } : {}),
          ...(locationId ? {
            OR: [
              { fromLocationId: locationId as string },
              { toLocationId: locationId as string }
            ]
          } : {}),
          ...(search ? {
            OR: [
              { product: { name: { contains: search as string, mode: 'insensitive' } } },
            ]
          } : {})
        },
        include: {
          fromLocation: {
            select: {
              name: true,
            }
          },
          toLocation: {
            select: {
              name: true,
            }
          },
          product: {
            select: {
              name: true,
            }
          },
          transferredBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          sentBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          receivedBy: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          transferDate: 'desc'
        }
      });

      return res.status(200).json(transfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      return res.status(500).json({ error: 'Failed to fetch transfers' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fromLocationId, toLocationId, productId, quantity, newStatus, notes } = req.body;

      // Start a transaction
      const transfer = await prisma.$transaction(async (tx) => {
        // 1. Check if there's enough stock in the source location
        const sourceStock = await tx.stock.findFirst({
          where: {
            locationId: fromLocationId,
            productId,
          }
        });

        if (!sourceStock || sourceStock.quantity < quantity) {
          throw new Error('Insufficient stock in source location');
        }

        // 2. Update source location stock
        await tx.stock.update({
          where: { id: sourceStock.id },
          data: { quantity: sourceStock.quantity - quantity }
        });

        // 3. Update or create destination location stock
        //        const destStock = await tx.stock.upsert({
        //          where: {
        //            locationId_productId: {
        //              locationId: toLocationId,
        //              productId,
        //            }
        //          },
        //          create: {
        //            locationId: toLocationId,
        //            productId,
        //            quantity,
        //            status: newStatus || sourceStock.status,
        //          },
        //          update: {
        //            quantity: { increment: quantity },
        //            ...(newStatus ? { status: newStatus } : {})
        //          }
        //        });

        // 4. Create transfer record
        const transfer = await tx.stockTransfer.create({
          data: {
            fromLocationId,
            toLocationId,
            productId,
            quantity,
            newStatus,
            notes,
            transferredById: session.user.id,
          },
          include: {
            fromLocation: true,
            toLocation: true,
            product: true,
            transferredBy: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        });

        return transfer;
      });

      return res.status(201).json(transfer);
    } catch (error: any) {
      console.error('Error creating transfer:', error);
      return res.status(500).json({
        error: 'Failed to create transfer',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
