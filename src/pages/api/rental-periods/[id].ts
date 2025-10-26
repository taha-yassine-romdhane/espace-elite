import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid period ID' });
  }

  try {
    if (req.method === 'GET') {
      const period = await prisma.rentalPeriod.findUnique({
        where: { id },
        include: {
          rental: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              medicalDevice: {
                select: {
                  name: true,
                  deviceCode: true,
                },
              },
            },
          },
          cnamBond: {
            select: {
              bondType: true,
              bondAmount: true,
              complementAmount: true,
            },
          },
          payments: {
            select: {
              id: true,
              paymentCode: true,
              amount: true,
              method: true,
              status: true,
            },
          },
        },
      });

      if (!period) {
        return res.status(404).json({ error: 'Period not found' });
      }

      return res.status(200).json(period);
    }

    if (req.method === 'PUT') {
      const {
        startDate,
        endDate,
        expectedAmount,
        cnamExpectedAmount,
        patientExpectedAmount,
        isGapPeriod,
        gapReason,
        notes,
        cnamBondId,
      } = req.body;

      const period = await prisma.rentalPeriod.update({
        where: { id },
        data: {
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          ...(expectedAmount !== undefined && { expectedAmount: parseFloat(expectedAmount) }),
          ...(cnamExpectedAmount !== undefined && {
            cnamExpectedAmount: cnamExpectedAmount ? parseFloat(cnamExpectedAmount) : null
          }),
          ...(patientExpectedAmount !== undefined && {
            patientExpectedAmount: patientExpectedAmount ? parseFloat(patientExpectedAmount) : null
          }),
          ...(isGapPeriod !== undefined && { isGapPeriod }),
          ...(gapReason !== undefined && { gapReason }),
          ...(notes !== undefined && { notes }),
          ...(cnamBondId !== undefined && {
            cnamBond: cnamBondId ? { connect: { id: cnamBondId } } : { disconnect: true },
          }),
        },
        include: {
          rental: {
            include: {
              patient: true,
              medicalDevice: true,
            },
          },
          cnamBond: true,
          payments: true,
        },
      });

      return res.status(200).json(period);
    }

    if (req.method === 'DELETE') {
      await prisma.rentalPeriod.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Period deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in rental-periods/[id] API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
