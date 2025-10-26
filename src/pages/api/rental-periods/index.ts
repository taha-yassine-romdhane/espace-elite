import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const periods = await prisma.rentalPeriod.findMany({
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform to match frontend expectations
      const transformedPeriods = periods.map((period) => {
        // Calculate payment status
        const totalPaid = period.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const cnamPaid = period.payments
          .filter((p) => p.method === 'CNAM')
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const patientPaid = period.payments
          .filter((p) => p.method !== 'CNAM')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          id: period.id,
          rentalId: period.rentalId,
          startDate: period.startDate.toISOString().split('T')[0],
          endDate: period.endDate.toISOString().split('T')[0],
          expectedAmount: Number(period.expectedAmount),
          cnamExpectedAmount: period.cnamExpectedAmount ? Number(period.cnamExpectedAmount) : null,
          patientExpectedAmount: period.patientExpectedAmount ? Number(period.patientExpectedAmount) : null,
          isGapPeriod: period.isGapPeriod,
          gapReason: period.gapReason,
          notes: period.notes,
          cnamBond: period.cnamBond,
          payments: period.payments,
          cnamPaid,
          patientPaid,
          totalPaid,
          rental: period.rental ? {
            rentalCode: period.rental.rentalCode || '',
            patient: period.rental.patient,
            medicalDevice: period.rental.medicalDevice,
          } : undefined,
        };
      });

      return res.status(200).json(transformedPeriods);
    }

    if (req.method === 'POST') {
      const {
        rentalId,
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

      if (!rentalId || !startDate || !endDate || expectedAmount === undefined) {
        return res.status(400).json({ error: 'Missing required fields: rentalId, startDate, endDate, expectedAmount' });
      }

      const period = await prisma.rentalPeriod.create({
        data: {
          rental: {
            connect: { id: rentalId },
          },
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          expectedAmount: parseFloat(expectedAmount),
          cnamExpectedAmount: cnamExpectedAmount ? parseFloat(cnamExpectedAmount) : null,
          patientExpectedAmount: patientExpectedAmount ? parseFloat(patientExpectedAmount) : null,
          isGapPeriod: isGapPeriod || false,
          gapReason,
          notes,
          ...(cnamBondId && {
            cnamBond: {
              connect: { id: cnamBondId },
            },
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
        },
      });

      return res.status(201).json(period);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in rental-periods API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
