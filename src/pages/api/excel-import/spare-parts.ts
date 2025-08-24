import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { StockStatus } from '@prisma/client';

interface SparePartImportData {
  name: string;
  brand?: string;
  model?: string;
  stockLocationName?: string;
  stockQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  warranty?: string;
  status?: StockStatus;
  _rowIndex: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  duplicates: Array<{ row: number; serialNumber: string }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { spareParts, mapping }: { spareParts: SparePartImportData[]; mapping: Record<string, string> } = req.body;

    if (!spareParts || !Array.isArray(spareParts)) {
      return res.status(400).json({ error: 'Données de pièces de rechange invalides' });
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      duplicates: []
    };

    // Get all stock locations for mapping
    const stockLocations = await prisma.stockLocation.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const locationMap = new Map(stockLocations.map(loc => [loc.name.toLowerCase(), loc.id]));

    // Process each spare part
    for (const sparePartData of spareParts) {
      try {
        // Validate required fields
        if (!sparePartData.name) {
          result.failed++;
          result.errors.push({
            row: sparePartData._rowIndex,
            error: 'Nom de la pièce est obligatoire'
          });
          continue;
        }

        // Find stock location if provided
        let stockLocationId: string | undefined;
        if (sparePartData.stockLocationName) {
          const locationName = sparePartData.stockLocationName.toLowerCase();
          stockLocationId = locationMap.get(locationName);
          
          if (!stockLocationId) {
            result.failed++;
            result.errors.push({
              row: sparePartData._rowIndex,
              error: `Lieu de stockage '${sparePartData.stockLocationName}' n'existe pas. Lieux disponibles: ${stockLocations.map(l => l.name).join(', ')}`
            });
            continue;
          }
        }

        // Validate prices are positive if provided
        if (sparePartData.purchasePrice && sparePartData.purchasePrice <= 0) {
          result.failed++;
          result.errors.push({
            row: sparePartData._rowIndex,
            error: 'Le prix d\'achat doit être positif'
          });
          continue;
        }

        if (sparePartData.sellingPrice && sparePartData.sellingPrice <= 0) {
          result.failed++;
          result.errors.push({
            row: sparePartData._rowIndex,
            error: 'Le prix de vente doit être positif'
          });
          continue;
        }

        // Convert string prices to numbers
        const purchasePrice = sparePartData.purchasePrice ? parseFloat(sparePartData.purchasePrice.toString()) : null;
        const sellingPrice = sparePartData.sellingPrice ? parseFloat(sparePartData.sellingPrice.toString()) : null;

        // Create the spare part
        const newSparePart = await prisma.product.create({
          data: {
            name: sparePartData.name,
            type: 'SPARE_PART', // Force spare part type
            brand: sparePartData.brand || null,
            model: sparePartData.model || null,
            purchasePrice: purchasePrice,
            sellingPrice: sellingPrice,
            warranty: sparePartData.warranty || null,
            status: sparePartData.status || 'FOR_SALE',
            stockQuantity: sparePartData.stockQuantity || 1,
            ...(stockLocationId && {
              stockLocation: {
                connect: { id: stockLocationId }
              }
            })
          }
        });

        result.success++;

      } catch (error) {
        console.error('Error importing spare part:', error);
        result.failed++;
        result.errors.push({
          row: sparePartData._rowIndex,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return res.status(200).json({
      success: true,
      results: result
    });

  } catch (error) {
    console.error('Error in spare parts import:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'import des pièces de rechange' 
    });
  }
}