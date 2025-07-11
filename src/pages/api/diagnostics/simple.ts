import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = session.user.id;

  try {
    const { clientId, clientType, medicalDeviceId } = req.body;

    if (!clientId || !clientType || !medicalDeviceId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const data: any = {
      diagnosticDate: new Date(),
      medicalDevice: { connect: { id: medicalDeviceId } },
      performedBy: { connect: { id: userId } },
      result: {
        create: {
          status: 'PENDING',
        },
      },
    };

    if (clientType === 'Patient') {
      data.patient = { connect: { id: clientId } };
    } else if (clientType === 'Societe') {
      data.Company = { connect: { id: clientId } };
    } else {
        return res.status(400).json({ message: 'Invalid client type' });
    }

    const diagnostic = await prisma.diagnostic.create({ data });

    await prisma.medicalDevice.update({
        where: { id: medicalDeviceId },
        data: { status: 'RESERVED' }
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Diagnostic created successfully',
      diagnosticId: diagnostic.id
    });

  } catch (error) {
    console.error('Error creating simple diagnostic:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
