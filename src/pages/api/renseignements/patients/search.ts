import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search for patients with similar names in both firstName and lastName fields
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telephone: true,
        telephoneTwo: true,
        address: true,
        cin: true,
        cnamId: true,
        antecedant: true,
        height: true,
        weight: true,
        dateOfBirth: true,
        beneficiaryType: true,
        affiliation: true,
        descriptionNumOne: true,
        descriptionNumTwo: true,
        files: true, // Include files
        // Get doctor data through the Doctor model which is related to User
        doctor: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              }
            }
          }
        },
        // For technician, we get directly from the User model through the TechnicianPatients relation
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          }
        },
        technicianId: true,
        doctorId: true,
      },
      take: 5, // Limit results to 5 patients
    });

    console.log("Found patients:", JSON.stringify(patients.slice(0, 1), null, 2));

    // Transform the data to match the format expected by the frontend
    const transformedPatients = patients.map(patient => {
      // For debugging
      console.log(`Patient: ${patient.firstName} ${patient.lastName}`);
      console.log(`Doctor: ${patient.doctorId ? 'exists' : 'none'}`);
      if (patient.doctor) {
        console.log(`Doctor details: ID=${patient.doctor.id}, User=${patient.doctor.user ? `${patient.doctor.user.firstName} ${patient.doctor.user.lastName}` : 'none'}`);
      }
      console.log(`Technician: ${patient.technicianId ? `ID=${patient.technicianId}` : 'none'}`);
      if (patient.technician) {
        console.log(`Technician details: ${patient.technician.firstName} ${patient.technician.lastName} (${patient.technician.role})`);
      }

      return {
        id: patient.id,
        nomComplet: `${patient.firstName} ${patient.lastName}`.trim(),
        telephonePrincipale: patient.telephone,
        telephoneSecondaire: patient.telephoneTwo,
        adresseComplete: patient.address,
        cin: patient.cin,
        identifiantCNAM: patient.cnamId,
        // For technician, use the direct technicianId which references User.id
        technicienResponsable: patient.technicianId || '',
        technicienResponsableNom: patient.technician 
          ? `${patient.technician.firstName} ${patient.technician.lastName}`.trim() 
          : '',
        antecedant: patient.antecedant || '',
        taille: patient.height ? patient.height.toString() : '',
        poids: patient.weight ? patient.weight.toString() : '',
        // For doctor, use doctorId which references Doctor.id
        medecin: patient.doctorId || '',
        medecinNom: patient.doctor && patient.doctor.user 
          ? `${patient.doctor.user.firstName} ${patient.doctor.user.lastName}`.trim() 
          : '',
        dateNaissance: patient.dateOfBirth ? patient.dateOfBirth.toISOString().split('T')[0] : '',
        beneficiaire: patient.beneficiaryType || '',
        caisseAffiliation: patient.affiliation || 'CNSS',
        // Convert file paths to format expected by front-end
        existingFiles: patient.files ? patient.files.map((file: any) => ({
          url: file.url,
          type: file.fileType || 'document'
        })) : []
      };
    });

    return res.status(200).json(transformedPatients);
  } catch (error) {
    console.error('Error searching patients:', error);
    return res.status(500).json({ message: 'Error searching patients' });
  }
}
