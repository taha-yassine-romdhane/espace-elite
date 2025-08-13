import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { ProductType, ProductStatus } from '@prisma/client';

interface ProductImportData {
  name: string;
  type: ProductType;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  purchaseDate?: string;
  warrantyExpiration?: string;
  status?: ProductStatus;
  notes?: string;
  stockLocationName?: string;
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

    const { products, mapping }: { products: ProductImportData[]; mapping: Record<string, string> } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Données de produits invalides' });
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

    // Process each product
    for (const productData of products) {
      try {
        // Validate required fields
        if (!productData.name || !productData.type) {
          result.failed++;
          result.errors.push({
            row: productData._rowIndex,
            error: 'Nom et type de produit sont obligatoires'
          });
          continue;
        }

        // Check for valid product type
        if (!['ACCESSORY', 'SPARE_PART'].includes(productData.type)) {
          result.failed++;
          result.errors.push({
            row: productData._rowIndex,
            error: `Type de produit invalide: ${productData.type}. Types autorisés: ACCESSORY, SPARE_PART`
          });
          continue;
        }

        // Check for duplicate serial number if provided
        if (productData.serialNumber) {
          const existingProduct = await prisma.product.findUnique({
            where: { serialNumber: productData.serialNumber }
          });

          if (existingProduct) {
            result.failed++;
            result.duplicates.push({
              row: productData._rowIndex,
              serialNumber: productData.serialNumber
            });
            continue;
          }
        }

        // Find stock location if provided
        let stockLocationId: string | undefined;
        if (productData.stockLocationName) {
          const locationName = productData.stockLocationName.toLowerCase();
          stockLocationId = locationMap.get(locationName);
          
          if (!stockLocationId) {
            // Create a warning but don't fail the import
            console.warn(`Stock location not found: ${productData.stockLocationName}`);
          }
        }

        // Parse dates
        let purchaseDate: Date | undefined;
        let warrantyExpiration: Date | undefined;

        if (productData.purchaseDate) {
          purchaseDate = new Date(productData.purchaseDate);
          if (isNaN(purchaseDate.getTime())) {
            purchaseDate = undefined;
          }
        }

        if (productData.warrantyExpiration) {
          warrantyExpiration = new Date(productData.warrantyExpiration);
          if (isNaN(warrantyExpiration.getTime())) {
            warrantyExpiration = undefined;
          }
        }

        // Create the product
        const newProduct = await prisma.product.create({
          data: {
            name: productData.name,
            type: productData.type,
            brand: productData.brand || null,
            model: productData.model || null,
            serialNumber: productData.serialNumber || null,
            purchasePrice: productData.purchasePrice || null,
            sellingPrice: productData.sellingPrice || null,
            purchaseDate: purchaseDate || null,
            warrantyExpiration: warrantyExpiration || null,
            status: productData.status || 'ACTIVE',
            notes: productData.notes || null,
            stockLocationId: stockLocationId || null
          }
        });

        // Create initial stock entry if we have a location
        if (stockLocationId) {
          await prisma.stock.create({
            data: {
              locationId: stockLocationId,
              productId: newProduct.id,
              quantity: 1, // Default quantity
              status: 'FOR_SALE' // Default status
            }
          });
        }

        result.success++;

      } catch (error) {
        console.error('Error importing product:', error);
        result.failed++;
        result.errors.push({
          row: productData._rowIndex,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return res.status(200).json({
      success: true,
      results: result
    });

  } catch (error) {
    console.error('Error in products import:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'import des produits' 
    });
  }
}