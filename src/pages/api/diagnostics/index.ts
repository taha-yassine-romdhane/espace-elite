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
      const diagnostics = await prisma.diagnostic.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
      return res.status(200).json(diagnostics);
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching diagnostics' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        patient,
        telephone,
        resultat,
        technicien,
        medecin,
        dateInstallation,
        dateFin,
        remarque,
        appareille
      } = req.body;

      const diagnostic = await prisma.diagnostic.create({
        data: {
          patient,
          telephone,
          resultat,
          technicien,
          medecin,
          dateInstallation: new Date(dateInstallation),
          dateFin: new Date(dateFin),
          remarque,
          appareille
        }
      });

      return res.status(201).json(diagnostic);
    } catch (error) {
      return res.status(500).json({ error: 'Error creating diagnostic' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...data } = req.body;

      const diagnostic = await prisma.diagnostic.update({
        where: { id },
        data: {
          ...data,
          dateInstallation: new Date(data.dateInstallation),
          dateFin: new Date(data.dateFin),
        }
      });

      return res.status(200).json(diagnostic);
    } catch (error) {
      return res.status(500).json({ error: 'Error updating diagnostic' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      await prisma.diagnostic.delete({
        where: { id: String(id) }
      });

      return res.status(200).json({ message: 'Diagnostic deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting diagnostic' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
