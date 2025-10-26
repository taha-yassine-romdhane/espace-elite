import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint for CNAM Nomenclature
 * Returns fixed CNAM rates per bond type
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { bondType, isActive } = req.query;

      const where: any = {};
      if (bondType) where.bondType = bondType as string;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const nomenclature = await prisma.cNAMNomenclature.findMany({
        where,
        orderBy: {
          bondType: 'asc',
        },
      });

      return res.status(200).json(nomenclature);
    } catch (error) {
      console.error('Error fetching CNAM nomenclature:', error);
      return res.status(500).json({ error: 'Failed to fetch CNAM nomenclature' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { bondType, category, amount, monthlyRate, description, isActive } = req.body;

      if (!bondType || amount === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: bondType, amount',
        });
      }

      const parsedAmount = parseFloat(amount);
      const parsedMonthlyRate = monthlyRate !== undefined ? parseFloat(monthlyRate) : parsedAmount;

      const nomenclature = await prisma.cNAMNomenclature.upsert({
        where: { bondType },
        update: {
          category: category || 'LOCATION',
          amount: parsedAmount,
          monthlyRate: parsedMonthlyRate,
          description,
          isActive: isActive !== undefined ? isActive : true,
        },
        create: {
          bondType,
          category: category || 'LOCATION',
          amount: parsedAmount,
          monthlyRate: parsedMonthlyRate,
          description,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return res.status(201).json(nomenclature);
    } catch (error) {
      console.error('Error creating/updating CNAM nomenclature:', error);
      return res.status(500).json({ error: 'Failed to create/update CNAM nomenclature' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
