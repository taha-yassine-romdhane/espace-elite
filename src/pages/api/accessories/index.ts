import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

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
      const accessories = await prisma.accessory.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return res.status(200).json(accessories);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching accessories' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { nom, type, marque, prixAchat, stock } = req.body;

      const accessory = await prisma.accessory.create({
        data: {
          nom,
          type,
          marque,
          prixAchat: prixAchat ? parseFloat(prixAchat) : null,
          stock,
        }
      });

      return res.status(201).json(accessory);
    } catch (error) {
      return res.status(500).json({ error: 'Error creating accessory' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...data } = req.body;

      if (data.prixAchat) {
        data.prixAchat = parseFloat(data.prixAchat);
      }

      const accessory = await prisma.accessory.update({
        where: { id },
        data
      });

      return res.status(200).json(accessory);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating accessory' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      await prisma.accessory.delete({
        where: { id: String(id) }
      });

      return res.status(200).json({ message: 'Accessory deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting accessory' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
