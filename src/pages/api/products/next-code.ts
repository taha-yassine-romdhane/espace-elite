import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import type { ProductType } from '@prisma/client';

/**
 * API endpoint to get the next sequential product code
 * Pattern: ACC-001, ACC-002, ... or SP-001, SP-002, ...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.query;

    if (!type || (type !== 'ACCESSORY' && type !== 'SPARE_PART')) {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    const productType = type as ProductType;
    const prefix = productType === 'ACCESSORY' ? 'ACC' : 'SP';

    // Get the last product code for this type
    const lastProduct = await prisma.product.findFirst({
      where: {
        type: productType,
        productCode: {
          startsWith: prefix
        }
      },
      orderBy: {
        productCode: 'desc'
      },
      select: {
        productCode: true
      }
    });

    let nextNumber = 1;

    if (lastProduct?.productCode) {
      // Extract the number from the code (e.g., "ACC-005" -> 5)
      const match = lastProduct.productCode.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    // Format with leading zeros (e.g., 1 -> "001", 15 -> "015")
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const nextCode = `${prefix}-${formattedNumber}`;

    return res.status(200).json({
      nextCode,
      lastCode: lastProduct?.productCode || null
    });

  } catch (error) {
    console.error('Error generating next product code:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
