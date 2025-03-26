import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Affiliation, BeneficiaryType } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

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

  if (req.method === 'POST') {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, value?.[0]])
    );

    try {
      // Handle file upload if present
      let fileData = {};
      if (files.files) {
        const filesToUpload = Array.isArray(files.files) ? files.files : [files.files];
        console.log('Processing files:', filesToUpload.length, 'files');
        
        const uploadPromises = filesToUpload.map(async (file) => {
          console.log('Processing file:', file.originalFilename);
          const bytes = await fs.readFile(file.filepath);
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${file.originalFilename}`;
          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, bytes);
          console.log('File saved to:', filePath);
          return {
            url: `/uploads/${fileName}`,
            type: 'IMAGE'
          };
        });

        const processedFiles = await Promise.all(uploadPromises);
        console.log('Uploaded files:', processedFiles);

        if (processedFiles.length > 0) {
          fileData = {
            files: {
              create: processedFiles
            }
          };
        }
      }

      const names = data.nomComplet?.split(' ') || [];
      
      // Debug log to see what data is being received
      console.log('Form data received:', data);

      // First verify the doctor exists if one is specified
      let doctorId = null;
      if (data.medecin) {
        const doctor = await prisma.doctor.findFirst({
          where: {
            userId: data.medecin
          }
        });
        if (!doctor) {
          res.status(400).json({ error: 'Doctor not found' });
          return;
        }
        doctorId = doctor.id;
      }

      const patient = await prisma.patient.create({
        data: {
          firstName: names[0] || '',
          lastName: names.length > 1 ? names.slice(1).join(' ') : '',
          telephone: data.telephonePrincipale || '',
          telephoneTwo: data.telephoneSecondaire || '',
          address: data.adresseComplete || '',
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
          doctorId: doctorId,
          technicianId: data.technicienResponsable || null,
          userId: session.user.id,
          ...fileData
        },
        include: {
          doctor: {
            include: {
              user: true
            }
          },
          technician: true,
          assignedTo: true,
          files: true
        }
      });

      res.status(200).json(patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ error: 'Failed to create patient' });
    }
  } else if (req.method === 'PUT') {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
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
        const doctor = await prisma.doctor.findFirst({
          where: {
            userId: data.medecin
          }
        });
        if (!doctor) {
          res.status(400).json({ error: 'Doctor not found' });
          return;
        }
        doctorId = doctor.id;
      }

      // Get existing files if this is an update
      let existingFiles = [];
      const currentPatient = await prisma.patient.findUnique({
        where: { id: data.id },
        include: { files: true }
      });
      existingFiles = currentPatient?.files || [];

      // Handle file upload if present
      let updateFileData = {};
      if (files.files) {
        const filesToUpload = Array.isArray(files.files) ? files.files : [files.files];
        console.log('Processing files for update:', filesToUpload.length, 'files');
        
        const uploadPromises = filesToUpload.map(async (file) => {
          console.log('Processing file:', file.originalFilename);
          const bytes = await fs.readFile(file.filepath);
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${file.originalFilename}`;
          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, bytes);
          console.log('File saved to:', filePath);
          return {
            url: `/uploads/${fileName}`,
            type: 'IMAGE'
          };
        });

        const processedFiles = await Promise.all(uploadPromises);
        console.log('Uploaded files:', processedFiles);

        if (processedFiles.length > 0) {
          updateFileData = {
            files: {
              deleteMany: {}, // Remove existing files
              create: processedFiles
            }
          };
        }
      } else if (!files.files && existingFiles.length > 0) {
        // If no new files uploaded but there are existing files, keep them
        updateFileData = {
          files: {
            connect: existingFiles.map(file => ({ id: file.id }))
          }
        };
      }

      const names = data.nomComplet?.split(' ') || [];
      
      // Debug log to see what data is being received
      console.log('Form data received:', data);

      const patient = await prisma.patient.update({
        where: { id: data.id },
        data: {
          firstName: names[0] || '',
          lastName: names.length > 1 ? names.slice(1).join(' ') : '',
          telephone: data.telephonePrincipale || '',
          telephoneTwo: data.telephoneSecondaire || '',
          address: data.adresseComplete || '',
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
          doctorId: doctorId,
          technicianId: data.technicienResponsable || null,
          ...updateFileData
        },
        include: {
          doctor: {
            include: {
              user: true
            }
          },
          technician: true,
          assignedTo: true,
          files: true
        }
      });

      res.status(200).json(patient);
    } catch (error) {
      console.error('Error updating patient:', error);
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
