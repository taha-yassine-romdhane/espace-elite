import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint fetches all pending diagnostic results
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Mock data for now - in a real implementation, this would query the database
    // for diagnostic parameters marked as results that are due
    const pendingResults = [
      {
        id: '1',
        deviceId: 'dev-001',
        deviceName: 'Scanner à ultrasons XYZ',
        patientId: 'pat-001',
        patientName: 'Mohamed Ben Ali',
        parameterId: 'param-001',
        parameterName: 'Résultat d\'échographie',
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'PENDING',
      },
      {
        id: '2',
        deviceId: 'dev-002',
        deviceName: 'Appareil ECG CardioPlus',
        patientId: 'pat-002',
        patientName: 'Fatima Trabelsi',
        parameterId: 'param-002',
        parameterName: 'Résultat d\'électrocardiogramme',
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday (overdue)
        status: 'PENDING',
      },
    ];

    // In a real implementation, this would be something like:
    /*
    const pendingResults = await prisma.diagnosticResult.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        device: true,
        patient: true,
        parameter: true,
      },
    });
    
    const formattedResults = pendingResults.map(result => ({
      id: result.id,
      deviceId: result.deviceId,
      deviceName: result.device.name,
      patientId: result.patientId,
      patientName: `${result.patient.firstName} ${result.patient.lastName}`,
      parameterId: result.parameterId,
      parameterName: result.parameter.title,
      dueDate: result.dueDate.toISOString(),
      value: result.value,
      notes: result.notes,
      status: result.status,
    }));
    */

    return res.status(200).json(pendingResults);
  } catch (error) {
    console.error('Error fetching pending diagnostic results:', error);
    return res.status(500).json({ message: 'Error fetching pending diagnostic results' });
  }
}
