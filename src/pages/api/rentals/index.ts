import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Fetch all rentals with related data
        const rentals = await prisma.rental.findMany({
          include: {
            medicalDevice: true,
            patient: true,
            Company: true,
            payment: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        // Transform the data to match the expected format in the frontend
        const transformedRentals = rentals.map(rental => ({
          id: rental.id,
          medicalDeviceId: rental.medicalDeviceId,
          medicalDevice: {
            id: rental.medicalDevice.id,
            name: rental.medicalDevice.name,
            type: rental.medicalDevice.type,
            brand: rental.medicalDevice.brand || null,
            model: rental.medicalDevice.model || null,
            serialNumber: rental.medicalDevice.serialNumber || null,
          },
          patientId: rental.patientId,
          patient: rental.patient ? {
            id: rental.patient.id,
            firstName: rental.patient.firstName,
            lastName: rental.patient.lastName,
            telephone: rental.patient.telephone,
          } : null,
          companyId: rental.companyId || null,
          company: rental.Company ? {
            id: rental.Company.id,
            companyName: rental.Company.companyName,
            telephone: rental.Company.telephone,
          } : null,
          startDate: rental.startDate,
          endDate: rental.endDate,
          notes: rental.notes || null,
          paymentId: rental.paymentId || null,
          payment: rental.payment ? {
            id: rental.payment.id,
            amount: rental.payment.amount,
            status: rental.payment.status,
            method: rental.payment.method,
          } : null,
          createdAt: rental.createdAt,
          updatedAt: rental.updatedAt,
        }));

        return res.status(200).json({ rentals: transformedRentals });

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
