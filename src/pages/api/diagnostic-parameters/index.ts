import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { deviceId, parameters } = req.body;
      
      // Debug log to see what parameter types are being received
      console.log('Received parameters with types:', parameters.map((p: any) => ({
        title: p.title,
        parameterType: p.parameterType
      })));

      // First, find all existing parameters for this device
      const existingParameters = await prisma.diagnosticParameter.findMany({
        where: {
          deviceId: deviceId
        },
        include: {
          ParameterValue: true
        }
      });
      
      // Delete all parameter values first to avoid foreign key constraint violations
      for (const param of existingParameters) {
        if (param.ParameterValue && param.ParameterValue.length > 0) {
          await prisma.parameterValue.deleteMany({
            where: {
              parameterId: param.id
            }
          });
        }
      }

      // Then delete the parameters
      await prisma.diagnosticParameter.deleteMany({
        where: {
          deviceId: deviceId
        }
      });

      // Then create the new parameters
      const parameterPromises = parameters.map(async (param: any) => {
        // Ensure parameterType is explicitly set and not lost
        const parameterType = param.parameterType || 'PARAMETER';
        console.log(`Creating parameter ${param.title} with type: ${parameterType}`);
        
        // Use the resultDueDate directly if provided
        // For RESULT parameters, this will be filled in when the device is actually used
        const resultDueDate = param.resultDueDate;
        
        if (resultDueDate) {
          console.log(`Parameter ${param.title} has resultDueDate: ${resultDueDate}`);
        }
        
        return prisma.diagnosticParameter.create({
          data: {
            title: param.title,
            type: param.type,
            unit: param.unit,
            minValue: param.minValue,
            maxValue: param.maxValue,
            isRequired: param.isRequired,
            isAutomatic: param.isAutomatic || false,
            parameterType: parameterType, // Use the explicit variable
            resultDueDate: resultDueDate,
            value: param.value,
            deviceId: deviceId
          }
        });
      });

      const createdParameters = await Promise.all(parameterPromises);
      
      // Log created parameters to verify types were saved correctly
      console.log('Created parameters with types:', createdParameters.map(p => ({
        title: p.title,
        parameterType: p.parameterType
      })));

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