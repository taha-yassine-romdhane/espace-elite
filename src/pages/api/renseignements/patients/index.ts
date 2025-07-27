import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../pages/api/auth/[...nextauth]';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';
import { Affiliation, BeneficiaryType } from '@prisma/client';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method === 'GET') {
    try {
      const patients = await prisma.patient.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          telephone: true,
          cin: true,
        },
        orderBy: {
          lastName: 'asc',
        },
      });

      // Transform data to match expected format
      const transformedPatients = patients.map((patient) => {
        const firstName = patient.firstName || '';
        const lastName = patient.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return {
          id: patient.id,
          firstName: firstName,
          lastName: lastName,
          name: fullName || 'Patient sans nom',
          telephone: patient.telephone,
          cin: patient.cin,
        };
      });

      console.log('Transformed patients for response:', transformedPatients);

      return res.status(200).json({ patients: transformedPatients });
    } catch (error) {
      console.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }
  } else if (req.method === 'POST') {
    const form = formidable({});
    const [fields, ] = await form.parse(req);
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value?.[0]])
    );

    try {
      // Handle file upload if present
      const names = data.nomComplet?.split(' ') || [];
      
      // Debug log to see what data is being received
      console.log('Form data received:', data);
      
      // Log all form data fields to see what's being received
      console.log('All form data fields:', Object.keys(data));
      
      // First verify the doctor exists if one is specified
      let doctorId = null;
      if (data.medecin) {
        // Look up doctor by userId (which is the user.id)
        const doctor = await prisma.doctor.findFirst({
          where: {
            userId: data.medecin
          }
        });
        if (doctor) {
          doctorId = doctor.id;
          console.log('Doctor found with ID:', doctorId, 'for user ID:', data.medecin);
        } else {
          console.log('No doctor record found for user ID:', data.medecin);
        }
      }

      // Check if a patient with this phone number already exists before attempting to create
      if (data.telephonePrincipale) {
        const existingPatient = await prisma.patient.findUnique({
          where: { telephone: data.telephonePrincipale }
        });
        
        if (existingPatient) {
          return res.status(409).json({ 
            error: 'Duplicate patient', 
            field: 'telephonePrincipale',
            message: 'Un patient avec ce numéro de téléphone existe déjà',
            patientId: existingPatient.id 
          });
        }
      }

      const patient = await prisma.patient.create({
        data: {
          firstName: names[0] || '',
          lastName: names.length > 1 ? names.slice(1).join(' ') : '',
          telephone: data.telephonePrincipale || '',
          telephoneTwo: data.telephoneSecondaire || '',
          governorate: data.governorate || null,
          delegation: data.delegation || null,
          detailedAddress: data.detailedAddress || null,
          dateOfBirth: data.dateNaissance ? new Date(data.dateNaissance) : null,
          cin: data.cin || '',
          cnamId: data.identifiantCNAM || '',
          height: data.taille ? parseFloat(data.taille) : null,
          weight: data.poids ? parseFloat(data.poids) : null,
          medicalHistory: data.antecedant || '',
          descriptionNumOne: data.descriptionNom || '',
          descriptionNumTwo: data.descriptionTelephone || '',
          affiliation: (data.caisseAffiliation as Affiliation) || 'CNSS',
          beneficiaryType: (data.beneficiaire as BeneficiaryType) || 'ASSURE_SOCIAL',
          doctor: doctorId ? {
            connect: { id: doctorId }
          } : undefined, // Properly handle doctor connection/disconnection
          technician: data.technicienResponsable ? {
            connect: { id: data.technicienResponsable }
          } : undefined, // Properly handle technician connection/disconnection
          supervisor: data.superviseur ? {
            connect: { id: data.superviseur }
          } : undefined, // Properly handle supervisor connection/disconnection
          assignedTo: {
            connect: {
              id: session.user.id
            }
          }
        },
        include: {
          doctor: {
            include: {
              user: true
            }
          },
          technician: true,
          supervisor: true,
          assignedTo: true,
          files: true
        }
      });
      
      // Handle temporary files if any
      let tempFiles = [];
      if (data.existingFiles) {
        try {
          tempFiles = typeof data.existingFiles === 'string' 
            ? JSON.parse(data.existingFiles) 
            : data.existingFiles;
          console.log('Found temporary files to move:', tempFiles);
        } catch (error) {
          console.error('Error parsing existingFiles:', error);
        }
      }
      
      if (tempFiles.length > 0) {
        try {
          const moveResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/files/move-temp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.cookie || ''
            },
            body: JSON.stringify({
              tempFiles,
              patientId: patient.id
            })
          });
          
          if (!moveResponse.ok) {
            console.error('Failed to move temporary files:', await moveResponse.text());
          } else {
            const movedFiles = await moveResponse.json();
            console.log('Successfully moved temporary files for patient:', patient.id, movedFiles);
          }
        } catch (error) {
          console.error('Error moving temporary files:', error);
        }
      }
      
      // Get the updated patient record with files included
      const updatedPatient = await prisma.patient.findUnique({
        where: { id: patient.id },
        include: {
          doctor: {
            include: {
              user: true
            }
          },
          technician: true,
          supervisor: true,
          assignedTo: true,
          files: true
        }
      });
        
      return res.status(200).json(updatedPatient);
    } catch (error) {
      console.error('Error creating patient:', error);
      
      // Handle Prisma unique constraint violation errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Get the field(s) that caused the unique constraint violation
          const target = error.meta?.target as string[] || [];
          
          if (target.includes('telephone')) {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: 'telephonePrincipale',
              message: 'Un patient avec ce numéro de téléphone existe déjà' 
            });
          } else if (target.includes('cin') && data.cin) {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: 'cin',
              message: 'Un patient avec ce numéro de CIN existe déjà' 
            });
          } else {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: target.join(', '),
              message: 'Une valeur unique est déjà utilisée par un autre patient' 
            });
          }
        }
      }
      
      res.status(500).json({ error: 'Failed to create patient' });
    }
  } else if (req.method === 'PUT') {
    const form = formidable({});
    const [fields, ] = await form.parse(req);
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value?.[0]])
    );

    try {
      if (!data.id) {
        res.status(400).json({ error: 'Patient ID is required' });
        return;
      }

      // First verify the doctor exists if one is specified
      let doctorId = null;
      if (data.medecin) {
        // Look up doctor by userId (which is the user.id)
        const doctor = await prisma.doctor.findFirst({
          where: {
            userId: data.medecin
          }
        });
        if (doctor) {
          doctorId = doctor.id;
          console.log('Doctor found with ID:', doctorId, 'for user ID:', data.medecin);
        } else {
          console.log('No doctor record found for user ID:', data.medecin);
        }
      }

      // Check if telephone number is being changed and if it's already in use by another patient
      if (data.telephonePrincipale) {
        const existingPatient = await prisma.patient.findFirst({
          where: { 
            AND: [
              { telephone: data.telephonePrincipale },
              { id: { not: data.id } }
            ]
          }
        });
        
        if (existingPatient) {
          return res.status(409).json({ 
            error: 'Duplicate patient', 
            field: 'telephonePrincipale',
            message: 'Un patient avec ce numéro de téléphone existe déjà',
            patientId: existingPatient.id 
          });
        }
      }

      // Get existing files if this is an update

      // Log all form data fields to see what's being received
      console.log('All form data fields (update):', Object.keys(data));
      console.log('existingFilesData (update):', data.existingFilesData);
      console.log('existingFiles (update):', data.existingFiles);
      console.log('Hidden input value (update):', data.existingFilesData);
      
      // Check for files in the hidden input field first
      let existingFilesData = [];
      
      if (data.existingFilesData) {
        try {
          // Parse the JSON string from the hidden field
          existingFilesData = JSON.parse(data.existingFilesData);
          console.log('Found files in hidden field (update):', existingFilesData);
        } catch (error) {
          console.error('Error parsing existingFilesData (update):', error);
        }
      } else if (data.existingFiles) {
        try {
          // Try the regular field as fallback
          existingFilesData = typeof data.existingFiles === 'string'
            ? JSON.parse(data.existingFiles)
            : data.existingFiles;
          console.log('Found files in regular field (update):', existingFilesData);
        } catch (error) {
          console.error('Error parsing existingFiles (update):', error);
        }
      }

      
      // Files are now handled by the dedicated /api/files endpoint
      
      // File handling has been moved to the dedicated /api/files endpoint
      

      const names = data.nomComplet?.split(' ') || [];
      
      // Debug log to see what data is being received
      console.log('Form data received:', data);

      // Verify the doctor exists if one is specified
      let updateDoctorId = null;
      if (data.medecin) {
        // Look up doctor by userId (which is the user.id)
        const doctor = await prisma.doctor.findFirst({
          where: {
            userId: data.medecin
          }
        });
        if (doctor) {
          updateDoctorId = doctor.id;
          console.log('Doctor found with ID:', updateDoctorId, 'for user ID:', data.medecin);
        } else {
          console.log('No doctor record found for user ID:', data.medecin);
        }
      }

      const patient = await prisma.patient.update({
        where: { id: data.id },
        data: {
          firstName: names[0] || '',
          lastName: names.length > 1 ? names.slice(1).join(' ') : '',
          telephone: data.telephonePrincipale || '',
          telephoneTwo: data.telephoneSecondaire || '',
          governorate: data.governorate || null,
          delegation: data.delegation || null,
          detailedAddress: data.detailedAddress || null,
          dateOfBirth: data.dateNaissance ? new Date(data.dateNaissance) : null,
          cin: data.cin || '',
          cnamId: data.identifiantCNAM || '',
          height: data.taille ? parseFloat(data.taille) : null,
          weight: data.poids ? parseFloat(data.poids) : null,
          medicalHistory: data.antecedant || '',
          descriptionNumOne: data.descriptionNom || '',
          descriptionNumTwo: data.descriptionTelephone || '',
          affiliation: (data.caisseAffiliation as Affiliation) || 'CNSS',
          beneficiaryType: (data.beneficiaire as BeneficiaryType) || 'ASSURE_SOCIAL',
          doctor: doctorId ? {
            connect: { id: doctorId }
          } : undefined, // Properly handle doctor connection/disconnection
          technician: data.technicienResponsable ? {
            connect: { id: data.technicienResponsable }
          } : undefined, // Properly handle technician connection/disconnection
          supervisor: data.superviseur ? {
            connect: { id: data.superviseur }
          } : undefined
          // Removed updateFileData from here
        },
        include: {
          doctor: {
            include: {
              user: true
            }
          },
          technician: true,
          supervisor: true,
          assignedTo: true,
          files: true
        }
      });
      
      // Files are now handled by the dedicated /api/files endpoint
      
      res.status(200).json(patient);
    } catch (error) {
      console.error('Error updating patient:', error);
      
      // Handle Prisma unique constraint violation errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Get the field(s) that caused the unique constraint violation
          const target = error.meta?.target as string[] || [];
          
          if (target.includes('telephone')) {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: 'telephonePrincipale',
              message: 'Un patient avec ce numéro de téléphone existe déjà' 
            });
          } else if (target.includes('cin') && data.cin) {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: 'cin',
              message: 'Un patient avec ce numéro de CIN existe déjà' 
            });
          } else {
            return res.status(409).json({ 
              error: 'Duplicate patient', 
              field: target.join(', '),
              message: 'Une valeur unique est déjà utilisée par un autre patient' 
            });
          }
        }
      }
      
      res.status(500).json({ error: 'Failed to update patient' });
    }

  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'Patient ID is required' });
        return;
      }

      // First delete associated files
      await prisma.file.deleteMany({
        where: {
          patientId: id
        }
      });

      // Then delete the patient
      await prisma.patient.delete({
        where: { id }
      });

      res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ error: 'Failed to delete patient' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
