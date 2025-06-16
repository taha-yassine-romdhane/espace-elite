import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de résultat de diagnostic invalide' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getDiagnosticResult(req, res, id, session);
    case 'PUT':
      return updateDiagnosticResult(req, res, id, session);
    case 'DELETE':
      return deleteDiagnosticResult(req, res, id, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// GET: Fetch a diagnostic result by ID
async function getDiagnosticResult(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    const result = await prisma.diagnosticResult.findUnique({
      where: { id },
      include: {
        diagnostic: {
          include: {
            patient: true,
            medicalDevice: true,
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'Résultat de diagnostic non trouvé' });
    }

    // Check if the user has permission to access this result
    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== 'ADMIN' && result.diagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'accéder à ce résultat' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching diagnostic result:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du résultat de diagnostic' });
  }
}

// PUT: Update a diagnostic result
async function updateDiagnosticResult(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Get the diagnostic result to check permissions
    const existingResult = await prisma.diagnosticResult.findUnique({
      where: { id },
      include: {
        diagnostic: {
          select: {
            performedById: true,
          },
        },
      },
    });

    if (!existingResult) {
      return res.status(404).json({ error: 'Résultat de diagnostic non trouvé' });
    }

    // Check user permissions
    const userRole = session.user.role;
    const userId = session.user.id;

    // Only allow admins or the user who performed the diagnostic to update the result
    if (userRole !== 'ADMIN' && existingResult.diagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier ce résultat' });
    }

    const { iah, idValue, remarque, status } = req.body;

    // Update the diagnostic result
    const updatedResult = await prisma.diagnosticResult.update({
      where: { id },
      data: {
        iah: iah !== undefined ? iah : null,
        idValue: idValue !== undefined ? idValue : null,
        remarque: remarque !== undefined ? remarque : null,
        status: status || 'PENDING',
      },
      include: {
        diagnostic: {
          include: {
            patient: true,
            medicalDevice: true,
          },
        },
      },
    });

    return res.status(200).json(updatedResult);
  } catch (error) {
    console.error('Error updating diagnostic result:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du résultat de diagnostic' });
  }
}

// DELETE: Delete a diagnostic result
async function deleteDiagnosticResult(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Only admins can delete diagnostic results
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des résultats de diagnostic' });
    }

    // Get the diagnostic result to check if it exists
    const existingResult = await prisma.diagnosticResult.findUnique({
      where: { id },
    });

    if (!existingResult) {
      return res.status(404).json({ error: 'Résultat de diagnostic non trouvé' });
    }

    // Delete the diagnostic result
    await prisma.diagnosticResult.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Résultat de diagnostic supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting diagnostic result:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du résultat de diagnostic' });
  }
}
