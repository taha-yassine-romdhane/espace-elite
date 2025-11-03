import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to generate the next unique CNAM bond number
 * Format: BL-YYYY-XXXX (e.g., BL-2025-0001)
 * Query params: category (optional) - filter by LOCATION or ACHAT
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category } = req.query;
    const currentYear = new Date().getFullYear();
    const prefix = `BL-${currentYear}-`;

    // Build where clause - filter by category if provided
    const where: any = {
      bonNumber: {
        startsWith: prefix,
      },
    };

    // Filter by category (LOCATION for rentals, ACHAT for sales)
    if (category) {
      where.category = category as string;
    }

    // Find the latest bond number for current year (and category if specified)
    const latestBond = await prisma.cNAMBonRental.findFirst({
      where,
      orderBy: {
        bonNumber: 'desc',
      },
      select: {
        bonNumber: true,
      },
    });

    let nextNumber = 1;

    if (latestBond?.bonNumber) {
      // Extract the numeric part (e.g., "BL-2025-001" -> "001")
      const parts = latestBond.bonNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format with leading zeros (e.g., 1 -> "0001")
    const formattedNumber = String(nextNumber).padStart(4, '0');
    const newBondNumber = `${prefix}${formattedNumber}`;

    return res.status(200).json({ bonNumber: newBondNumber });
  } catch (error) {
    console.error('Error generating bond number:', error);
    return res.status(500).json({ error: 'Failed to generate bond number' });
  }
}
