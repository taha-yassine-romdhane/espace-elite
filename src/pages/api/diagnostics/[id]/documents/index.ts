import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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
      return getDocuments(req, res, id, session);
    case 'POST':
      return uploadDocument(req, res, id, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// GET: Fetch all documents for a diagnostic
async function getDocuments(req: NextApiRequest, res: NextApiResponse, diagnosticId: string, session: any) {
  try {
    // Check if the diagnostic exists and user has permission
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      select: {
        id: true,
        performedById: true,
        patientId: true,
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

    // Get all documents for this diagnostic
    const documents = await prisma.document.findMany({
      where: { diagnosticId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des documents' });
  }
}

// POST: Upload a document for a diagnostic and link it to the patient
async function uploadDocument(req: NextApiRequest, res: NextApiResponse, diagnosticId: string, session: any) {
  try {
    // Check if the diagnostic exists and user has permission
    const diagnostic = await prisma.diagnostic.findUnique({
      where: { id: diagnosticId },
      select: {
        id: true,
        performedById: true,
        patientId: true,
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Parse form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Error parsing form:', err);
          res.status(500).json({ error: 'Erreur lors du téléchargement du fichier' });
          return resolve(null);
        }

        const file = files.file?.[0];
        if (!file) {
          res.status(400).json({ error: 'Aucun fichier n\'a été téléchargé' });
          return resolve(null);
        }

        try {
          // Generate a unique filename
          const uniqueFilename = `${uuidv4()}${path.extname(file.originalFilename || '')}`;
          const finalPath = path.join(uploadsDir, uniqueFilename);

          // Rename the file to use the unique filename
          fs.renameSync(file.filepath, finalPath);

          // Create document record in the database
          const document = await prisma.document.create({
            data: {
              filename: file.originalFilename || 'document',
              path: `/uploads/${uniqueFilename}`,
              mimeType: file.mimetype || 'application/octet-stream',
              size: file.size,
              diagnosticId,
              patientId: diagnostic.patientId, // Link to patient
              uploadedById: userId,
            },
          });

          res.status(201).json(document);
          return resolve(null);
        } catch (error) {
          console.error('Error saving document:', error);
          res.status(500).json({ error: 'Une erreur est survenue lors de l\'enregistrement du document' });
          return resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Une erreur est survenue lors du téléchargement du document' });
  }
}
