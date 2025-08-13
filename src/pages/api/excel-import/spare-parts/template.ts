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
        'Nom de la pièce',
        'Marque',
        'Référence/Modèle',
        'Emplacement de stock',
        'Quantité en stock',
        'Prix d\'achat',
        'Prix de vente',
        'Garantie',
        'Statut'
      ],
      // Sample data row 1
      [
        'Moteur ventilateur CPAP',
        'Generic',
        'GenMot0001',
        'bureau pricipale',
        10,
        85.00,
        120.00,
        '12 mois',
        'FOR_SALE'
      ],
      // Sample data row 2
      [
        'Carte électronique principale',
        'ResMed',
        'PCB-S9-Main',
        'bureau pricipale',
        5,
        150.00,
        220.00,
        '24 mois',
        'FOR_SALE'
      ],
      // Sample data row 3
      [
        'Capteur de pression',
        'Sensortec',
        'SP-001',
        'bureau pricipale',
        20,
        25.00,
        40.00,
        '18 mois',
        'FOR_SALE'
      ],
      // Instructions row (empty row + instructions)
      [],
      ['INSTRUCTIONS:'],
      ['- Nom de la pièce: Obligatoire - Nom descriptif de la pièce de rechange'],
      ['- Marque: Optionnel - Marque du fabricant'],
      ['- Référence/Modèle: Optionnel - Référence ou modèle de la pièce'],
      ['- Emplacement de stock: Optionnel - Nom de l\'emplacement de stockage'],
      ['- Quantité en stock: Optionnel - Nombre d\'unités (défaut: 1)'],
      ['- Prix d\'achat: Optionnel - Prix en dinars (format: 85.00)'],
      ['- Prix de vente: Optionnel - Prix en dinars (format: 120.00)'],
      ['- Garantie: Optionnel - Informations sur la garantie (ex: "12 mois")'],
      ['- Statut: Optionnel - FOR_SALE, FOR_RENT, EN_REPARATION, HORS_SERVICE (défaut: FOR_SALE)']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Nom de la pièce
      { wch: 15 }, // Marque
      { wch: 20 }, // Référence/Modèle
      { wch: 20 }, // Emplacement de stock
      { wch: 15 }, // Quantité en stock
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 15 }, // Garantie
      { wch: 15 }  // Statut
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pièces de Rechange');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_spare_parts_import.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating spare parts template:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du template' 
    });
  }
}