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
        'Type d\'appareil',
        'Marque',
        'Modèle',
        'Numéro de série',
        'Prix d\'achat',
        'Prix de vente',
        'Prix de location',
        'Date d\'installation',
        'Garantie',
        'Spécifications techniques',
        'Configuration',
        'Description',
        'Intervalle de maintenance',
        'Localisation',
        'Statut',
        'Destination',
        'Nécessite maintenance',
        'Quantité en stock',
        'Emplacement de stock'
      ],
      // Sample data row 1
      [
        'CPAP ResMed AirSense 10',
        'CPAP',
        'ResMed',
        'AirSense 10 AutoSet',
        'AS123456789',
        2500.00,
        3000.00,
        150.00,
        '2024-01-15',
        '24 mois',
        'Pression 4-20 cmH2O, Débit max 60L/min',
        'Mode Auto, EPR activé',
        'CPAP automatique avec humidificateur intégré',
        '6 mois',
        'Service technique',
        'ACTIVE',
        'FOR_RENT',
        'false',
        1,
        'Magasin principal'
      ],
      // Sample data row 2
      [
        'Concentrateur O2 Philips',
        'CONCENTRATEUR_OXYGENE',
        'Philips',
        'EverFlo',
        'PH987654321',
        1800.00,
        2200.00,
        120.00,
        '2024-02-01',
        '36 mois',
        'Débit 0.5-5 L/min, Concentration >93%',
        'Mode continu',
        'Concentrateur d\'oxygène stationnaire',
        '3 mois',
        'Domicile patient',
        'ACTIVE',
        'FOR_RENT',
        'true',
        1,
        'Entrepôt médical'
      ],
      // Instructions row (empty row + instructions)
      [],
      ['INSTRUCTIONS:'],
      ['- Nom de l\'appareil: Obligatoire - Nom descriptif de l\'appareil médical'],
      ['- Type d\'appareil: Obligatoire - CPAP, VNI, CONCENTRATEUR_OXYGENE, MASQUE, ou AUTRE'],
      ['- Marque: Optionnel - Marque du fabricant'],
      ['- Modèle: Optionnel - Référence du modèle'],
      ['- Numéro de série: Optionnel - Identifiant unique (sera vérifié pour doublons)'],
      ['- Prix d\'achat: Optionnel - Prix en dinars (format: 2500.00)'],
      ['- Prix de vente: Optionnel - Prix en dinars (format: 3000.00)'],
      ['- Prix de location: Optionnel - Prix mensuel en dinars (format: 150.00)'],
      ['- Date d\'installation: Optionnel - Format: YYYY-MM-DD ou DD/MM/YYYY'],
      ['- Garantie: Optionnel - Informations sur la garantie (ex: "24 mois")'],
      ['- Spécifications techniques: Optionnel - Caractéristiques techniques'],
      ['- Configuration: Optionnel - Configuration actuelle de l\'appareil'],
      ['- Description: Optionnel - Description détaillée'],
      ['- Intervalle de maintenance: Optionnel - Fréquence de maintenance (ex: "6 mois")'],
      ['- Localisation: Optionnel - Lieu actuel de l\'appareil'],
      ['- Statut: Optionnel - ACTIVE, MAINTENANCE, RETIRED, RESERVED, SOLD (défaut: ACTIVE)'],
      ['- Destination: Optionnel - FOR_RENT, FOR_SALE, IN_REPAIR, OUT_OF_SERVICE (défaut: FOR_SALE)'],
      ['- Nécessite maintenance: Optionnel - true/false/oui/non (défaut: false)'],
      ['- Quantité en stock: Optionnel - Nombre d\'unités (défaut: 1)'],
      ['- Emplacement de stock: Optionnel - Nom de l\'emplacement de stockage']
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    const columnWidths = [
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
      { wch: 20 }  // Emplacement de stock
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appareils Médicaux');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_medical_devices_import.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('Error generating medical devices template:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la génération du template' 
    });
  }
}