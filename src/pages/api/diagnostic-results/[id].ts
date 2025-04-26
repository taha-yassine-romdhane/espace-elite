import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

// eslint-disable-next-line no-unused-vars
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid diagnostic result ID' });
  }

  // Handle PUT request to update a diagnostic result
  if (req.method === 'PUT') {
    try {
      const { value, notes, status } = req.body;

      // In a real implementation, this would update the database
      // For now, we'll just return a success response with the mock data
      /*
      const updatedResult = await prisma.diagnosticResult.update({
        where: { id },
        data: {
          value,
          notes,
          status,
          updatedAt: new Date(),
        },
      });
      */

      const updatedResult = {
        id,
        value,
        notes,
        status,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json(updatedResult);
    } catch (error) {
      console.error('Error updating diagnostic result:', error);
      return res.status(500).json({ message: 'Error updating diagnostic result' });
    }
  }

  // Handle GET request to fetch a specific diagnostic result
  if (req.method === 'GET') {
    try {
      // In a real implementation, this would query the database
      // For now, we'll just return mock data
      const result = {
        id,
        deviceId: 'dev-001',
        deviceName: 'Scanner à ultrasons XYZ',
        patientId: 'pat-001',
        patientName: 'Mohamed Ben Ali',
        parameterId: 'param-001',
        parameterName: 'Résultat d\'échographie',
        dueDate: new Date().toISOString(),
        value: '',
        notes: '',
        status: 'PENDING',
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching diagnostic result:', error);
      return res.status(500).json({ message: 'Error fetching diagnostic result' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
