import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { DeviceStatus, StockStatus } from '@prisma/client';

interface DiagnosticDeviceImportData {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  technicalSpecs?: string;
  configuration?: string;
  status?: DeviceStatus;
  stockQuantity?: number;
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

    const { devices, mapping }: { devices: DiagnosticDeviceImportData[]; mapping: Record<string, string> } = req.body;

    if (!devices || !Array.isArray(devices)) {
      return res.status(400).json({ error: 'Données d\'appareils de diagnostic invalides' });
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

    // Process each diagnostic device
    for (const deviceData of devices) {
      try {
        // Validate required fields
        if (!deviceData.name) {
          result.failed++;
          result.errors.push({
            row: deviceData._rowIndex,
            error: 'Nom de l\'appareil est obligatoire'
          });
          continue;
        }

        // Check for duplicate serial number if provided
        if (deviceData.serialNumber) {
          const existingDevice = await prisma.medicalDevice.findFirst({
            where: { serialNumber: deviceData.serialNumber }
          });

          if (existingDevice) {
            result.failed++;
            result.duplicates.push({
              row: deviceData._rowIndex,
              serialNumber: deviceData.serialNumber
            });
            continue;
          }
        }

        // Find stock location if provided
        let stockLocationId: string | undefined;
        if (deviceData.stockLocationName) {
          const locationName = deviceData.stockLocationName.toLowerCase();
          stockLocationId = locationMap.get(locationName);
          
          if (!stockLocationId) {
            result.failed++;
            result.errors.push({
              row: deviceData._rowIndex,
              error: `Lieu de stockage '${deviceData.stockLocationName}' n'existe pas. Lieux disponibles: ${stockLocations.map(l => l.name).join(', ')}`
            });
            continue;
          }
        }

        // Validate prices are positive if provided
        if (deviceData.purchasePrice && deviceData.purchasePrice <= 0) {
          result.failed++;
          result.errors.push({
            row: deviceData._rowIndex,
            error: 'Le prix d\'achat doit être positif'
          });
          continue;
        }

        if (deviceData.sellingPrice && deviceData.sellingPrice <= 0) {
          result.failed++;
          result.errors.push({
            row: deviceData._rowIndex,
            error: 'Le prix de vente doit être positif'
          });
          continue;
        }

        // Convert string prices to numbers
        const purchasePrice = deviceData.purchasePrice ? parseFloat(deviceData.purchasePrice.toString()) : null;
        const sellingPrice = deviceData.sellingPrice ? parseFloat(deviceData.sellingPrice.toString()) : null;

        // Create the diagnostic device
        const newDevice = await prisma.medicalDevice.create({
          data: {
            name: deviceData.name,
            type: 'DIAGNOSTIC_DEVICE', // Force diagnostic device type
            brand: deviceData.brand || null,
            model: deviceData.model || null,
            serialNumber: deviceData.serialNumber || null,
            purchasePrice: purchasePrice,
            sellingPrice: sellingPrice,
            technicalSpecs: deviceData.technicalSpecs || null,
            configuration: deviceData.configuration || null,
            status: deviceData.status || 'ACTIVE',
            stockQuantity: deviceData.stockQuantity || 1,
            ...(stockLocationId && {
              stockLocation: {
                connect: { id: stockLocationId }
              }
            })
          }
        });

        result.success++;

      } catch (error) {
        console.error('Error importing diagnostic device:', error);
        result.failed++;
        result.errors.push({
          row: deviceData._rowIndex,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return res.status(200).json({
      success: true,
      results: result
    });

  } catch (error) {
    console.error('Error in diagnostic devices import:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'import des appareils de diagnostic' 
    });
  }
}