import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { medicalDeviceId } = req.query;

      if (!medicalDeviceId || typeof medicalDeviceId !== 'string') {
        return res.status(400).json({ error: 'Medical device ID is required' });
      }

      const parameterValues = await prisma.parameterValue.findMany({
        where: {
          medicalDeviceId,
        },
        include: {
          parameter: true,
        },
      });

      return res.status(200).json(parameterValues);
    } catch (error) {
      console.error('Error fetching parameter values:', error);
      return res.status(500).json({ error: 'Failed to fetch parameter values' });
    }
  } else if (req.method === 'POST') {
    try {
      const { parameterValues } = req.body;

      if (!parameterValues || !Array.isArray(parameterValues)) {
        return res.status(400).json({ error: 'Parameter values are required' });
      }

      // Process each parameter value
      const results = await Promise.all(
        parameterValues.map(async (paramValue) => {
          const { parameterId, medicalDeviceId, value } = paramValue;

          if (!parameterId || !medicalDeviceId || value === undefined) {
            throw new Error('Invalid parameter value data');
          }

          // Check if a record already exists
          const existingValue = await prisma.parameterValue.findUnique({
            where: {
              parameterId_medicalDeviceId: {
                parameterId,
                medicalDeviceId,
              },
            },
          });

          if (existingValue) {
            // Update existing record
            return prisma.parameterValue.update({
              where: {
                id: existingValue.id,
              },
              data: {
                value,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new record
            return prisma.parameterValue.create({
              data: {
                value,
                parameterId,
                medicalDeviceId,
              },
            });
          }
        })
      );

      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error saving parameter values:', error);
      return res.status(500).json({ error: 'Failed to save parameter values' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
