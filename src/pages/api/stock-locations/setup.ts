import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (!adminUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Create default stock locations
    const defaultLocations = [
      {
        name: 'Stock Principal',
        description: 'Stock principal de l\'entreprise',
        userId: adminUser.id,
      },
      {
        name: 'Stock Maintenance',
        description: 'Stock pour les appareils en maintenance',
      },
      {
        name: 'Stock Location',
        description: 'Stock pour les appareils en location',
      },
    ];

    // Create locations if they don't exist
    const createdLocations = await Promise.all(
      defaultLocations.map(async (location) => {
        const existing = await prisma.stockLocation.findUnique({
          where: { name: location.name },
        });

        if (!existing) {
          return prisma.stockLocation.create({
            data: {
              ...location,
              isActive: true,
            },
          });
        }
        return existing;
      })
    );

    return res.status(200).json(createdLocations);
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: 'Error processing your request' });
  }
}
