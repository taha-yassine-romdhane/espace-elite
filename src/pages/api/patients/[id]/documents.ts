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
    return res.status(400).json({ error: 'ID de patient invalide' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getPatientDocuments(req, res, id, session);
    case 'POST':
      return createPatientDocument(req, res, id, session);
    case 'DELETE':
      return deletePatientDocument(req, res, id, session);
    default:
      return res.status(405).json({ error: 'Méthode non autorisée' });
  }
}

// GET: Fetch all documents for a patient, optionally filtered by category
async function getPatientDocuments(req: NextApiRequest, res: NextApiResponse, patientId: string, session: any) {
  try {
    const { category, diagnosticId, saleId, rentalId } = req.query;

    // Build the where clause
    const where: any = { patientId };

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (diagnosticId && typeof diagnosticId === 'string') {
      where.diagnosticId = diagnosticId;
    }

    if (saleId && typeof saleId === 'string') {
      where.saleId = saleId;
    }

    if (rentalId && typeof rentalId === 'string') {
      where.rentalId = rentalId;
    }

    // Fetch documents with related information
    const documents = await prisma.file.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        diagnostic: {
          select: {
            id: true,
            diagnosticCode: true,
            diagnosticDate: true,
          },
        },
        sale: {
          select: {
            id: true,
            saleCode: true,
            saleDate: true,
          },
        },
        rental: {
          select: {
            id: true,
            rentalCode: true,
            startDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des documents' });
  }
}

// POST: Create a new document for a patient
async function createPatientDocument(req: NextApiRequest, res: NextApiResponse, patientId: string, session: any) {
  try {
    const {
      url,
      type,
      fileName,
      filePath,
      fileSize,
      category,
      description,
      diagnosticId,
      saleId,
      rentalId,
    } = req.body;

    // Validate required fields
    if (!url || !type) {
      return res.status(400).json({ error: 'URL et type de fichier sont requis' });
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // If diagnostic/sale/rental IDs are provided, verify they belong to this patient
    if (diagnosticId) {
      const diagnostic = await prisma.diagnostic.findFirst({
        where: { id: diagnosticId, patientId },
      });
      if (!diagnostic) {
        return res.status(400).json({ error: 'Diagnostic invalide pour ce patient' });
      }
    }

    if (saleId) {
      const sale = await prisma.sale.findFirst({
        where: { id: saleId, patientId },
      });
      if (!sale) {
        return res.status(400).json({ error: 'Vente invalide pour ce patient' });
      }
    }

    if (rentalId) {
      const rental = await prisma.rental.findFirst({
        where: { id: rentalId, patientId },
      });
      if (!rental) {
        return res.status(400).json({ error: 'Location invalide pour ce patient' });
      }
    }

    // Create the document
    const document = await prisma.file.create({
      data: {
        url,
        type,
        fileName,
        filePath,
        fileSize,
        category,
        description,
        patientId,
        diagnosticId,
        saleId,
        rentalId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        diagnostic: {
          select: {
            id: true,
            diagnosticCode: true,
            diagnosticDate: true,
          },
        },
        sale: {
          select: {
            id: true,
            saleCode: true,
            saleDate: true,
          },
        },
        rental: {
          select: {
            id: true,
            rentalCode: true,
            startDate: true,
          },
        },
      },
    });

    return res.status(201).json(document);
  } catch (error) {
    console.error('Error creating patient document:', error);
    return res.status(500).json({ error: 'Erreur lors de la création du document' });
  }
}

// DELETE: Delete a document
async function deletePatientDocument(req: NextApiRequest, res: NextApiResponse, patientId: string, session: any) {
  try {
    const { fileId } = req.body;

    if (!fileId) {
      return res.status(400).json({ error: 'ID de fichier requis' });
    }

    // Verify the file exists and belongs to this patient
    const file = await prisma.file.findFirst({
      where: { id: fileId, patientId },
    });

    if (!file) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Delete the file record
    await prisma.file.delete({
      where: { id: fileId },
    });

    return res.status(200).json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting patient document:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du document' });
  }
}
