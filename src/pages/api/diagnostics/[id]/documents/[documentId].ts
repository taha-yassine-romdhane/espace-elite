import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

  const { id, documentId } = req.query;

  if (!id || typeof id !== 'string' || !documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'ID de diagnostic ou de document invalide' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getDocument(req, res, id, documentId, session);
    case 'DELETE':
      return deleteDocument(req, res, id, documentId, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// GET: Fetch a specific document
async function getDocument(req: NextApiRequest, res: NextApiResponse, diagnosticId: string, documentId: string, session: any) {
  try {
    // Check if the diagnostic exists and user has permission
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      select: {
        id: true,
        performedById: true,
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

    // Get the document
    const document = await prisma.document.findUnique({
      where: { 
        id: documentId,
        diagnosticId,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération du document' });
  }
}

// DELETE: Delete a document
async function deleteDocument(req: NextApiRequest, res: NextApiResponse, diagnosticId: string, documentId: string, session: any) {
  try {
    // Check if the diagnostic exists and user has permission
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      select: {
        id: true,
        performedById: true,
      },
    });

    if (!diagnostic) {
      return res.status(404).json({ error: 'Diagnostic non trouvé' });
    }

    // Check if the user has permission to modify this diagnostic
    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== 'ADMIN' && diagnostic.performedById !== userId) {
      return res.status(403).json({ error: 'Vous n\'avez pas la permission de modifier ce diagnostic' });
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { 
        id: documentId,
        diagnosticId,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Delete the file from the filesystem
    if (document.path) {
      const filePath = path.join(process.cwd(), 'public', document.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the document from the database
    await prisma.document.delete({
      where: { id: documentId },
    });

    return res.status(200).json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la suppression du document' });
  }
}
