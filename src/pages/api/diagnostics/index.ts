import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Files } from 'lucide-react';

// Enable bodyParser for all methods except POST with multipart/form-data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const prisma = new PrismaClient();

const saveFile = async (file: formidable.File): Promise<string> => {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const timestamp = new Date().getTime();
  const newFilename = `${timestamp}-${file.originalFilename}`;
  const newPath = path.join(uploadsDir, newFilename);

  // Copy file to uploads directory
  const data = fs.readFileSync(file.filepath);
  fs.writeFileSync(newPath, data);
  
  // Return relative path for database storage
  return `/uploads/${newFilename}`;
};

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
              id: true,
              name: true,
              brand: true,
              model: true,
              serialNumber: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              telephone: true,
            },
          },
          Company: {
            select: {
              id: true,
              companyName: true,
              telephone: true,
            },
          },
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          // Include diagnostic result with the new model
          result: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Transform the data to make it easier to use in the frontend
      const transformedDiagnostics = diagnostics.map(diagnostic => {
        // Format patient information
        const patientName = diagnostic.patient ? 
          `${diagnostic.patient.firstName} ${diagnostic.patient.lastName}`.trim() : 
          diagnostic.Company?.companyName || 'N/A';
          
        // Format device information
        const deviceName = `${diagnostic.medicalDevice.name} ${diagnostic.medicalDevice.brand || ''} ${diagnostic.medicalDevice.model || ''}`.trim();
         
        // Format user information
        const performedBy = diagnostic.performedBy ? 
          `${diagnostic.performedBy.firstName} ${diagnostic.performedBy.lastName}`.trim() : 
          'N/A';

        return {
          id: diagnostic.id,
          deviceName,
          patientName,
          companyName: diagnostic.Company?.companyName || 'N/A',
          date: diagnostic.diagnosticDate,
          followUpDate: diagnostic.followUpDate,
          followUpRequired: diagnostic.followUpRequired,
          notes: diagnostic.notes,
          performedBy,
          result: diagnostic.result, // Include the full diagnostic result
          status: diagnostic.result?.status || 'PENDING',
        };
      });

      return res.status(200).json({ diagnostics: transformedDiagnostics });
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      return res.status(500).json({ error: 'Error fetching diagnostics' });
    }
  }

  if (req.method === 'POST') {
    try {
      let clientId = '';
      let products = [];
      let followUpDate = null;
      let notes = '';
      let totalPrice = 0;
      let medicalDeviceId = '';
      let uploadedFileUrls = [];
      
      // Handle regular JSON data
      const data = req.body;
      clientId = data.clientId || '';
      products = data.products || [];
      medicalDeviceId = data.medicalDeviceId || '';
      followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
      notes = data.notes || '';
      totalPrice = data.totalPrice || 0;
      uploadedFileUrls = data.fileUrls || [];
      
      // Validate required fields
      if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
      }
      
      if (!medicalDeviceId) {
        return res.status(400).json({ error: 'Medical device ID is required' });
      }
      
      // Get user ID from session
      const userId = session.user.id;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      // Determine if the client is a patient or company
      const isPatient = await prisma.patient.findUnique({
        where: { id: clientId },
      });
      
      // Prepare diagnostic data
      const diagnosticData: any = {
        medicalDevice: { 
          connect: { id: medicalDeviceId }
        },
        diagnosticDate: new Date(),
        notes: notes,
        followUpDate: followUpDate,
        followUpRequired: followUpDate ? true : false,
        performedBy: { connect: { id: userId } },
      };
      
      // Add patient or company connection based on client type
      if (isPatient) {
        diagnosticData.patient = { connect: { id: clientId } };
      } else {
        diagnosticData.Company = { connect: { id: clientId } };
      }
      
      // Create the diagnostic record
      const diagnostic = await prisma.diagnostic.create({
        data: diagnosticData
      });
      
      // Create diagnostic result
      await prisma.diagnosticResult.create({
        data: {
          iah: null,
          idValue: null,
          remarque: null,
          status: 'PENDING',
          diagnostic: { connect: { id: diagnostic.id } },
        },
      });
      
      // Create patient history record if it's a patient
      if (isPatient) {
        await prisma.patientHistory.create({
          data: {
            patient: {
              connect: { id: clientId }
            },
            actionType: 'DIAGNOSTIC',
            details: {
              diagnosticId: diagnostic.id,
              deviceId: medicalDeviceId,
              deviceName: products[0]?.name || 'Unknown device',
              notes: notes,
              followUpDate: followUpDate,
              followUpRequired: followUpDate ? true : false
            },
            relatedItemId: diagnostic.id,
            relatedItemType: 'diagnostic',
            performedBy: {
              connect: { id: userId }
            }
          }
        });
      }
      
      // Create a task for follow-up if required
      if (followUpDate) {
        try {
          await prisma.task.create({
            data: {
              title: `Suivi diagnostic pour ${isPatient ? 'patient' : 'société'}`,
              description: `Suivi requis pour le diagnostic créé le ${new Date().toLocaleDateString()}`,
              status: 'TODO',
              priority: 'MEDIUM',
              startDate: new Date(),
              endDate: followUpDate,
              assignedTo: { connect: { id: userId } },
              diagnostic: { connect: { id: diagnostic.id } },
            }
          });
        } catch (error) {
          console.error('Error creating follow-up task:', error);
        }
      }
      
      return res.status(201).json({ 
        success: true, 
        message: 'Diagnostic created successfully',
        diagnosticId: diagnostic.id
      });
    } catch (error) {
      console.error('Error creating diagnostic:', error);
      return res.status(500).json({
        success: false,
        message: `Error creating diagnostic: ${error}`,
      });
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
