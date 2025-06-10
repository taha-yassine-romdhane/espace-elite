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
    return res.status(400).json({ error: 'ID de diagnostic invalide' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getDiagnostic(req, res, id, session);
    case 'PUT':
      return updateDiagnostic(req, res, id, session);
    case 'DELETE':
      return deleteDiagnostic(req, res, id, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// GET: Fetch a diagnostic by ID with all related information
async function getDiagnostic(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Get the diagnostic with all related information including the new DiagnosticResult model
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
        // Include the new DiagnosticResult instead of parameterValues
        result: true,
        // Include tasks related to this diagnostic
        Task: true,
        // Note: documents relation doesn't exist in the schema yet
        // We'll need to create a Document model and relation in the schema
      },
    });

    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnostic non trouvé' });
    }

    // Check if the user has permission to access this diagnostic
    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== 'ADMIN' && diagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission d\'accéder à ce diagnostic' });
    }

    // Add debug information about the diagnostic result
    const diagnosticWithDebug = {
      ...diagnostic,
      _debug: {
        hasResult: !!diagnostic.result,
        resultStatus: diagnostic.result?.status || 'NO_RESULT',
        followUpRequired: diagnostic.followUpRequired,
        followUpDate: diagnostic.followUpDate,
        taskCount: diagnostic.Task?.length || 0
      }
    };
    
    console.log('Returning diagnostic with result:', {
      id: diagnostic.id,
      hasResult: !!diagnostic.result,
      resultStatus: diagnostic.result?.status || 'NO_RESULT',
      iah: diagnostic.result?.iah,
      idValue: diagnostic.result?.idValue,
      remarque: diagnostic.result?.remarque
    });
    
    // Return the diagnostic data with debug info
    return res.status(200).json(diagnosticWithDebug);
  } catch (error) {
    console.error('Error fetching diagnostic:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du diagnostic' });
  }
}

// PUT: Update a diagnostic and its result
async function updateDiagnostic(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Check user permissions
    const userRole = session.user.role;
    const userId = session.user.id;
    
    // Find the diagnostic first to check permissions
    const existingDiagnostic = await prisma.diagnostic.findUnique({
      where: { id },
      select: { performedById: true }
    });
    
    if (!existingDiagnostic) {
      return res.status(404).json({ error: 'Diagnostic non trouvé' });
    }
    
    // Only allow admins or the user who performed the diagnostic to update it
    if (userRole !== 'ADMIN' && existingDiagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier ce diagnostic' });
    }
    
    const { 
      notes, 
      followUpRequired, 
      followUpDate,
      result 
    } = req.body;
    
    // Update the diagnostic
    const updatedDiagnostic = await prisma.diagnostic.update({
      where: { id },
      data: {
        notes,
        followUpRequired: followUpRequired ?? false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        // Update or create the diagnostic result if provided
        result: result ? {
          upsert: {
            create: {
              iah: result.iah,
              idValue: result.idValue,
              remarque: result.remarque,
              status: result.status
            },
            update: {
              iah: result.iah,
              idValue: result.idValue,
              remarque: result.remarque,
              status: result.status
            }
          }
        } : undefined
      },
      include: {
        result: true,
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
      }
    });
    
    return res.status(200).json(updatedDiagnostic);
  } catch (error) {
    console.error('Error updating diagnostic:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour du diagnostic' });
  }
}

// DELETE: Delete a diagnostic and its associated result
async function deleteDiagnostic(req: NextApiRequest, res: NextApiResponse, id: string, session: any) {
  try {
    // Only admins can delete diagnostics
    if (session.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des diagnostics' });
    }
    
    // First delete the associated diagnostic result if it exists
    await prisma.diagnosticResult.deleteMany({
      where: { diagnosticId: id }
    });
    
    // Then delete the diagnostic
    await prisma.diagnostic.delete({
      where: { id }
    });
    
    return res.status(200).json({ message: 'Diagnostic supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting diagnostic:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du diagnostic' });
  }
}
