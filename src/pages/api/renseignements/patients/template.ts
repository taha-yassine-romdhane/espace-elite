import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create sample data for the template
    const templateData = [
      {
        'Nom Complet': 'Mohamed Ben Ali',
        'Téléphone Principal': '+21698765432',
        'Téléphone Secondaire': '+21695123456',
        'Gouvernorat': 'tunis',
        'Délégation': 'tunis_ville',
        'Adresse Détaillée': '15 Avenue Habib Bourguiba, Apt 3',
        'CIN': '12345678',
        'Date de Naissance': '15/03/1985',
        'CNAM ID': '123456789',
        'Type Bénéficiaire': 'ASSURE_SOCIAL',
        'Caisse Affiliation': 'CNSS',
        'Taille (cm)': '175',
        'Poids (kg)': '70',
        'IMC': '', // Calculé automatiquement
        'Antécédents': 'Diabète type 2, Hypertension',
        'Médecin Responsable': 'Dr Sliman labyadh',
        'Technicien Responsable': 'Ahmed Gazzeh',
        'Assigné à': '', // Sera automatiquement assigné à l'utilisateur qui importe
        'Description Nom': 'Patient régulier',
        'Description Téléphone': 'Téléphone portable principal',
        'Date Création': '', // Sera automatiquement remplie
        'Date Modification': '' // Sera automatiquement remplie
      },
      {
        'Nom Complet': 'Fatma Trabelsi',
        'Téléphone Principal': '25789456',
        'Téléphone Secondaire': '',
        'Gouvernorat': 'sfax',
        'Délégation': 'sfax_ville',
        'Adresse Détaillée': 'Rue de la République, Immeuble Nour',
        'CIN': '87654321',
        'Date de Naissance': '22/07/1992',
        'CNAM ID': '',
        'Type Bénéficiaire': 'AYANT_DROIT',
        'Caisse Affiliation': 'CNRPS',
        'Taille (cm)': '160',
        'Poids (kg)': '55',
        'IMC': '',
        'Antécédents': '',
        'Médecin Responsable': '',
        'Technicien Responsable': 'Ahmed Gazzeh',
        'Assigné à': '',
        'Description Nom': '',
        'Description Téléphone': '',
        'Date Création': '',
        'Date Modification': ''
      },
      {
        'Nom Complet': 'Ahmed Sassi',
        'Téléphone Principal': '98123456',
        'Téléphone Secondaire': '71234567',
        'Gouvernorat': 'bizerte',
        'Délégation': 'bizerte_nord',
        'Adresse Détaillée': 'Zone industrielle, Bloc C',
        'CIN': '11223344',
        'Date de Naissance': '10/12/1978',
        'CNAM ID': '987654321',
        'Type Bénéficiaire': 'ASSURE_SOCIAL',
        'Caisse Affiliation': 'CNAM',
        'Taille (cm)': '180',
        'Poids (kg)': '85',
        'IMC': '',
        'Antécédents': 'Asthme',
        'Médecin Responsable': 'Dr Sliman labyadh',
        'Technicien Responsable': '',
        'Assigné à': '',
        'Description Nom': 'Travailleur industriel',
        'Description Téléphone': 'Disponible en soirée',
        'Date Création': '',
        'Date Modification': ''
      }
    ];

    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Nom Complet
      { wch: 15 }, // Téléphone Principal
      { wch: 15 }, // Téléphone Secondaire
      { wch: 15 }, // Gouvernorat
      { wch: 20 }, // Délégation
      { wch: 30 }, // Adresse Détaillée
      { wch: 10 }, // CIN
      { wch: 15 }, // Date de Naissance
      { wch: 15 }, // CNAM ID
      { wch: 20 }, // Type Bénéficiaire
      { wch: 15 }, // Caisse Affiliation
      { wch: 10 }, // Taille
      { wch: 10 }, // Poids
      { wch: 8 },  // IMC
      { wch: 30 }, // Antécédents
      { wch: 25 }, // Médecin Responsable
      { wch: 25 }, // Technicien Responsable
      { wch: 25 }, // Assigné à
      { wch: 25 }, // Description Nom
      { wch: 25 }, // Description Téléphone
      { wch: 15 }, // Date Création
      { wch: 15 }  // Date Modification
    ];
    ws['!cols'] = columnWidths;
    
    // Add instructions sheet
    const instructionsData = [
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'CHAMPS OBLIGATOIRES:' },
      { 'Instructions pour l\'import des patients': '• Nom Complet: Nom et prénom du patient' },
      { 'Instructions pour l\'import des patients': '• Téléphone Principal: Format +216XXXXXXXX ou 8 chiffres' },
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'FORMATS SPÉCIAUX:' },
      { 'Instructions pour l\'import des patients': '• Date de Naissance: JJ/MM/AAAA ou AAAA-MM-JJ' },
      { 'Instructions pour l\'import des patients': '• CIN: Exactement 8 chiffres' },
      { 'Instructions pour l\'import des patients': '• Téléphone: +216XXXXXXXX ou XXXXXXXX (8 chiffres)' },
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'VALEURS AUTORISÉES:' },
      { 'Instructions pour l\'import des patients': '• Type Bénéficiaire: ASSURE_SOCIAL, AYANT_DROIT, PENSIONNAIRE' },
      { 'Instructions pour l\'import des patients': '• Caisse Affiliation: CNSS, CNRPS, CNAM' },
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'GOUVERNORATS/DÉLÉGATIONS:' },
      { 'Instructions pour l\'import des patients': '• Utilisez les codes exacts: tunis, sfax, bizerte, etc.' },
      { 'Instructions pour l\'import des patients': '• Délégations: tunis_ville, sfax_ville, bizerte_nord, etc.' },
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'MÉDECINS/TECHNICIENS:' },
      { 'Instructions pour l\'import des patients': '• Utilisez les noms exacts existants dans la base' },
      { 'Instructions pour l\'import des patients': '• Format médecin: "Dr Prénom Nom" ou "Prénom Nom"' },
      { 'Instructions pour l\'import des patients': '• Si non trouvé, le champ sera ignoré' },
      { 'Instructions pour l\'import des patients': '' },
      { 'Instructions pour l\'import des patients': 'NOTES:' },
      { 'Instructions pour l\'import des patients': '• Les champs vides sont autorisés sauf Nom Complet' },
      { 'Instructions pour l\'import des patients': '• IMC sera calculé automatiquement si Taille et Poids fournis' },
      { 'Instructions pour l\'import des patients': '• Dates de création/modification seront automatiques' },
      { 'Instructions pour l\'import des patients': '• Assigné à sera automatiquement défini' }
    ];
    
    const instructionsWs = XLSX.utils.json_to_sheet(instructionsData);
    instructionsWs['!cols'] = [{ wch: 60 }];
    
    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Patients - Exemples');
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set response headers
    const fileName = `template_patients_import.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating patient template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
}