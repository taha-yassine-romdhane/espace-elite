import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Get statistics for each module
    const [
      patientsCount,
      companiesCount,
      medicalDevicesCount,
      diagnosticDevicesCount,
      accessoriesCount,
      sparePartsCount,
      appointmentsCount,
      transfersCount,
      paymentsCount,
      // Get latest update dates
      latestPatient,
      latestCompany,
      latestMedicalDevice,
      latestDiagnosticDevice,
      latestAccessory,
      latestSparePart,
      latestAppointment,
      latestTransfer,
      latestPayment
    ] = await Promise.all([
      // Counts
      prisma.patient.count(),
      prisma.company.count(),
      prisma.medicalDevice.count({ where: { type: 'MEDICAL_DEVICE' } }),
      prisma.medicalDevice.count({ where: { type: 'DIAGNOSTIC_DEVICE' } }),
      prisma.product.count({ where: { type: 'ACCESSORY' } }),
      prisma.product.count({ where: { type: 'SPARE_PART' } }),
      prisma.appointment.count(),
      prisma.stockTransfer.count(),
      prisma.payment.count(),
      
      // Latest updates
      prisma.patient.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.company.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.medicalDevice.findFirst({
        where: { type: 'MEDICAL_DEVICE' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.medicalDevice.findFirst({
        where: { type: 'DIAGNOSTIC_DEVICE' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.product.findFirst({
        where: { type: 'ACCESSORY' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.product.findFirst({
        where: { type: 'SPARE_PART' },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.appointment.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.stockTransfer.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      }),
      prisma.payment.findFirst({
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      })
    ]);

    // Format the response
    const stats = {
      modules: {
        patients: {
          totalRecords: patientsCount,
          lastUpdate: latestPatient?.updatedAt?.toISOString() || null,
          available: true
        },
        companies: {
          totalRecords: companiesCount,
          lastUpdate: latestCompany?.updatedAt?.toISOString() || null,
          available: true
        },
        medicalDevices: {
          totalRecords: medicalDevicesCount,
          lastUpdate: latestMedicalDevice?.updatedAt?.toISOString() || null,
          available: true
        },
        diagnosticDevices: {
          totalRecords: diagnosticDevicesCount,
          lastUpdate: latestDiagnosticDevice?.updatedAt?.toISOString() || null,
          available: true
        },
        accessories: {
          totalRecords: accessoriesCount,
          lastUpdate: latestAccessory?.updatedAt?.toISOString() || null,
          available: true
        },
        spareParts: {
          totalRecords: sparePartsCount,
          lastUpdate: latestSparePart?.updatedAt?.toISOString() || null,
          available: true
        },
        products: {
          totalRecords: accessoriesCount + sparePartsCount, // Keep for backward compatibility
          lastUpdate: Math.max(
            latestAccessory?.updatedAt?.getTime() || 0,
            latestSparePart?.updatedAt?.getTime() || 0
          ) ? new Date(Math.max(
            latestAccessory?.updatedAt?.getTime() || 0,
            latestSparePart?.updatedAt?.getTime() || 0
          )).toISOString() : null,
          available: true
        },
        appointments: {
          totalRecords: appointmentsCount,
          lastUpdate: latestAppointment?.updatedAt?.toISOString() || null,
          available: false
        },
        transfers: {
          totalRecords: transfersCount,
          lastUpdate: latestTransfer?.updatedAt?.toISOString() || null,
          available: false
        },
        payments: {
          totalRecords: paymentsCount,
          lastUpdate: latestPayment?.updatedAt?.toISOString() || null,
          available: false
        }
      },
      summary: {
        totalRecords: patientsCount + companiesCount + medicalDevicesCount + diagnosticDevicesCount + accessoriesCount + sparePartsCount + appointmentsCount + transfersCount + paymentsCount,
        availableModules: 6, // patients, companies, medical devices, diagnostic devices, accessories, spare parts
        comingSoonModules: 3, // appointments, transfers, payments
        lastGlobalUpdate: Math.max(
          latestPatient?.updatedAt?.getTime() || 0,
          latestCompany?.updatedAt?.getTime() || 0,
          latestMedicalDevice?.updatedAt?.getTime() || 0,
          latestDiagnosticDevice?.updatedAt?.getTime() || 0,
          latestAccessory?.updatedAt?.getTime() || 0,
          latestSparePart?.updatedAt?.getTime() || 0,
          latestAppointment?.updatedAt?.getTime() || 0,
          latestTransfer?.updatedAt?.getTime() || 0,
          latestPayment?.updatedAt?.getTime() || 0
        )
      }
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching Excel import/export stats:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
}