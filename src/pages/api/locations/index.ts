import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const locations = await prisma.stockLocation.findMany({
        orderBy: { 
          name: 'asc' 
        },
        select: {
          id: true,
          name: true,
          // Handle fields that might not exist in the current schema
          description: true,
          isActive: true
        }
      });
      return res.status(200).json(locations);
    } catch (error) {
      console.error('Error fetching repair locations:', error);
      return res.status(500).json({ error: 'Failed to fetch repair locations' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, description } = req.body;
      const location = await prisma.stockLocation.create({
        data: {
          name,
          description,
          isActive: true
        },
      });
      return res.status(201).json(location);
    } catch (error) {
      console.error('Error creating repair location:', error);
      return res.status(500).json({ error: 'Failed to create repair location' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, description, isActive } = req.body;
      const location = await prisma.stockLocation.update({
        where: { id },
        data: {
          name,
          description,
          isActive: isActive !== undefined ? isActive : true
        },
      });
      return res.status(200).json(location);
    } catch (error) {
      console.error('Error updating repair location:', error);
      return res.status(500).json({ error: 'Failed to update repair location' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await prisma.stockLocation.delete({
        where: { id: String(id) },
      });
      return res.status(200).json({ message: 'Location deleted successfully' });
    } catch (error) {
      console.error('Error deleting repair location:', error);
      return res.status(500).json({ error: 'Failed to delete repair location' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
