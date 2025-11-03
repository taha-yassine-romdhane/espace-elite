import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { DeviceStatus, StockStatus } from '@prisma/client';

interface MedicalDeviceImportData {
  name: string;
  type: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  rentalPrice?: number;
  installationDate?: string;
  warranty?: string;
  technicalSpecs?: string;
  configuration?: string;
  description?: string;
  maintenanceInterval?: string;
  location?: string;
  status?: DeviceStatus;
  destination?: StockStatus;
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

const VALID_DEVICE_TYPES = ['CPAP', 'VNI', 'CONCENTRATEUR_OXYGENE', 'MASQUE', 'AUTRE'];

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

    const { devices, mapping }: { devices: MedicalDeviceImportData[]; mapping: Record<string, string> } = req.body;

    if (!devices || !Array.isArray(devices)) {
      return res.status(400).json({ error: 'Données d\'appareils médicaux invalides' });
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

    // Process each medical device
    for (const deviceData of devices) {
      try {
        // Validate required fields
        if (!deviceData.name || !deviceData.type) {
          result.failed++;
          result.errors.push({
            row: deviceData._rowIndex,
            error: 'Nom et type d\'appareil sont obligatoires'
          });
          continue;
        }

        // Check for valid device type
        if (!VALID_DEVICE_TYPES.includes(deviceData.type)) {
          result.failed++;
          result.errors.push({
            row: deviceData._rowIndex,
            error: `Type d'appareil invalide: ${deviceData.type}. Types autorisés: ${VALID_DEVICE_TYPES.join(', ')}`
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
            // Create a warning but don't fail the import
            console.warn(`Stock location not found: ${deviceData.stockLocationName}`);
          }
        }

        // Parse dates
        let installationDate: Date | undefined;

        if (deviceData.installationDate) {
          installationDate = new Date(deviceData.installationDate);
          if (isNaN(installationDate.getTime())) {
            installationDate = undefined;
          }
        }

        // Convert string prices to Decimal
        const purchasePrice = deviceData.purchasePrice ? parseFloat(deviceData.purchasePrice.toString()) : null;
        const sellingPrice = deviceData.sellingPrice ? parseFloat(deviceData.sellingPrice.toString()) : null;
        const rentalPrice = deviceData.rentalPrice ? parseFloat(deviceData.rentalPrice.toString()) : null;

        // Create the medical device
        const newDevice = await prisma.medicalDevice.create({
          data: {
            name: deviceData.name,
            type: deviceData.type,
            brand: deviceData.brand || null,
            model: deviceData.model || null,
            serialNumber: deviceData.serialNumber || null,
            purchasePrice: purchasePrice,
            sellingPrice: sellingPrice,
            rentalPrice: rentalPrice,
            warranty: deviceData.warranty || null,
            technicalSpecs: deviceData.technicalSpecs || null,
            configuration: deviceData.configuration || null,
            description: deviceData.description || null,
            maintenanceInterval: deviceData.maintenanceInterval || null,
            location: deviceData.location || null,
            status: deviceData.status || 'ACTIVE',
            destination: deviceData.destination || 'FOR_SALE',
            stockQuantity: deviceData.stockQuantity || 1,
            stockLocationId: stockLocationId || null
          }
        });

        result.success++;

      } catch (error) {
        console.error('Error importing medical device:', error);
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
    console.error('Error in medical devices import:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'import des appareils médicaux' 
    });
  }
}