import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
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
              name: true,
              brand: true,
              model: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              telephone: true,
            },
          },
          Company: {
            select: {
              companyName: true,
              telephone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({ diagnostics });
    } catch (error) {
      console.error('Error fetching diagnostics:', error);
      return res.status(500).json({ error: 'Error fetching diagnostics' });
    }
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({ multiples: true });
      
      const parseForm = async (): Promise<{ fields: formidable.Fields, files: formidable.Files }> => {
        return new Promise((resolve, reject) => {
          form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
          });
        });
      };
      
      const { fields, files } = await parseForm();
      
      // Parse form data
      const clientId = fields.clientId?.[0] || '';
      const products = JSON.parse(fields.products?.[0] || '[]');
      const followUpDate = fields.followUpDate?.[0] ? new Date(fields.followUpDate[0]) : null;
      const notes = fields.notes?.[0] || '';
      
      // Get user ID from session for history tracking
      const userId = session.user.id;
      
      // Determine if client is a patient or company
      const patient = await prisma.patient.findUnique({
        where: { id: clientId },
        select: { id: true, address: true }
      });
      
      const isPatient = !!patient;
      
      // Get client location for updating device locations
      let clientLocation = null;
      if (isPatient) {
        const patientDetails = await prisma.patient.findUnique({
          where: { id: clientId },
          select: { address: true }
        });
        if (patientDetails && patientDetails.address) {
          clientLocation = patientDetails.address;
        }
      } else {
        const companyDetails = await prisma.company.findUnique({
          where: { id: clientId },
          select: { address: true }
        });
        if (companyDetails && companyDetails.address) {
          clientLocation = companyDetails.address;
        }
      }
      
      // Handle file uploads
      const uploadedFiles = [];
      if (files.documents) {
        const documents = Array.isArray(files.documents) ? files.documents : [files.documents];
        for (const file of documents) {
          const filePath = await saveFile(file);
          uploadedFiles.push({
            filename: file.originalFilename || 'unknown',
            path: filePath,
            size: file.size,
            mimeType: file.mimetype || 'application/octet-stream'
          });
        }
      }
      
      // Create diagnostic records for each product
      const diagnosticRecords = [];
      
      for (const product of products) {
        // Extract the product ID correctly
        const productId = product.id || (product.productId ? product.productId : null);
        
        if (!productId) {
          console.error('Missing product ID:', product);
          return res.status(400).json({ error: 'Missing product ID', product });
        }
        
        // Create diagnostic record with conditional patient/company connection
        let diagnosticData: any = {
          medicalDevice: {
            connect: { id: productId },
          },
          result: '',
          notes,
          diagnosticDate: new Date(),
          followUpDate: followUpDate,
          followUpRequired: followUpDate ? true : false,
          performedBy: {
            connect: { id: userId },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Add either patient or company connection
        if (isPatient) {
          diagnosticData.patient = { connect: { id: clientId } };
        } else {
          diagnosticData.Company = { connect: { id: clientId } };
          // For company case, we need a dummy patient connection (required by schema)
          // This is a workaround for the schema constraint
          const dummyPatient = await prisma.patient.findFirst({
            select: { id: true },
            take: 1
          });
          if (dummyPatient) {
            diagnosticData.patient = { connect: { id: dummyPatient.id } };
          } else {
            return res.status(400).json({ 
              error: 'Cannot create diagnostic for company without any patients in the system' 
            });
          }
        }
        
        const diagnostic = await prisma.diagnostic.create({
          data: diagnosticData,
        });
        
        diagnosticRecords.push(diagnostic);
        
        // Update device location to client location
        if (clientLocation && productId) {
          await prisma.medicalDevice.update({
            where: { id: productId },
            data: {
              location: clientLocation,
            } as any,
          });
        }
        
        // Create patient history record
        if (isPatient) {
          await prisma.patientHistory.create({
            data: {
              patient: {
                connect: { id: clientId }
              },
              actionType: 'DIAGNOSTIC',
              details: {
                diagnosticId: diagnostic.id,
                deviceId: product.id,
                deviceName: product.name || 'Unknown device',
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
        
        // Create user action history record
        await prisma.userActionHistory.create({
          data: {
            user: {
              connect: { id: userId }
            },
            actionType: 'DIAGNOSTIC',
            details: {
              diagnosticId: diagnostic.id,
              clientId: clientId,
              clientType: isPatient ? 'PATIENT' : 'COMPANY',
              deviceId: product.id,
              deviceName: product.name || 'Unknown device',
              action: 'Created diagnostic record'
            },
            relatedItemId: diagnostic.id,
            relatedItemType: 'diagnostic'
          }
        });
        
        // Save parameter values if any
        if (product.parameters && product.parameters.length > 0 && productId) {
          for (const param of product.parameters) {
            const paramId = param.id || param.parameterId;
            if (!paramId) {
              console.warn('Skipping parameter without ID:', param);
              continue;
            }
            
            if (param.value !== undefined && param.value !== null) {
              await prisma.parameterValue.upsert({
                where: {
                  parameterId_medicalDeviceId: {
                    parameterId: paramId,
                    medicalDeviceId: productId,
                  },
                },
                update: {
                  value: String(param.value),
                },
                create: {
                  value: String(param.value),
                  parameter: {
                    connect: { id: paramId },
                  },
                  medicalDevice: {
                    connect: { id: productId },
                  },
                },
              });
            }
          }
        }
      }
      
      // Create file records
      for (const file of uploadedFiles) {
        await prisma.file.create({
          data: {
            url: file.path,
            type: "DOCUMENT",
            ...(isPatient ? {
              patient: { connect: { id: clientId } }
            } : {
              company: { connect: { id: clientId } }
            }),
          },
        });
      }
      
      // Create follow-up notification if follow-up date is provided
      if (followUpDate) {
        await prisma.notification.create({
          data: {
            title: 'Suivi de diagnostic',
            message: `Suivi prévu pour le patient avec ${products.length} appareil(s) diagnostique(s)`,
            type: 'FOLLOW_UP' as any,
            status: 'PENDING' as any,
            dueDate: followUpDate,
            ...(isPatient ? {
              patient: { connect: { id: clientId } }
            } : {
              company: { connect: { id: clientId } }
            }),
          },
        });
      }
      
      return res.status(201).json({ 
        success: true, 
        diagnostics: diagnosticRecords,
        message: 'Diagnostic records created successfully with history tracking'
      });
    } catch (error) {
      console.error('Error creating diagnostic:', error);
      return res.status(500).json({ error: 'Error creating diagnostic', details: String(error) });
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
