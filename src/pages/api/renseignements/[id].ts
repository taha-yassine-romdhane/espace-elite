import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'You must be logged in to access this resource' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }

  try {
    if (req.method === 'GET') {
      // First, try to find a patient with this ID
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          doctor: true,
          technician: true,
          files: true,
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
      });

      if (patient) {
        try {
          // Get doctor name if available
          let doctorName = 'Non assigné';
          let doctorId = null;
          if (patient.doctor) {
            doctorId = patient.doctor.id;
            try {
              // Get the linked user for the doctor
              const doctorUser = await prisma.user.findUnique({
                where: { id: patient.doctor.userId },
                select: { firstName: true, lastName: true }
              });
              if (doctorUser) {
                doctorName = `${doctorUser.firstName} ${doctorUser.lastName}`;
              }
            } catch (error) {
              console.error('Error fetching doctor user:', error);
            }
          }
          
          // Get technician name if available
          let technicianName = 'Non assigné';
          let technicianId = null;
          if (patient.technician) {
            technicianId = patient.technician.id;
            technicianName = `${patient.technician.firstName} ${patient.technician.lastName}`;
          } 
          
          // Get assigned user name if available
          let assignedToName = 'Non assigné';
          let assignedToId = patient.userId;
          if (patient.assignedTo) {
            assignedToId = patient.assignedTo.id;
            assignedToName = `${patient.assignedTo.firstName} ${patient.assignedTo.lastName}`;
          }
          
          // Transform the patient data to match the expected format
          const formattedPatient = {
            id: patient.id,
            type: 'Patient',
            nom: `${patient.firstName} ${patient.lastName}`,
            telephone: patient.telephone,
            telephoneSecondaire: patient.telephoneTwo,
            adresse: patient.address,
            cin: patient.cin,
            dateNaissance: patient.dateOfBirth,
            taille: patient.height,
            poids: patient.weight,
            antecedant: patient.antecedant,
            identifiantCNAM: patient.cnamId,
            beneficiaire: patient.beneficiaryType,
            caisseAffiliation: patient.affiliation,
            doctor: patient.doctor ? {
              id: doctorId,
              name: doctorName
            } : null,
            technician: patient.technician ? {
              id: technicianId,
              name: technicianName
            } : null,
            assignedTo: {
              id: assignedToId,
              name: assignedToName
            },
            files: patient.files || [],
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
          };
          return res.status(200).json(formattedPatient);
        } catch (error) {
          console.error('Error processing patient data:', error);
          return res.status(500).json({ error: 'Error processing patient data' });
        }
      }

      // If not found as patient, try to find as company
      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          technician: true,
          files: true,
          assignedTo: true
        },
      });

      if (company) {
        try {
          // Get technician name if available
          let technicianName = 'Non assigné';
          let technicianId = null;
          if (company.technician) {
            technicianId = company.technician.id;
            technicianName = `${company.technician.firstName} ${company.technician.lastName}`;
          } 
          
          // Get assigned user name if available
          let assignedToName = 'Non assigné';
          let assignedToId = company.userId;
          if (company.assignedTo) {
            assignedToId = company.assignedTo.id;
            assignedToName = `${company.assignedTo.firstName} ${company.assignedTo.lastName}`;
          }
          
          // Transform the company data to match the expected format
          const formattedCompany = {
            id: company.id,
            type: 'Société',
            nom: company.companyName,
            nomSociete: company.companyName,
            telephone: company.telephone,
            telephoneSecondaire: company.telephoneSecondaire,
            adresse: company.address,
            matriculeFiscale: company.taxId,
            descriptionNom: company.nameDescription,
            descriptionTelephone: company.phoneDescription,
            descriptionAdresse: company.addressDescription,
            technician: company.technician ? {
              id: technicianId,
              name: technicianName
            } : null,
            assignedTo: {
              id: assignedToId,
              name: assignedToName
            },
            files: company.files || [],
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          };
          return res.status(200).json(formattedCompany);
        } catch (error) {
          console.error('Error processing company data:', error);
          return res.status(500).json({ error: 'Error processing company data' });
        }
      }

      // If not found in either table
      return res.status(404).json({ error: 'Renseignement not found' });
    } 
    else if (req.method === 'PATCH') {
      const data = req.body;
      
      // First, try to determine if we're updating a patient or company
      const patient = await prisma.patient.findUnique({ where: { id } });
      
      if (patient) {
        // If it's a patient, prepare the data for patient update
        const patientUpdateData: any = {};
        
        // Map the data from the request to the correct patient schema fields
        if (data.nom) {
          // Split full name into first and last name, assuming format is "First Last"
          const nameParts = data.nom.split(' ');
          if (nameParts.length > 1) {
            patientUpdateData.firstName = nameParts[0];
            patientUpdateData.lastName = nameParts.slice(1).join(' ');
          } else {
            patientUpdateData.firstName = data.nom;
          }
        }
        
        if (data.telephone) patientUpdateData.telephone = data.telephone;
        if (data.telephoneSecondaire) patientUpdateData.telephoneTwo = data.telephoneSecondaire;
        if (data.adresse) patientUpdateData.address = data.adresse;
        if (data.cin) patientUpdateData.cin = data.cin;
        if (data.dateNaissance) patientUpdateData.dateOfBirth = new Date(data.dateNaissance);
        if (data.taille) patientUpdateData.height = parseFloat(data.taille);
        if (data.poids) patientUpdateData.weight = parseFloat(data.poids);
        if (data.antecedant) patientUpdateData.antecedant = data.antecedant;
        if (data.identifiantCNAM) patientUpdateData.cnamId = data.identifiantCNAM;
        if (data.beneficiaire) patientUpdateData.beneficiaryType = data.beneficiaire;
        if (data.caisseAffiliation) patientUpdateData.affiliation = data.caisseAffiliation;
        
        // Update the patient
        const updatedPatient = await prisma.patient.update({
          where: { id },
          data: patientUpdateData,
          include: {
            doctor: {
              select: {
                id: true,
              },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            },
            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: true,
            assignedTo: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          },
        });

        // Format the response to match the expected format
        const formattedPatient = {
          id: updatedPatient.id,
          type: 'Patient',
          nom: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
          telephone: updatedPatient.telephone,
          telephoneSecondaire: updatedPatient.telephoneTwo,
          adresse: updatedPatient.address,
          cin: updatedPatient.cin,
          dateNaissance: updatedPatient.dateOfBirth,
          taille: updatedPatient.height,
          poids: updatedPatient.weight,
          antecedant: updatedPatient.antecedant,
          identifiantCNAM: updatedPatient.cnamId,
          beneficiaire: updatedPatient.beneficiaryType,
          caisseAffiliation: updatedPatient.affiliation,
          doctor: updatedPatient.doctor ? {
            id: updatedPatient.doctor.id,
            name: updatedPatient.doctor.user ? `${updatedPatient.doctor.user.firstName} ${updatedPatient.doctor.user.lastName}` : 'Unknown',
          } : null,
          technician: updatedPatient.technician ? {
            id: updatedPatient.technician.id,
            name: `${updatedPatient.technician.firstName} ${updatedPatient.technician.lastName}`,
          } : null,
          files: updatedPatient.files,
          createdAt: updatedPatient.createdAt,
          updatedAt: updatedPatient.updatedAt,
        };

        return res.status(200).json(formattedPatient);
      } else {
        // Try to find and update a company
        const company = await prisma.company.findUnique({ where: { id } });
        
        if (company) {
          // Prepare the data for company update
          const companyUpdateData: any = {};
          
          if (data.nomSociete) companyUpdateData.companyName = data.nomSociete;
          if (data.nom) companyUpdateData.companyName = data.nom;
          if (data.telephone) companyUpdateData.telephone = data.telephone;
          if (data.telephoneSecondaire) companyUpdateData.telephoneSecondaire = data.telephoneSecondaire;
          if (data.adresse) companyUpdateData.address = data.adresse;
          if (data.matriculeFiscale) companyUpdateData.taxId = data.matriculeFiscale;
          if (data.descriptionNom) companyUpdateData.nameDescription = data.descriptionNom;
          if (data.descriptionTelephone) companyUpdateData.phoneDescription = data.descriptionTelephone;
          if (data.descriptionAdresse) companyUpdateData.addressDescription = data.descriptionAdresse;
          
          // Update the company
          const updatedCompany = await prisma.company.update({
            where: { id },
            data: companyUpdateData,
            include: {
              technician: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              files: true,
              assignedTo: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              }
            },
          });

          // Format the response
          const formattedCompany = {
            id: updatedCompany.id,
            type: 'Société',
            nom: updatedCompany.companyName,
            nomSociete: updatedCompany.companyName,
            telephone: updatedCompany.telephone,
            telephoneSecondaire: updatedCompany.telephoneSecondaire,
            adresse: updatedCompany.address,
            matriculeFiscale: updatedCompany.taxId,
            descriptionNom: updatedCompany.nameDescription,
            descriptionTelephone: updatedCompany.phoneDescription,
            descriptionAdresse: updatedCompany.addressDescription,
            technician: updatedCompany.technician ? {
              id: updatedCompany.technician.id,
              name: `${updatedCompany.technician.firstName} ${updatedCompany.technician.lastName}`,
            } : null,
            files: updatedCompany.files,
            createdAt: updatedCompany.createdAt,
            updatedAt: updatedCompany.updatedAt,
          };

          return res.status(200).json(formattedCompany);
        } else {
          return res.status(404).json({ error: 'Renseignement not found' });
        }
      }
    }
    else if (req.method === 'DELETE') {
      // Try to find and delete a patient first
      const patient = await prisma.patient.findUnique({ where: { id } });
      
      if (patient) {
        // First, delete any associated files
        await prisma.file.deleteMany({
          where: { patientId: id }
        });
        
        // Then, delete the patient record
        await prisma.patient.delete({
          where: { id },
        });
        
        return res.status(200).json({ message: 'Patient deleted successfully' });
      }
      
      // If not a patient, try to find and delete a company
      const company = await prisma.company.findUnique({ where: { id } });
      
      if (company) {
        // First, delete any associated files
        await prisma.file.deleteMany({
          where: { companyId: id }
        });
        
        // Then, delete the company record
        await prisma.company.delete({
          where: { id },
        });
        
        return res.status(200).json({ message: 'Company deleted successfully' });
      }
      
      // If we got here, the ID doesn't exist in either table
      return res.status(404).json({ error: 'Renseignement not found' });
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}
