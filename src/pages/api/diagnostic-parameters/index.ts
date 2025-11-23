import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { deviceId, resultDueDate } = req.body;
      
      // Log the received data
      console.log('Received configuration:', { deviceId, resultDueDate });
      
      // Update the device status to reserved
      if (deviceId && resultDueDate) {
        await prisma.medicalDevice.update({
          where: { id: deviceId },
          data: {
            status: 'RESERVED'
          }
        });

        console.log(`Device ${deviceId} reserved (result due: ${resultDueDate})`);
      }
      
      res.status(200).json({ 
        message: 'Device configuration saved successfully',
        resultDueDate
      });
    } catch (error) {
      console.error('Error saving device configuration:', error);
      res.status(500).json({ error: 'Failed to save device configuration' });
    }
  } else if (req.method === 'GET') {
    try {
      const { deviceId } = req.query;
      
      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      // Get the device to check its reservation status
      const device = await prisma.medicalDevice.findUnique({
        where: { id: deviceId as string }
      });

      if (!device) {
        return res.status(404).json({ error: 'Device not found' });
      }

      // Return null as result due date (reservation tracking removed from device schema)
      res.status(200).json({
        resultDueDate: null
      });
    } catch (error) {
      console.error('Error fetching device configuration:', error);
      res.status(500).json({ error: 'Failed to fetch device configuration' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}