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

    // Return the data in a format that matches our Patient type
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

      // Return patient data in the format that matches our Patient type
      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        telephone: patient.telephone,
        telephoneTwo: patient.telephoneTwo,
        address: patient.address,
        addressCoordinates: null, // We don't have this in the database query
        cin: patient.cin,
        cnamId: patient.cnamId,
        technicianId: patient.technicianId || '',
        technician: patient.technician ? {
          id: patient.technician.id,
          firstName: patient.technician.firstName,
          lastName: patient.technician.lastName,
          role: patient.technician.role
        } : undefined,
        antecedant: patient.antecedant || '',
        height: patient.height,
        weight: patient.weight,
        doctorId: patient.doctorId || '',
        doctor: patient.doctor && patient.doctor.user ? {
          id: patient.doctor.id,
          user: {
            firstName: patient.doctor.user.firstName,
            lastName: patient.doctor.user.lastName,
            role: patient.doctor.user.role
          }
        } : undefined,
        dateOfBirth: patient.dateOfBirth,
        beneficiaryType: patient.beneficiaryType,
        affiliation: patient.affiliation,
        descriptionNumOne: patient.descriptionNumOne,
        descriptionNumTwo: patient.descriptionNumTwo,
        // Include files in the expected format
        files: patient.files ? patient.files.map((file: any) => ({
          id: file.id || '',
          url: file.url,
          type: file.type || 'document'
        })) : [],
        // Add these properties for compatibility with the existing code
        existingFiles: patient.files ? patient.files.map((file: any) => ({
          url: file.url,
          type: file.type || 'document'
        })) : []
      };
    });

    return res.status(200).json(transformedPatients);
  } catch (error) {
    console.error('Error searching patients:', error);
    return res.status(500).json({ message: 'Error searching patients' });
  }
}
