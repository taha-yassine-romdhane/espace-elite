import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the transfer ID from the URL
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID de transfert invalide' });
    }

    // Get transfer with all related data
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromLocation: true,
        toLocation: true,
        product: true,
        transferredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfert non trouvé' });
    }

    return res.status(200).json(transfer);
  } catch (error) {
    console.error('Error fetching transfer details:', error);
    return res.status(500).json({ message: 'Une erreur est survenue lors de la récupération des détails du transfert' });
  }
}
