import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Vous devez être connecté pour accéder à cette ressource' });
  }

  const { id, documentId } = req.query;

  if (!id || typeof id !== 'string' || !documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'ID de diagnostic ou de document invalide' });
  }

  // Only allow GET method for downloads
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Check if the diagnostic exists and user has permission
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id },
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
        diagnosticId: id,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Check if the file exists
    const filePath = path.join(process.cwd(), 'public', document.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé sur le serveur' });
    }

    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.filename)}"`);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors du téléchargement du document' });
  }
}
