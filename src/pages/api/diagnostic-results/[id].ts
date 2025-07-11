import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/db';

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
    const { iah, idValue, remarque, status } = req.body;

    const updatedResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch the diagnostic and related data for validation
      const diagnosticResult = await tx.diagnosticResult.findUnique({
        where: { id },
        include: {
          diagnostic: {
            include: {
              performedBy: {
                include: {
                  stockLocation: true,
                },
              },
            },
          },
        },
      });

      if (!diagnosticResult) {
        throw new Error('Résultat de diagnostic non trouvé');
      }

      // 2. Check user permissions
      const userRole = session.user.role;
      const userId = session.user.id;
      if (userRole !== 'ADMIN' && diagnosticResult.diagnostic.performedById !== userId) {
        throw new Error('Vous n\'avez pas la permission de modifier ce résultat');
      }

      // 3. Update the DiagnosticResult itself
      const result = await tx.diagnosticResult.update({
        where: { id },
        data: {
          iah: iah !== undefined ? iah : null,
          idValue: idValue !== undefined ? idValue : null,
          remarque: remarque !== undefined ? remarque : null,
          status: status || 'PENDING',
        },
      });

      // 4. If results are being marked as COMPLETED, update parent Diagnostic and MedicalDevice
      if (status === 'COMPLETED') {
        // Update parent Diagnostic status
        await tx.diagnostic.update({
          where: { id: diagnosticResult.diagnosticId },
          data: { status: 'COMPLETED' },
        });

        // Update the associated MedicalDevice
        const deviceId = diagnosticResult.diagnostic.medicalDeviceId;
        if (deviceId) {
          const technicianStockLocationId = diagnosticResult.diagnostic.performedBy?.stockLocation?.id;

          await tx.medicalDevice.update({
            where: { id: deviceId },
            data: {
              status: 'ACTIVE',
              patientId: null,
              reservedUntil: null,
              // Return device to technician's stock location if available
              ...(technicianStockLocationId && { stockLocationId: technicianStockLocationId }),
            },
          });
        }
      }

      return result;
    });

    return res.status(200).json(updatedResult);
  } catch (error: any) {
    console.error('Error updating diagnostic result:', error);
    // Distinguish between permission errors and other server errors
    if (error.message.includes('permission')) {
      return res.status(403).json({ error: error.message });
    } else if (error.message.includes('non trouvé')) {
      return res.status(404).json({ error: error.message });
    }
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
