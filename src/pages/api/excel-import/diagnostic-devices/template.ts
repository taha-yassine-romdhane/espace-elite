import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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

    // Create template data with headers and sample rows
    const templateData = [
      // Headers
      [
        'Nom de l\'appareil',
        'Marque',
        'Modèle',
        'Numéro de série',
        'Prix d\'achat',
        'Prix de vente',
        'Spécifications techniques',
        'Configuration',
        'Statut',
        'Quantité en stock',
        'Emplacement de stock'
      ],
      // Sample data row 1
      [
        'Tensiomètre Omron M3 Comfort',
        'Omron',
        'M3 Comfort',
        'OM123456789',
        150.00,
        200.00,
        'Mesure automatique, Mémoire 60 mesures, Détection arythmie',
        'Mode standard, Brassard M (22-32cm)',
        'ACTIVE',
        5,
        'bureau pricipale'
      ],
      // Sample data row 2
      [
        'Oxymètre Nonin 3150',
        'Nonin',
        '3150 WristOx2',
        'NO987654321',
        300.00,
        400.00,
        'SpO2 et fréquence cardiaque, Bluetooth, Mémoire 48h',
        'Mode continu, Alarmes activées',
        'ACTIVE',
        3,
        'bureau pricipale'
      ],
      // Instructions row (empty row + instructions)
      [],
      ['INSTRUCTIONS:'],
      ['- Nom de l\'appareil: Obligatoire - Nom descriptif de l\'appareil de diagnostic'],
      ['- Marque: Optionnel - Marque du fabricant'],
      ['- Modèle: Optionnel - Référence du modèle'],
      ['- Numéro de série: Obligatoire - Identifiant unique (sera vérifié pour doublons)'],
      ['- Prix d\'achat: Optionnel - Prix en dinars (format: 150.00)'],
      ['- Prix de vente: Optionnel - Prix en dinars (format: 200.00)'],
      ['- Spécifications techniques: Optionnel - Caractéristiques techniques'],
      ['- Configuration: Optionnel - Configuration actuelle de l\'appareil'],
      ['- Statut: Optionnel - ACTIVE, MAINTENANCE, RETIRED, RESERVED (défaut: ACTIVE)'],
      ['- Quantité en stock: Optionnel - Nombre d\'unités (défaut: 1)'],
      ['- Emplacement de stock: Optionnel - Nom de l\'emplacement de stockage']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Nom de l'appareil
      { wch: 15 }, // Marque
      { wch: 20 }, // Modèle
      { wch: 20 }, // Numéro de série
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 35 }, // Spécifications techniques
      { wch: 25 }, // Configuration
      { wch: 12 }, // Statut
      { wch: 15 }, // Quantité en stock
      { wch: 20 }  // Emplacement de stock
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appareils Diagnostic');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_diagnostic_devices_import.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating diagnostic devices template:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du template' 
    });
  }
}