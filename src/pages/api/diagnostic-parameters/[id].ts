import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid device ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // First, check if there's a MedicalDevice with this ID
        const medicalDevice = await prisma.medicalDevice.findUnique({
          where: { id },
          include: { parameters: true }
        });

        if (medicalDevice) {
          // If found, return its parameters
          return res.status(200).json(medicalDevice.parameters || []);
        }

        // If not found as a MedicalDevice, check if it's a Product
        const product = await prisma.product.findUnique({
          where: { id }
        });

        if (!product) {
          // If neither a MedicalDevice nor a Product exists with this ID
          return res.status(404).json({ error: 'Device not found' });
        }

        // For Products, we need to find if there's a related MedicalDevice
        // This depends on your data model - how Products and MedicalDevices are related
        // For now, return an empty array for Products
        return res.status(200).json([]);

      case 'POST':
        // Save parameters for a specific diagnostic device
        const { parameters } = req.body;

        if (!parameters || !Array.isArray(parameters)) {
          return res.status(400).json({ error: 'Parameters array is required' });
        }

        // Check if this is a MedicalDevice
        const deviceToUpdate = await prisma.medicalDevice.findUnique({
          where: { id }
        });

        if (!deviceToUpdate) {
          return res.status(404).json({ error: 'Medical device not found' });
        }

        // First, delete any existing parameters for this device
        await prisma.diagnosticParameter.deleteMany({
          where: { deviceId: id }
        });

        // Then create the new parameters
        const createdParameters = await Promise.all(
          parameters.map(param => 
            prisma.diagnosticParameter.create({
              data: {
                title: param.title,
                type: param.type,
                unit: param.unit,
                minValue: param.minValue,
                maxValue: param.maxValue,
                isRequired: param.isRequired,
                isAutomatic: param.isAutomatic || false,
                value: param.value,
                deviceId: id
              }
            })
          )
        );

        return res.status(200).json(createdParameters);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
