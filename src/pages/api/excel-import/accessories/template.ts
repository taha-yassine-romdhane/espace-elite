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
        'Nom de l\'accessoire',
        'Marque',
        'Modèle',
        'Emplacement de stock',
        'Quantité en stock',
        'Prix d\'achat',
        'Prix de vente',
        'Fin de garantie',
        'Statut'
      ],
      // Sample data row 1
      [
        'Masque nasal ResMed AirFit N20',
        'ResMed',
        'AirFit N20',
        'bureau pricipale',
        50,
        25.50,
        35.00,
        '2025-12-31',
        'FOR_SALE'
      ],
      // Sample data row 2
      [
        'Circuit patient chauffant',
        'Fisher & Paykel',
        'RT341',
        'bureau pricipale',
        30,
        45.00,
        60.00,
        '2025-06-30',
        'FOR_SALE'
      ],
      // Sample data row 3
      [
        'Filtre HEPA ResMed',
        'ResMed',
        'S9-Filter',
        'bureau pricipale',
        100,
        8.00,
        12.00,
        '2025-12-31',
        'FOR_SALE'
      ],
      // Instructions row (empty row + instructions)
      [],
      ['INSTRUCTIONS:'],
      ['- Nom de l\'accessoire: Obligatoire - Nom descriptif de l\'accessoire'],
      ['- Marque: Optionnel - Marque du fabricant'],
      ['- Modèle: Optionnel - Référence du modèle'],
      ['- Emplacement de stock: Optionnel - Nom de l\'emplacement de stockage'],
      ['- Quantité en stock: Optionnel - Nombre d\'unités (défaut: 1)'],
      ['- Prix d\'achat: Optionnel - Prix en dinars (format: 25.50)'],
      ['- Prix de vente: Optionnel - Prix en dinars (format: 35.00)'],
      ['- Fin de garantie: Optionnel - Date de fin de garantie (format: YYYY-MM-DD)'],
      ['- Statut: Optionnel - FOR_SALE, FOR_RENT, EN_REPARATION, HORS_SERVICE (défaut: FOR_SALE)']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Nom de l'accessoire
      { wch: 15 }, // Marque
      { wch: 20 }, // Modèle
      { wch: 20 }, // Emplacement de stock
      { wch: 15 }, // Quantité en stock
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 15 }, // Fin de garantie
      { wch: 15 }  // Statut
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Accessoires');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_accessories_import.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating accessories template:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du template' 
    });
  }
}