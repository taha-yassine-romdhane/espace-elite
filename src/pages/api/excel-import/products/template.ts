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
        'Nom du produit',
        'Type de produit',
        'Marque',
        'Modèle',
        'Numéro de série',
        'Prix d\'achat',
        'Prix de vente',
        'Date d\'achat',
        'Expiration garantie',
        'Statut',
        'Notes',
        'Emplacement de stock'
      ],
      // Sample data row 1
      [
        'Masque nasal taille M',
        'ACCESSORY',
        'ResMed',
        'AirFit N20',
        'MN123456789',
        120.50,
        150.00,
        '2024-01-15',
        '2026-01-15',
        'ACTIVE',
        'Masque en excellent état',
        'Magasin principal'
      ],
      // Sample data row 2
      [
        'Filtre CPAP',
        'SPARE_PART',
        'Philips',
        'DreamStation',
        'FT987654321',
        25.00,
        35.00,
        '2024-02-01',
        '2025-02-01',
        'ACTIVE',
        'Pack de 6 filtres',
        'Entrepôt secondaire'
      ],
      // Instructions row (empty row + instructions)
      [],
      ['INSTRUCTIONS:'],
      ['- Nom du produit: Obligatoire - Nom descriptif du produit'],
      ['- Type de produit: Obligatoire - ACCESSORY ou SPARE_PART uniquement'],
      ['- Marque: Optionnel - Marque du fabricant'],
      ['- Modèle: Optionnel - Référence du modèle'],
      ['- Numéro de série: Optionnel - Identifiant unique (sera vérifié pour doublons)'],
      ['- Prix d\'achat: Optionnel - Prix en dinars (format: 123.45)'],
      ['- Prix de vente: Optionnel - Prix en dinars (format: 123.45)'],
      ['- Date d\'achat: Optionnel - Format: YYYY-MM-DD ou DD/MM/YYYY'],
      ['- Expiration garantie: Optionnel - Format: YYYY-MM-DD ou DD/MM/YYYY'],
      ['- Statut: Optionnel - ACTIVE, RETIRED, ou SOLD (défaut: ACTIVE)'],
      ['- Notes: Optionnel - Commentaires ou remarques'],
      ['- Emplacement de stock: Optionnel - Nom de l\'emplacement de stockage']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Nom du produit
      { wch: 15 }, // Type de produit
      { wch: 15 }, // Marque
      { wch: 20 }, // Modèle
      { wch: 20 }, // Numéro de série
      { wch: 12 }, // Prix d'achat
      { wch: 12 }, // Prix de vente
      { wch: 12 }, // Date d'achat
      { wch: 15 }, // Expiration garantie
      { wch: 10 }, // Statut
      { wch: 25 }, // Notes
      { wch: 20 }  // Emplacement de stock
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_products_import.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating products template:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du template' 
    });
  }
}