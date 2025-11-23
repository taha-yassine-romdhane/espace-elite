import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid technician ID' });
  }

  if (req.method === 'GET') {
    try {
      // First get the technician to find the associated user
      const technician = await prisma.technician.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!technician) {
        return res.status(404).json({ error: 'Technician not found' });
      }

      // Get all rentals (installations) by this technician
      // We'll use the Rental model which tracks device installations to patients
      const installations = await prisma.rental.findMany({
        where: {
          patient: {
            technicianId: technician.userId
          }
        },
        include: {
          medicalDevice: {
            include: {
              deviceParameters: {
                select: {
                  id: true,
                  deviceType: true,
                  pressionRampe: true,
                  dureeRampe: true,
                  pression: true,
                  ipap: true,
                  epap: true,
                  debit: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              doctorId: true,
              doctor: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      // Define the type for the parameters to match Prisma schema
      type DeviceParameter = {
        id: string;
        deviceType: string | null;
        pressionRampe: string | null;
        dureeRampe: number | null;
        pression: string | null;
        ipap: string | null;
        epap: string | null;
        debit: string | null;
      };
      
      // Transform the data to match our expected interface
      const formattedInstallations = installations.map(rental => ({
        id: rental.id,
        medicalDeviceId: rental.medicalDeviceId,
        medicalDevice: {
          id: rental.medicalDevice.id,
          name: rental.medicalDevice.name,
          type: rental.medicalDevice.type,
          brand: rental.medicalDevice.brand || '',
          model: rental.medicalDevice.model || ''
        },
        patientId: rental.patientId,
        patient: {
          id: rental.patient.id,
          firstName: rental.patient.firstName,
          lastName: rental.patient.lastName
        },
        installationDate: rental.startDate.toISOString(),
        parameters: (rental.medicalDevice.deviceParameters || []).map((param: DeviceParameter) => ({
          id: param.id,
          title: param.deviceType || '',
          value: param.pression || param.ipap || param.debit || param.pressionRampe || '',
          unit: param.deviceType === 'Concentrateur O²' || param.deviceType === 'Bouteil O²' ? 'L/min' : 'cmH₂O'
        })),
        doctorId: rental.patient.doctorId || '',
        doctor: rental.patient.doctor
          ? {
              id: rental.patient.doctor.id,
              user: {
                firstName: rental.patient.doctor.user.firstName,
                lastName: rental.patient.doctor.user.lastName
              }
            }
          : undefined
      }));

      return res.status(200).json(formattedInstallations);
    } catch (error) {
      console.error('Error fetching technician installations:', error);
      return res.status(500).json({ error: 'Error fetching technician installations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
