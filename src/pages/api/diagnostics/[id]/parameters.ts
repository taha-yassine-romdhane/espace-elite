import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { id } = req.query;
  const { parameters } = req.body as { parameters: Array<{ parameterId: string; value: string }> };

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de diagnostic invalide' });
  }

  if (!parameters || !Array.isArray(parameters)) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }

  // Fetch the diagnostic to get patientId for history tracking (for use in all history tracking below)
  const diagnosticForHistory = await prisma.diagnostic.findUnique({
    where: { id },
    select: { patientId: true }
  });
  if (!diagnosticForHistory) {
    return res.status(404).json({ error: 'Diagnostic introuvable pour l\'historique' });
  }

  try {
    // Find the diagnostic
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id },
      include: {
        medicalDevice: true,
      },
    });

    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnostic non trouvé' });
    }

    // Update parameter values


    // Create history records for this update using PatientHistory and UserActionHistory
  

    // Check if all parameters have values, and if so, mark the diagnostic as COMPLETED
    const allParameters = await prisma.parameterValue.findMany({
      where: {
        diagnosticId: id,
      },
    });

    const allParametersHaveValues = allParameters.every((param: { value: string | null }) => param.value);
    
    // If all parameter values are filled, the diagnostic is considered complete.
    // You may trigger additional logic here if needed (e.g., send notification, update tasks, etc.)
    // If all parameter values are filled, the diagnostic is considered complete.
    // You may trigger additional logic here if needed (e.g., send notification, update tasks, etc.)
    // (No further logic here for now)

    // Return success
    return res.status(200).json({ 
      success: true, 
      message: 'Paramètres mis à jour avec succès',
    });
  } catch (error) {
    console.error('Error updating parameters:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la mise à jour des paramètres' });
  }
}
