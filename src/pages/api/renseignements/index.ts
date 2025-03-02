import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { Role, Affiliation, BeneficiaryType } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    switch (req.method) {
      case 'GET': {
        const [patients, companies] = await Promise.all([
          prisma.patient.findMany({
            include: {
              doctor: {
                include: {
                  user: true
                }
              },
              technician: true,
              assignedTo: true,
              files: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }),
          prisma.company.findMany({
            include: {
              technician: true,
              assignedTo: true,
              files: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          })
        ]);

        const transformedPatients = patients.map((patient) => ({
          id: patient.id,
          type: 'Patient' as const,
          nom: `${patient.firstName} ${patient.lastName}`,
          adresse: patient.address || '',
          telephone: patient.telephone,
          telephoneSecondaire: patient.telephoneTwo,
          doctor: patient.doctor?.user ? {
            id: patient.doctor.user.id,
            name: `${patient.doctor.user.firstName} ${patient.doctor.user.lastName}`,
            role: patient.doctor.user.role as Role
          } : null,
          technician: patient.technician ? {
            id: patient.technician.id,
            name: `${patient.technician.firstName} ${patient.technician.lastName}`,
            role: patient.technician.role
          } : null,
          dateNaissance: patient.dateOfBirth,
          cin: patient.cin,
          identifiantCNAM: patient.cnamId,
          antecedant: patient.medicalHistory,
          taille: patient.height,
          poids: patient.weight,
          imc: patient.height && patient.weight
            ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
            : null,
          description1: patient.descriptionNumOne,
          description2: patient.descriptionNumTwo,
          caisseAffiliation: patient.affiliation as Affiliation,
          beneficiaire: patient.beneficiaryType as BeneficiaryType,
          files: patient.files?.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
            id: file.id,
            url: file.url,
            type: file.type,
            createdAt: file.createdAt
          })) || [],
          createdAt: patient.createdAt
        }));

        const transformedCompanies = companies.map((company ) => ({
          id: company.id,
          type: 'Société' as const,
          nom: company.companyName,
          adresse: company.address || '',
          telephone: company.telephone,
          telephoneSecondaire: company.telephoneSecondaire,
          matriculeFiscale: company.taxId,
          technician: company.technician ? {
            id: company.technician.id,
            name: `${company.technician.firstName} ${company.technician.lastName}`,
            role: company.technician.role as Role
          } : null,
          descriptionNom: company.nameDescription,
          descriptionTelephone: company.phoneDescription,
          descriptionAdresse: company.addressDescription,
          files: company.files?.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
            id: file.id,
            url: file.url,
            type: file.type,
            createdAt: file.createdAt
          })) || [],
          createdAt: company.createdAt
        }));

        // Sort all items by creation date
        const allItems = [...transformedPatients, ...transformedCompanies]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.status(200).json(allItems);
        return;
      }

      case 'POST': {
        const { type, imageUrl, ...data } = req.body;

        if (type === 'Patient') {
          try {
            // Validate CIN
            if (data.cin && !/^\d{8}$/.test(data.cin)) {
              res.status(400).json({ error: 'CIN must be exactly 8 digits' });
              return;
            }

            // Validate CNAM ID if CNAM is true
            if (data.cnam === 'true' && (!data.identifiantCNAM || !/^[0-9A-Z]{1,12}$/.test(data.identifiantCNAM))) {
              res.status(400).json({ error: 'Invalid CNAM ID format' });
              return;
            }

            // Validate height and weight
            const height = data.taille ? parseFloat(data.taille) : null;
            const weight = data.poids ? parseFloat(data.poids) : null;

            if (height !== null && (height < 0 || height > 250)) {
              res.status(400).json({ error: 'Height must be between 0 and 250 cm' });
              return;
            }

            if (weight !== null && (weight < 0 || weight > 500)) {
              res.status(400).json({ error: 'Weight must be between 0 and 500 kg' });
              return;
            }

            let doctor = await prisma.doctor.findFirst({
              where: {
                userId: data.medecin
              },
              include: {
                user: true
              }
            });

            if (!doctor) {
              const user = await prisma.user.findUnique({
                where: {
                  id: data.medecin,
                  role: 'DOCTOR'
                }
              });

              if (user) {
                doctor = await prisma.doctor.create({
                  data: {
                    userId: user.id
                  },
                  include: {
                    user: true
                  }
                });
              } else {
                res.status(400).json({ error: 'Doctor not found and could not be created' });
                return;
              }
            }

            const patient = await prisma.patient.create({
              data: {
                firstName: data.nomComplet.split(' ')[0],
                lastName: data.nomComplet.split(' ')[1],
                telephone: data.telephonePrincipale,
                telephoneTwo: data.telephoneSecondaire,
                address: data.adresseComplete,
                cin: data.cin,
                cnamId: data.cnam === 'true' ? data.identifiantCNAM : null,
                dateOfBirth: new Date(data.dateNaissance),
                weight: weight,
                height: height,
                imc: weight && height ? parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1)) : null,
                medicalHistory: data.medicalHistory,
                descriptionNumOne: data.description1,
                descriptionNumTwo: data.description2,
                affiliation: data.affiliation as Affiliation,
                beneficiaryType: data.beneficiaire as BeneficiaryType,
                doctorId: doctor.id,
                technicianId: data.technicienResponsable || null,
                userId: session.user.id,
                files: imageUrl ? {
                  create: {
                    url: imageUrl,
                    type: 'IMAGE'
                  }
                } : undefined
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

            res.status(201).json({
              id: patient.id,
              type: 'Patient',
              nom: `${patient.firstName} ${patient.lastName}`,
              adresse: patient.address,
              telephone: patient.telephone,
              telephoneSecondaire: patient.telephoneTwo,
              doctor: patient.doctor?.user ? {
                id: patient.doctor.user.id,
                name: `${patient.doctor.user.firstName} ${patient.doctor.user.lastName}`,
                role: patient.doctor.user.role as Role
              } : null,
              technician: patient.technician ? {
                id: patient.technician.id,
                name: `${patient.technician.firstName} ${patient.technician.lastName}`,
                role: patient.technician.role
              } : null,
              dateNaissance: patient.dateOfBirth,
              cin: patient.cin,
              identifiantCNAM: patient.cnamId,
              cnam: !!patient.cnamId,
              taille: patient.height,
              poids: patient.weight,
              imc: patient.imc,
              descriptionNumOne: patient.descriptionNumOne,
              descriptionNumTwo: patient.descriptionNumTwo,
              caisseAffiliation: patient.affiliation as Affiliation,
              beneficiaryType: patient.beneficiaryType as BeneficiaryType,
              files: patient.files.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
                id: file.id,
                url: file.url,
                type: file.type,
                createdAt: file.createdAt
              })),
              createdAt: patient.createdAt
            });
            return;
          } catch (error) {
            console.error('Error creating patient:', error);
            res.status(400).json({ error: 'Failed to create patient: ' + (error instanceof Error ? error.message : 'Unknown error') });
            return;
          }
        } else if (type === 'Société') {
          try {
            const company = await prisma.company.create({
              data: {
                companyName: data.nomSociete,
                telephone: data.telephonePrincipale,
                telephoneSecondaire: data.telephoneSecondaire,
                address: data.adresseComplete,
                taxId: data.matriculeFiscale,
                nameDescription: data.descriptionNom,
                phoneDescription: data.descriptionTelephone,
                addressDescription: data.descriptionAdresse,
                userId: session.user.id,
                technicianId: data.technicienResponsable || null,
                files: imageUrl ? {
                  create: {
                    url: imageUrl,
                    type: 'IMAGE'
                  }
                } : undefined
              },
              include: {
                technician: true,
                assignedTo: true,
                files: true
              }
            });

            res.status(201).json({
              id: company.id,
              type: 'Société',
              nom: company.companyName,
              adresse: company.address,
              telephone: company.telephone,
              telephoneSecondaire: company.telephoneSecondaire,
              matriculeFiscale: company.taxId,
              technician: company.technician ? {
                id: company.technician.id,
                name: `${company.technician.firstName} ${company.technician.lastName}`,
                role: company.technician.role as Role
              } : null,
              descriptionNom: company.nameDescription,
              descriptionTelephone: company.phoneDescription,
              descriptionAdresse: company.addressDescription,
              files: company.files.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
                id: file.id,
                url: file.url,
                type: file.type,
                createdAt: file.createdAt
              })),
              createdAt: company.createdAt
            });
            return;
          } catch (error) {
            console.error('Error creating company:', error);
            res.status(400).json({ error: 'Failed to create company: ' + (error instanceof Error ? error.message : 'Unknown error') });
            return;
          }
        }

        res.status(400).json({ error: 'Invalid type' });
        return;
      }

      case 'PUT': {
        const { id, type, imageUrl: updateImageUrl, ...updateData } = req.body;

        if (!id) {
          res.status(400).json({ error: 'ID is required for updates' });
          return;
        }

        if (type === 'Patient') {
          try {
            // Validate CIN
            if (updateData.cin && !/^\d{8}$/.test(updateData.cin)) {
              res.status(400).json({ error: 'CIN must be exactly 8 digits' });
              return;
            }

            // Validate CNAM ID if CNAM is true
            if (updateData.cnam === 'true' && (!updateData.identifiantCNAM || !/^[0-9A-Z]{1,12}$/.test(updateData.identifiantCNAM))) {
              res.status(400).json({ error: 'Invalid CNAM ID format' });
              return;
            }

            // Validate height and weight
            const height = updateData.taille ? parseFloat(updateData.taille) : null;
            const weight = updateData.poids ? parseFloat(updateData.poids) : null;

            if (height !== null && (height < 0 || height > 250)) {
              res.status(400).json({ error: 'Height must be between 0 and 250 cm' });
              return;
            }

            if (weight !== null && (weight < 0 || weight > 500)) {
              res.status(400).json({ error: 'Weight must be between 0 and 500 kg' });
              return;
            }

            let doctor = await prisma.doctor.findFirst({
              where: {
                userId: updateData.medecin
              }
            });

            if (!doctor) {
              const user = await prisma.user.findUnique({
                where: {
                  id: updateData.medecin,
                  role: 'DOCTOR'
                }
              });

              if (user) {
                doctor = await prisma.doctor.create({
                  data: {
                    userId: user.id
                  }
                });
              } else {
                res.status(400).json({ error: 'Doctor not found and could not be created' });
                return;
              }
            }

            const patient = await prisma.patient.update({
              where: { id },
              data: {
                firstName: updateData.nomComplet.split(' ')[0],
                lastName: updateData.nomComplet.split(' ')[1],
                telephone: updateData.telephonePrincipale,
                telephoneTwo: updateData.telephoneSecondaire,
                address: updateData.adresseComplete,
                cin: updateData.cin,
                cnamId: updateData.cnam === 'true' ? updateData.identifiantCNAM : null,
                dateOfBirth: new Date(updateData.dateNaissance),
                weight: weight,
                height: height,
                imc: weight && height ? parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1)) : null,
                medicalHistory: updateData.antecedant,
                descriptionNumOne: updateData.description1,
                descriptionNumTwo: updateData.description2,
                affiliation: updateData.caisseAffiliation as Affiliation,
                beneficiaryType: updateData.beneficiaire as BeneficiaryType,
                doctorId: doctor.id,
                technicianId: updateData.technicienResponsable || null,
                files: updateImageUrl ? {
                  deleteMany: {},
                  create: {
                    url: updateImageUrl,
                    type: 'IMAGE'
                  }
                } : undefined
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

            res.status(200).json({
              id: patient.id,
              type: 'Patient',
              nom: `${patient.firstName} ${patient.lastName}`,
              adresse: patient.address || '',
              telephone: patient.telephone,
              telephoneSecondaire: patient.telephoneTwo,
              doctor: patient.doctor?.user ? {
                id: patient.doctor.user.id,
                name: `${patient.doctor.user.firstName} ${patient.doctor.user.lastName}`,
                role: patient.doctor.user.role
              } : null,
              technician: patient.technician ? {
                id: patient.technician.id,
                name: `${patient.technician.firstName} ${patient.technician.lastName}`,
                role: patient.technician.role
              } : null,
              dateNaissance: patient.dateOfBirth,
              cin: patient.cin,
              identifiantCNAM: patient.cnamId,
              antecedant: patient.antecedant,
              taille: patient.height,
              poids: patient.weight,
              imc: patient.height && patient.weight
                ? (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)
                : null,
              description1: patient.descriptionNumOne,
              description2: patient.descriptionNumTwo,
              caisseAffiliation: patient.affiliation,
              beneficiaire: patient.beneficiaryType as BeneficiaryType ,
              files: patient.files.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
                id: file.id,
                url: file.url,
                type: file.type,
                createdAt: file.createdAt
              })),
              createdAt: patient.createdAt
            });
            return;
          } catch (error) {
            console.error('Error updating patient:', error);
            res.status(400).json({ error: 'Failed to update patient: ' + (error instanceof Error ? error.message : 'Unknown error') });
            return;
          }
        } else if (type === 'Société') {
          try {
            const company = await prisma.company.update({
              where: { id },
              data: {
                companyName: updateData.nomSociete,
                telephone: updateData.telephonePrincipale,
                telephoneSecondaire: updateData.telephoneSecondaire,
                address: updateData.adresseComplete,
                taxId: updateData.matriculeFiscale,
                nameDescription: updateData.descriptionNom,
                phoneDescription: updateData.descriptionTelephone,
                addressDescription: updateData.descriptionAdresse,
                technicianId: updateData.technicienResponsable || null,
                files: updateImageUrl ? {
                  deleteMany: {},
                  create: {
                    url: updateImageUrl,
                    type: 'IMAGE'
                  }
                } : undefined
              },
              include: {
                technician: true,
                assignedTo: true,
                files: true
              }
            });

            res.status(200).json({
              id: company.id,
              type: 'Société',
              nom: company.companyName,
              adresse: company.address || '',
              telephone: company.telephone,
              telephoneSecondaire: company.telephoneSecondaire,
              matriculeFiscale: company.taxId,
              technician: company.technician ? {
                id: company.technician.id,
                name: `${company.technician.firstName} ${company.technician.lastName}`,
                role: company.technician.role
              } : null,
              descriptionNom: company.nameDescription,
              descriptionTelephone: company.phoneDescription,
              descriptionAdresse: company.addressDescription,
              files: company.files.map((file: { id: string; url: string; type: string; createdAt: Date; }) => ({
                id: file.id,
                url: file.url,
                type: file.type,
                createdAt: file.createdAt
              })),
              createdAt: company.createdAt
            });
            return;
          } catch (error) {
            console.error('Error updating company:', error);
            res.status(400).json({ error: 'Failed to update company: ' + (error instanceof Error ? error.message : 'Unknown error') });
            return;
          }
        }

        res.status(400).json({ error: 'Invalid type' });
        return;
      }

      case 'DELETE': {
        const deleteId = req.query.id as string;
        const type = req.query.type as string;

        if (!deleteId) {
          res.status(400).json({ error: 'ID is required for deletion' });
          return;
        }

        try {
          if (type === 'Patient') {
            await prisma.patient.delete({
              where: { id: deleteId }
            });
          } else if (type === 'Société') {
            await prisma.company.delete({
              where: { id: deleteId }
            });
          } else {
            res.status(400).json({ error: 'Invalid type' });
            return;
          }

          res.status(200).json({ message: 'Deleted successfully' });
          return;
        } catch (error) {
          console.error('Error deleting:', error);
          res.status(400).json({ error: 'Failed to delete: ' + (error instanceof Error ? error.message : 'Unknown error') });
          return;
        }
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}