import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de diagnostic invalide' });
  }

  try {
    // Get the diagnostic with all related information
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id },
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
        // Include parameter values for this diagnostic
        parameterValues: {
          include: {
            parameter: {
              select: {
                id: true,
                title: true,
                type: true,
                unit: true,
                minValue: true,
                maxValue: true,
                isRequired: true,
                parameterType: true,
              },
            },
          },
        },
        // We don't include history directly as it's not in the model
        // We don't include documents directly as it might not be in the model
      },
    });

    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnostic non trouvé' });
    }

    // Check if the user has permission to access this diagnostic
    // For example, if the user is not an admin, they might only be able to see their own diagnostics
    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== 'ADMIN' && diagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'accéder à ce diagnostic' });
    }

    // Return the diagnostic data
    return res.status(200).json(diagnostic);
  } catch (error) {
    console.error('Error fetching diagnostic:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du diagnostic' });
  }
}
