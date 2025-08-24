import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { StockStatus } from '@prisma/client';

interface AccessoryImportData {
  name: string;
  brand?: string;
  model?: string;
  stockLocationName?: string;
  stockQuantity?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  warrantyExpiration?: string;
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

    const { accessories, mapping }: { accessories: AccessoryImportData[]; mapping: Record<string, string> } = req.body;

    if (!accessories || !Array.isArray(accessories)) {
      return res.status(400).json({ error: 'Données d\'accessoires invalides' });
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

    // Process each accessory
    for (const accessoryData of accessories) {
      try {
        // Validate required fields
        if (!accessoryData.name) {
          result.failed++;
          result.errors.push({
            row: accessoryData._rowIndex,
            error: 'Nom de l\'accessoire est obligatoire'
          });
          continue;
        }

        // Find stock location if provided
        let stockLocationId: string | undefined;
        if (accessoryData.stockLocationName) {
          const locationName = accessoryData.stockLocationName.toLowerCase();
          stockLocationId = locationMap.get(locationName);
          
          if (!stockLocationId) {
            result.failed++;
            result.errors.push({
              row: accessoryData._rowIndex,
              error: `Lieu de stockage '${accessoryData.stockLocationName}' n'existe pas. Lieux disponibles: ${stockLocations.map(l => l.name).join(', ')}`
            });
            continue;
          }
        }

        // Validate prices are positive if provided
        if (accessoryData.purchasePrice && accessoryData.purchasePrice <= 0) {
          result.failed++;
          result.errors.push({
            row: accessoryData._rowIndex,
            error: 'Le prix d\'achat doit être positif'
          });
          continue;
        }

        if (accessoryData.sellingPrice && accessoryData.sellingPrice <= 0) {
          result.failed++;
          result.errors.push({
            row: accessoryData._rowIndex,
            error: 'Le prix de vente doit être positif'
          });
          continue;
        }

        // Parse warranty expiration date
        let warrantyExpiration: Date | undefined;
        if (accessoryData.warrantyExpiration) {
          warrantyExpiration = new Date(accessoryData.warrantyExpiration);
          if (isNaN(warrantyExpiration.getTime())) {
            warrantyExpiration = undefined;
          }
        }

        // Convert string prices to numbers
        const purchasePrice = accessoryData.purchasePrice ? parseFloat(accessoryData.purchasePrice.toString()) : null;
        const sellingPrice = accessoryData.sellingPrice ? parseFloat(accessoryData.sellingPrice.toString()) : null;

        // Create the accessory
        const newAccessory = await prisma.product.create({
          data: {
            name: accessoryData.name,
            type: 'ACCESSORY', // Force accessory type
            brand: accessoryData.brand || null,
            model: accessoryData.model || null,
            purchasePrice: purchasePrice,
            sellingPrice: sellingPrice,
            warrantyExpiration: warrantyExpiration || null,
            status: (accessoryData.status as any) || 'ACTIVE',
            ...(stockLocationId && {
              stockLocation: {
                connect: { id: stockLocationId }
              }
            })
          }
        });

        result.success++;

      } catch (error) {
        console.error('Error importing accessory:', error);
        result.failed++;
        result.errors.push({
          row: accessoryData._rowIndex,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return res.status(200).json({
      success: true,
      results: result
    });

  } catch (error) {
    console.error('Error in accessories import:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'import des accessoires' 
    });
  }
}