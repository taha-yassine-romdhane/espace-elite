import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import type { Diagnostic } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Enable bodyParser for all methods except POST with multipart/form-data
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

  try {
    if (req.method === 'GET') {
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
          `${diagnostic.patient.firstName} ${diagnostic.patient.lastName}`.trim() : 'N/A';
          
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
          companyName: 'N/A',
          date: diagnostic.diagnosticDate,
          followUpDate: diagnostic.followUpDate,
          followUpRequired: diagnostic.followUpRequired,
          notes: diagnostic.notes,
          performedBy,
          result: diagnostic.result,
          status: diagnostic.result?.status || 'PENDING',
        };
      });

      return res.status(200).json({ diagnostics: transformedDiagnostics });
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
          return res.status(400).json({ error: 'Patient ID is required' });
        }
        
        if (!medicalDeviceId) {
          return res.status(400).json({ error: 'Medical device ID is required' });
        }
        
        // Get user ID from session
        const userId = session.user.id;
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Verify this is a patient and get patient details
        const patient = await prisma.patient.findUnique({
          where: { id: clientId },
          select: { id: true, firstName: true, lastName: true }
        });
        
        if (!patient) {
          return res.status(400).json({ error: 'Patient not found' });
        }
        
        // Prepare diagnostic data
        const diagnosticData = {
          medicalDevice: { 
            connect: { id: medicalDeviceId }
          },
          diagnosticDate: new Date(),
          notes: notes,
          followUpDate: followUpDate,
          followUpRequired: followUpDate ? true : false,
          performedBy: { connect: { id: userId } },
          patient: { connect: { id: clientId } }
        };
        
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
        
        // Create patient history record
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
        
        // Update device status to RESERVED
        await prisma.medicalDevice.update({
          where: { id: medicalDeviceId },
          data: { 
            status: 'RESERVED'
          }
        });
        
        // Create notification for the assigned user
        await prisma.notification.create({
          data: {
            title: 'Nouveau diagnostic créé',
            message: `Un diagnostic a été créé pour le patient ${patient.firstName} ${patient.lastName}`,
            type: 'FOLLOW_UP',
            status: 'PENDING',
            isRead: false,
            user: { connect: { id: userId } },
            patient: { connect: { id: clientId } },
            metadata: { diagnosticId: diagnostic.id }
          }
        });
        
        // Link any uploaded files to the patient and diagnostic
        if (uploadedFileUrls.length > 0) {
          await Promise.all(uploadedFileUrls.map(async (fileUrl: string) => {
            // Create file record linked to patient and diagnostic
            await prisma.file.create({
              data: {
                url: fileUrl,
                type: 'DIAGNOSTIC_DOCUMENT',
                patient: { connect: { id: clientId } },
              }
            });
          }));
        }
        
        // Create a task for follow-up if required
        if (followUpDate) {
          try {
            await prisma.task.create({
              data: {
                title: `Suivi diagnostic pour patient`,
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
        const diagnosticId = String(id);
        
        // First, find the diagnostic to get the associated device ID and related records
        const diagnostic = await prisma.diagnostic.findUnique({
          where: { id: diagnosticId },
          include: {
            result: true,
            Task: true
          }
        });
        
        if (!diagnostic) {
          return res.status(404).json({ error: 'Diagnostic not found' });
        }
        
        // Begin transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
          // 1. Delete related DiagnosticResult if exists
          if (diagnostic.result) {
            await tx.diagnosticResult.delete({
              where: { diagnosticId: diagnosticId }
            });
          }
          
          // 2. Delete related Tasks
          if (diagnostic.Task && diagnostic.Task.length > 0) {
            await tx.task.deleteMany({
              where: { diagnosticId: diagnosticId }
            });
          }
          
          // 3. Reset the device status to ACTIVE and clear the reservedUntil date
          if (diagnostic.medicalDeviceId) {
            await tx.medicalDevice.update({
              where: { id: diagnostic.medicalDeviceId },
              data: { 
                status: 'ACTIVE',
                reservedUntil: null // Clear the reservation date
              }
            });
          }
          
          // 4. Finally, delete the diagnostic record
          await tx.diagnostic.delete({
            where: { id: diagnosticId }
          });
        });
        
        return res.status(200).json({ message: 'Diagnostic deleted successfully and device status reset to ACTIVE' });
      } catch (error) {
        console.error('Error deleting diagnostic:', error);
        return res.status(500).json({ 
          error: 'Error deleting diagnostic', 
          details: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
