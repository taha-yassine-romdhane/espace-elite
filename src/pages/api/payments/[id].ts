import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid payment ID' });
  }

  if (req.method === 'PUT') {
    try {
      const { rentalId, amount, paymentDate, periodStartDate, periodEndDate, paymentMethod, paymentType, status } = req.body;

      // Build update data object conditionally to avoid undefined issues
      const updateData: any = {};

      if (amount !== undefined) updateData.amount = Number(amount);
      if (paymentMethod !== undefined) updateData.method = paymentMethod;
      if (paymentType !== undefined) updateData.paymentType = paymentType;
      if (status !== undefined) updateData.status = status;
      if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
      if (periodStartDate !== undefined) updateData.periodStartDate = periodStartDate ? new Date(periodStartDate) : null;
      if (periodEndDate !== undefined) updateData.periodEndDate = periodEndDate ? new Date(periodEndDate) : null;

      const payment = await prisma.payment.update({
        where: { id },
        data: updateData,
      });

      // Get rental info for response
      const rental = rentalId ? await prisma.rental.findUnique({
        where: { id: rentalId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          medicalDevice: {
            select: {
              id: true,
              name: true,
              deviceCode: true,
            },
          },
        },
      }) : null;

      return res.status(200).json({
        id: payment.id,
        rentalId: payment.rentalId,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate.toISOString().split('T')[0],
        periodStartDate: payment.periodStartDate ? payment.periodStartDate.toISOString().split('T')[0] : null,
        periodEndDate: payment.periodEndDate ? payment.periodEndDate.toISOString().split('T')[0] : null,
        paymentMethod: payment.method,
        paymentType: payment.paymentType,
        status: payment.status,
        rental: rental ? {
          rentalCode: rental.rentalCode,
          patient: rental.patient,
          medicalDevice: rental.medicalDevice,
        } : null,
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      return res.status(500).json({ error: 'Failed to update payment' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.payment.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment:', error);
      return res.status(500).json({ error: 'Failed to delete payment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
