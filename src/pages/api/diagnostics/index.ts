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
        include: {
          medicalDevice: {
            select: {
              name: true,
              brand: true,
              model: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              telephone: true,
            },
          },
          Company: {
            select: {
              companyName: true,
              telephone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ diagnostics });
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      return res.status(500).json({ error: 'Error fetching diagnostics' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        medicalDeviceId,
        patientId,
        companyId,
        result,
        notes,
        diagnosticDate,
      } = req.body;

      const diagnostic = await prisma.diagnostic.create({
        data: {
          medicalDevice: {
            connect: { id: medicalDeviceId },
          },
          patient: {
            connect: { id: patientId },
          },
          ...(companyId && {
            Company: {
              connect: { id: companyId },
            },
          }),
          result,
          notes,
          diagnosticDate: new Date(diagnosticDate),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          medicalDevice: {
            select: {
              name: true,
              brand: true,
              model: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              telephone: true,
            },
          },
          Company: {
            select: {
              companyName: true,
              telephone: true,
            },
          },
        },
      });

      return res.status(201).json(diagnostic);
    } catch (error) {
      console.error('Error creating diagnostic:', error);
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
          diagnosticDate: new Date(data.diagnosticDate),
        }
      });

      return res.status(200).json(diagnostic);
    } catch (error) {
      console.error('Error updating diagnostic:', error);
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
      console.error('Error deleting diagnostic:', error);
      return res.status(500).json({ error: 'Error deleting diagnostic' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
