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

  // Get bond ID from request
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid bond ID' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  switch (req.method) {
    case 'GET':
      try {
        const bond = await prisma.cNAMBonRental.findUnique({
          where: { id },
          include: {
            rental: {
              select: {
                id: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        });

        if (!bond) {
          return res.status(404).json({ error: 'CNAM bond not found' });
        }

        return res.status(200).json({ bond });
      } catch (error) {
        console.error('Error fetching CNAM bond:', error);
        return res.status(500).json({ error: 'Failed to fetch CNAM bond' });
      }

    case 'PATCH':
      try {
        const updateData = req.body;
        
        const updatedBond = await prisma.cNAMBonRental.update({
          where: { id },
          data: {
            ...(updateData.bonNumber !== undefined && { bonNumber: updateData.bonNumber }),
            ...(updateData.bonType && { bonType: updateData.bonType }),
            ...(updateData.status && { status: updateData.status }),
            ...(updateData.dossierNumber !== undefined && { dossierNumber: updateData.dossierNumber }),
            ...(updateData.submissionDate && { submissionDate: new Date(updateData.submissionDate) }),
            ...(updateData.approvalDate && { approvalDate: new Date(updateData.approvalDate) }),
            ...(updateData.startDate && { startDate: new Date(updateData.startDate) }),
            ...(updateData.endDate && { endDate: new Date(updateData.endDate) }),
            ...(updateData.cnamMonthlyRate !== undefined && { cnamMonthlyRate: parseFloat(updateData.cnamMonthlyRate) }),
            ...(updateData.deviceMonthlyRate !== undefined && { deviceMonthlyRate: parseFloat(updateData.deviceMonthlyRate) }),
            ...(updateData.coveredMonths !== undefined && { coveredMonths: parseInt(updateData.coveredMonths) }),
            ...(updateData.bonAmount !== undefined && { bonAmount: parseFloat(updateData.bonAmount) }),
            ...(updateData.devicePrice !== undefined && { devicePrice: parseFloat(updateData.devicePrice) }),
            ...(updateData.complementAmount !== undefined && { complementAmount: parseFloat(updateData.complementAmount) }),
            ...(updateData.renewalReminderDays !== undefined && { renewalReminderDays: parseInt(updateData.renewalReminderDays) }),
            ...(updateData.notes !== undefined && { notes: updateData.notes }),
          },
        });
        
        return res.status(200).json({ 
          success: true, 
          bond: updatedBond 
        });
        
      } catch (error) {
        console.error('Error updating CNAM bond:', error);
        return res.status(500).json({ 
          error: 'Failed to update CNAM bond',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    case 'DELETE':
      try {
        const deletedBond = await prisma.cNAMBonRental.delete({
          where: { id }
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'CNAM bond deleted successfully',
          bond: deletedBond 
        });
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
          return res.status(404).json({ error: 'CNAM bond not found' });
        }
        console.error('Error deleting CNAM bond:', error);
        return res.status(500).json({ 
          error: 'Failed to delete CNAM bond',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    default:
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}