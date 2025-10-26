import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to generate the next unique CNAM bond number
 * Format: BL-YYYY-XXX (e.g., BL-2025-001)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentYear = new Date().getFullYear();
    const prefix = `BL-${currentYear}-`;

    // Find the latest bond number for current year
    const latestBond = await prisma.cNAMBondRental.findFirst({
      where: {
        bondNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        bondNumber: 'desc',
      },
      select: {
        bondNumber: true,
      },
    });

    let nextNumber = 1;

    if (latestBond?.bondNumber) {
      // Extract the numeric part (e.g., "BL-2025-001" -> "001")
      const parts = latestBond.bondNumber.split('-');
      const lastNumber = parseInt(parts[parts.length - 1], 10);

      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format with leading zeros (e.g., 1 -> "001")
    const formattedNumber = String(nextNumber).padStart(3, '0');
    const newBondNumber = `${prefix}${formattedNumber}`;

    return res.status(200).json({ bondNumber: newBondNumber });
  } catch (error) {
    console.error('Error generating bond number:', error);
    return res.status(500).json({ error: 'Failed to generate bond number' });
  }
}
