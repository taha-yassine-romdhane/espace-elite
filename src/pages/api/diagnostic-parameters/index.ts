import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { deviceId, parameters } = req.body;

      // First, delete any existing parameters for this device
      await prisma.diagnosticParameter.deleteMany({
        where: {
          deviceId: deviceId
        }
      });

      // Then create the new parameters
      const parameterPromises = parameters.map(async (param: any) => {
        return prisma.diagnosticParameter.create({
          data: {
            title: param.title,
            type: param.type,
            unit: param.unit,
            minValue: param.minValue,
            maxValue: param.maxValue,
            isRequired: param.isRequired,
            value: param.value,
            deviceId: deviceId
          }
        });
      });

      await Promise.all(parameterPromises);

      res.status(200).json({ message: 'Parameters saved successfully' });
    } catch (error) {
      console.error('Error saving parameters:', error);
      res.status(500).json({ error: 'Failed to save parameters' });
    }
  } else if (req.method === 'GET') {
    try {
      const { deviceId } = req.query;

      const parameters = await prisma.diagnosticParameter.findMany({
        where: {
          deviceId: deviceId as string
        }
      });

      res.status(200).json(parameters);
    } catch (error) {
      console.error('Error fetching parameters:', error);
      res.status(500).json({ error: 'Failed to fetch parameters' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
