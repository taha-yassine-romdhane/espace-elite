import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { rentalId, patientId } = req.query;

      const where: any = {};
      if (rentalId) where.rentalId = rentalId as string;
      if (patientId) where.patientId = patientId as string;

      const cnamBonds = await prisma.cNAMBondRental.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cnamId: true,
            },
          },
          rental: {
            select: {
              id: true,
              rentalCode: true,
              medicalDevice: {
                select: {
                  id: true,
                  name: true,
                  deviceCode: true,
                },
              },
            },
          },
          rentalPeriods: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              expectedAmount: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentCode: true,
              amount: true,
              paymentDate: true,
              method: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(cnamBonds);
    } catch (error) {
      console.error('Error fetching CNAM bonds:', error);
      return res.status(500).json({ error: 'Failed to fetch CNAM bonds' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        bondNumber,
        bondType,
        status,
        dossierNumber,
        submissionDate,
        approvalDate,
        startDate,
        endDate,
        cnamMonthlyRate,
        deviceMonthlyRate,
        coveredMonths,
        renewalReminderDays,
        notes,
        rentalId,
        patientId,
      } = req.body;

      // Validate required fields
      if (!bondType || !patientId || !cnamMonthlyRate || !deviceMonthlyRate || !coveredMonths) {
        return res.status(400).json({
          error: 'Missing required fields: bondType, patientId, cnamMonthlyRate, deviceMonthlyRate, coveredMonths',
        });
      }

      // Auto-calculate amounts
      const bondAmount = parseFloat(cnamMonthlyRate) * parseInt(coveredMonths);
      const devicePrice = parseFloat(deviceMonthlyRate) * parseInt(coveredMonths);
      const complementAmount = devicePrice - bondAmount;

      const cnamBond = await prisma.cNAMBondRental.create({
        data: {
          bondNumber,
          bondType,
          status: status || 'EN_ATTENTE_APPROBATION',
          dossierNumber,
          submissionDate: submissionDate ? new Date(submissionDate) : null,
          approvalDate: approvalDate ? new Date(approvalDate) : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          cnamMonthlyRate: parseFloat(cnamMonthlyRate),
          deviceMonthlyRate: parseFloat(deviceMonthlyRate),
          coveredMonths: parseInt(coveredMonths),
          bondAmount,
          devicePrice,
          complementAmount,
          renewalReminderDays: renewalReminderDays || 30,
          notes,
          patient: {
            connect: { id: patientId },
          },
          ...(rentalId && {
            rental: {
              connect: { id: rentalId },
            },
          }),
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              cnamId: true,
            },
          },
          rental: {
            select: {
              id: true,
              rentalCode: true,
            },
          },
        },
      });

      return res.status(201).json(cnamBond);
    } catch (error) {
      console.error('Error creating CNAM bond:', error);
      return res.status(500).json({ error: 'Failed to create CNAM bond' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
