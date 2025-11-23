import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  switch (req.method) {
    case 'GET':
      try {
        const { rentalId } = req.query;

        if (!rentalId || typeof rentalId !== 'string') {
          return res.status(400).json({ error: 'Rental ID is required' });
        }

        // Fetch CNAM bonds for the rental
        const bonds = await prisma.cNAMBonRental.findMany({
          where: {
            rentalId: rentalId,
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return res.status(200).json({ 
          bonds,
          success: true 
        });

      } catch (error) {
        console.error('Error fetching CNAM bonds:', error);
        return res.status(500).json({ error: 'Failed to fetch CNAM bonds' });
      }

    case 'POST':
      try {
        const {
          rentalId,
          bonNumber,
          bonType,
          status,
          dossierNumber,
          submissionDate,
          approvalDate,
          startDate,
          endDate,
          cnamMonthlyRate,
          deviceMonthlyRate,
          coveredMonths,
          bonAmount,
          devicePrice,
          complementAmount,
          renewalReminderDays,
          notes,
        } = req.body;

        if (!rentalId || !bonType || !cnamMonthlyRate || !deviceMonthlyRate || !coveredMonths) {
          return res.status(400).json({ error: 'Rental ID, bond type, CNAM rate, device rate, and covered months are required' });
        }

        // Get the rental to fetch patientId
        const rental = await prisma.rental.findUnique({
          where: { id: rentalId }
        });

        if (!rental) {
          return res.status(404).json({ error: 'Rental not found' });
        }

        // Calculate amounts
        const calculatedBonAmount = bonAmount || parseFloat(cnamMonthlyRate) * parseInt(coveredMonths);
        const calculatedDevicePrice = devicePrice || parseFloat(deviceMonthlyRate) * parseInt(coveredMonths);
        const calculatedComplementAmount = complementAmount || (calculatedDevicePrice - calculatedBonAmount);

        // Create new CNAM bond
        const bond = await prisma.cNAMBonRental.create({
          data: {
            rentalId,
            patientId: rental.patientId,
            bonNumber: bonNumber || null,
            bonType,
            status: status || 'CREATION',
            dossierNumber: dossierNumber || null,
            submissionDate: submissionDate ? new Date(submissionDate) : null,
            approvalDate: approvalDate ? new Date(approvalDate) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            cnamMonthlyRate: parseFloat(cnamMonthlyRate),
            deviceMonthlyRate: parseFloat(deviceMonthlyRate),
            coveredMonths: parseInt(coveredMonths),
            bonAmount: calculatedBonAmount,
            devicePrice: calculatedDevicePrice,
            complementAmount: calculatedComplementAmount,
            renewalReminderDays: parseInt(renewalReminderDays) || 30,
            notes: notes || null,
          },
        });

        return res.status(201).json({
          success: true,
          bond,
          message: 'CNAM bond created successfully'
        });

      } catch (error) {
        console.error('Error creating CNAM bond:', error);
        return res.status(500).json({ 
          error: 'Failed to create CNAM bond',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    case 'PATCH':
      try {
        const { bonds, rentalId } = req.body;

        if (!rentalId || !Array.isArray(bonds)) {
          return res.status(400).json({ error: 'Rental ID and bonds array are required' });
        }

        // Get the rental to fetch patientId for new bonds
        const rental = await prisma.rental.findUnique({
          where: { id: rentalId }
        });

        if (!rental) {
          return res.status(404).json({ error: 'Rental not found' });
        }

        // Use a transaction to update all bonds
        const result = await prisma.$transaction(async (tx) => {
          // First, get existing bonds for the rental
          const existingBonds = await tx.cNAMBonRental.findMany({
            where: { rentalId }
          });

          const existingBondIds = existingBonds.map(b => b.id);
          const incomingBondIds = bonds.filter(b => b.id && !b.id.startsWith('new-')).map(b => b.id);

          // Delete bonds that are no longer in the list
          const bondsToDelete = existingBondIds.filter(id => !incomingBondIds.includes(id));
          if (bondsToDelete.length > 0) {
            await tx.cNAMBonRental.deleteMany({
              where: {
                id: { in: bondsToDelete },
                rentalId
              }
            });
          }

          // Update or create bonds
          const updatedBonds = [];
          for (const bond of bonds) {
            if (bond.id && !bond.id.startsWith('new-')) {
              // Update existing bond
              const calculatedBonAmount = bond.bonAmount || parseFloat(bond.cnamMonthlyRate || 0) * parseInt(bond.coveredMonths || 1);
              const calculatedDevicePrice = bond.devicePrice || parseFloat(bond.deviceMonthlyRate || 0) * parseInt(bond.coveredMonths || 1);
              const calculatedComplementAmount = bond.complementAmount || (calculatedDevicePrice - calculatedBonAmount);

              const updated = await tx.cNAMBonRental.update({
                where: { id: bond.id },
                data: {
                  bonNumber: bond.bonNumber || null,
                  bonType: bond.bonType,
                  status: bond.status || 'CREATION',
                  dossierNumber: bond.dossierNumber || null,
                  submissionDate: bond.submissionDate ? new Date(bond.submissionDate) : null,
                  approvalDate: bond.approvalDate ? new Date(bond.approvalDate) : null,
                  startDate: bond.startDate ? new Date(bond.startDate) : null,
                  endDate: bond.endDate ? new Date(bond.endDate) : null,
                  cnamMonthlyRate: parseFloat(bond.cnamMonthlyRate) || 0,
                  deviceMonthlyRate: parseFloat(bond.deviceMonthlyRate) || 0,
                  coveredMonths: parseInt(bond.coveredMonths) || 1,
                  bonAmount: calculatedBonAmount,
                  devicePrice: calculatedDevicePrice,
                  complementAmount: calculatedComplementAmount,
                  renewalReminderDays: parseInt(bond.renewalReminderDays) || 30,
                  notes: bond.notes || null,
                }
              });
              updatedBonds.push(updated);
            } else {
              // Create new bond
              const created = await tx.cNAMBonRental.create({
                data: {
                  rentalId,
                  patientId: rental.patientId,
                  bonNumber: bond.bondNumber || null,
                  bonType: bond.bonType,
                  status: bond.status || 'EN_ATTENTE_APPROBATION',
                  dossierNumber: bond.dossierNumber || null,
                  submissionDate: bond.submissionDate ? new Date(bond.submissionDate) : null,
                  approvalDate: bond.approvalDate ? new Date(bond.approvalDate) : null,
                  startDate: bond.startDate ? new Date(bond.startDate) : null,
                  endDate: bond.endDate ? new Date(bond.endDate) : null,
                  cnamMonthlyRate: parseFloat(bond.cnamMonthlyRate) || 0,
                  deviceMonthlyRate: parseFloat(bond.deviceMonthlyRate) || 0,
                  coveredMonths: parseInt(bond.coveredMonths) || 1,
                  bonAmount: bond.bonAmount || (parseFloat(bond.cnamMonthlyRate || 0) * parseInt(bond.coveredMonths || 1)),
                  devicePrice: bond.devicePrice || (parseFloat(bond.deviceMonthlyRate || 0) * parseInt(bond.coveredMonths || 1)),
                  complementAmount: bond.complementAmount || ((bond.devicePrice || 0) - (bond.bonAmount || 0)),
                  renewalReminderDays: parseInt(bond.renewalReminderDays) || 30,
                  notes: bond.notes || null,
                }
              });
              updatedBonds.push(created);
            }
          }

          return updatedBonds;
        });

        return res.status(200).json({
          success: true,
          bonds: result,
          message: 'CNAM bonds updated successfully'
        });

      } catch (error) {
        console.error('Error updating CNAM bonds:', error);
        return res.status(500).json({ 
          error: 'Failed to update CNAM bonds',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    default:
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}