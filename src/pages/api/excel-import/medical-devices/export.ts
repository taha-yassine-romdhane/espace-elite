import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Fetch all medical devices with their related data
    const medicalDevices = await prisma.medicalDevice.findMany({
      include: {
        stockLocation: true,
        Patient: true,
        Company: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data for Excel export
    const excelData = medicalDevices.map(device => ({
      'ID': device.id,
      'Nom de l\'appareil': device.name || '',
      'Type d\'appareil': device.type || '',
      'Marque': device.brand || '',
      'Modèle': device.model || '',
      'Numéro de série': device.serialNumber || '',
      'Prix d\'achat': device.purchasePrice || '',
      'Prix de vente': device.sellingPrice || '',
      'Prix de location': device.rentalPrice || '',
      'Date d\'installation': device.installationDate ? new Date(device.installationDate).toLocaleDateString('fr-FR') : '',
      'Garantie': device.warranty || '',
      'Spécifications techniques': device.technicalSpecs || '',
      'Configuration': device.configuration || '',
      'Description': device.description || '',
      'Intervalle de maintenance': device.maintenanceInterval || '',
      'Localisation': device.location || '',
      'Statut': device.status || '',
      'Destination': device.destination || '',
      'Nécessite maintenance': device.requiresMaintenance ? 'Oui' : 'Non',
      'Quantité en stock': device.stockQuantity || 0,
      'Emplacement de stock': device.stockLocation?.name || '',
      'Patient assigné': device.Patient ? `${device.Patient.firstName} ${device.Patient.lastName}` : '',
      'Société assignée': device.Company ? device.Company.companyName : '',
      'Date jusqu\'à réservé': device.reservedUntil ? new Date(device.reservedUntil).toLocaleDateString('fr-FR') : '',
      'Date création': device.createdAt ? new Date(device.createdAt).toLocaleDateString('fr-FR') : '',
      'Date modification': device.updatedAt ? new Date(device.updatedAt).toLocaleDateString('fr-FR') : ''
    }));

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 15 }, // ID
      { wch: 25 }, // Nom de l'appareil
      { wch: 20 }, // Type d'appareil
      { wch: 15 }, // Marque
      { wch: 20 }, // Modèle
      { wch: 20 }, // Numéro de série
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 12 }, // Prix de location
      { wch: 15 }, // Date d'installation
      { wch: 15 }, // Garantie
      { wch: 30 }, // Spécifications techniques
      { wch: 20 }, // Configuration
      { wch: 25 }, // Description
      { wch: 20 }, // Intervalle de maintenance
      { wch: 20 }, // Localisation
      { wch: 12 }, // Statut
      { wch: 15 }, // Destination
      { wch: 18 }, // Nécessite maintenance
      { wch: 15 }, // Quantité en stock
      { wch: 20 }, // Emplacement de stock
      { wch: 25 }, // Patient assigné
      { wch: 25 }, // Société assignée
      { wch: 15 }, // Date jusqu'à réservé
      { wch: 15 }, // Date création
      { wch: 15 }  // Date modification
    ];
    ws['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Appareils Médicaux');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set response headers
    const fileName = `medical_devices_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);
    
  } catch (error) {
    console.error('Error exporting medical devices:', error);
    res.status(500).json({ error: 'Failed to export medical devices' });
  }
}