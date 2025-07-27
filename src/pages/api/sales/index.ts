import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// Helper function to map frontend payment types to Prisma PaymentMethod enum
function mapPaymentMethod(frontendMethod: string): PaymentMethod {
  switch (frontendMethod?.toLowerCase()) {
    case 'cheque':
      return PaymentMethod.CHEQUE;
    case 'especes':
      return PaymentMethod.CASH;
    case 'cnam':
      return PaymentMethod.CNAM;
    case 'virement':
      return PaymentMethod.VIREMENT;
    case 'traite':
      return PaymentMethod.TRAITE;
    case 'mandat':
      return PaymentMethod.MANDAT;
    // For other payment types not in the enum, default to CASH
    default:
      return PaymentMethod.CASH;
  }
}

// Helper function to map frontend payment status to Prisma PaymentStatus enum
function mapPaymentStatus(frontendStatus: string): PaymentStatus {
  switch (frontendStatus?.toLowerCase()) {
    case 'paid':
    case 'completed':
      return PaymentStatus.PAID;
    case 'partial':
      return PaymentStatus.PARTIAL;
    case 'guarantee':
    case 'garantie':
      return PaymentStatus.GUARANTEE;
    default:
      return PaymentStatus.PENDING;
  }
}

// Helper function to create a payment reference string based on payment type
function createPaymentReference(payment: any): string {
  if (!payment || !payment.type) return '';
  
  switch (payment.type.toLowerCase()) {
    case 'especes':
      return `Espèces: ${payment.amount} DT`;
      
    case 'cheque':
      return `Chèque N°${payment.chequeNumber || ''} ${payment.bank || payment.bankName || ''}: ${payment.amount} DT`;
      
    case 'virement':
      return `Virement Réf:${payment.reference || ''} ${payment.bank ? `(${payment.bank})` : ''}: ${payment.amount} DT`;
      
    case 'mandat':
      return `Mandat N°${payment.mondatNumber || payment.reference || ''}: ${payment.amount} DT`;
      
    case 'cnam':
      const cnamRef = payment.dossierNumber || payment.fileNumber || '';
      const bondType = payment.cnamInfo?.bondType || '';
      const step = payment.cnamInfo?.currentStep || '';
      return `CNAM ${bondType} Dossier:${cnamRef} Étape:${step}: ${payment.amount} DT`;
      
    case 'traite':
      return `Traite Échéance:${payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : ''}: ${payment.amount} DT`;
      
    default:
      return `${payment.type}: ${payment.amount} DT`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const sales = await prisma.sale.findMany({
        include: {
          processedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
          company: {
            select: {
              id: true,
              companyName: true,
              telephone: true,
            },
          },
          payment: true,
          items: {
            include: {
              product: true,
              medicalDevice: true,
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
      });

      // Transform the data to match the expected format in the frontend
      const transformedSales = sales.map(sale => ({
        id: sale.id,
        invoiceNumber: sale.invoiceNumber || `INV-${sale.id.substring(0, 8).toUpperCase()}`,
        saleDate: sale.saleDate,
        totalAmount: sale.totalAmount,
        discount: sale.discount || 0,
        finalAmount: sale.finalAmount,
        status: sale.status,
        notes: sale.notes || null,
        
        // Who processed the sale
        processedById: sale.processedById,
        processedBy: sale.processedBy ? {
          id: sale.processedBy.id,
          firstName: sale.processedBy.firstName,
          lastName: sale.processedBy.lastName,
          name: `${sale.processedBy.firstName} ${sale.processedBy.lastName}`,
          email: sale.processedBy.email,
        } : null,
        
        // Client information (either patient or company)
        patientId: sale.patientId,
        patient: sale.patient ? {
          id: sale.patient.id,
          firstName: sale.patient.firstName,
          lastName: sale.patient.lastName,
          telephone: sale.patient.telephone,
          fullName: `${sale.patient.firstName} ${sale.patient.lastName}`,
        } : null,
        
        companyId: sale.companyId,
        company: sale.company ? {
          id: sale.company.id,
          companyName: sale.company.companyName,
          telephone: sale.company.telephone,
        } : null,
        
        // Client display name (either patient name or company name)
        clientName: sale.patient 
          ? `${sale.patient.firstName} ${sale.patient.lastName}`
          : (sale.company ? sale.company.companyName : 'Client inconnu'),
        
        clientType: sale.patient ? 'PATIENT' : (sale.company ? 'COMPANY' : null),
        
        // Payment information
        paymentId: sale.paymentId,
        payment: sale.payment ? {
          id: sale.payment.id,
          amount: sale.payment.amount,
          status: sale.payment.status,
          method: sale.payment.method,
        } : null,
        
        // Items in the sale
        items: sale.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          itemTotal: item.itemTotal,
          serialNumber: item.serialNumber || null,
          warranty: item.warranty || null,
          
          // Product or medical device information
          productId: item.productId,
          product: item.product ? {
            id: item.product.id,
            name: item.product.name,
            type: item.product.type,
            brand: item.product.brand || null,
            model: item.product.model || null,
          } : null,
          
          medicalDeviceId: item.medicalDeviceId,
          medicalDevice: item.medicalDevice ? {
            id: item.medicalDevice.id,
            name: item.medicalDevice.name,
            type: item.medicalDevice.type,
            brand: item.medicalDevice.brand || null,
            model: item.medicalDevice.model || null,
            serialNumber: item.medicalDevice.serialNumber || null,
          } : null,
          
          // Item name for display
          name: item.product 
            ? item.product.name 
            : (item.medicalDevice ? item.medicalDevice.name : 'Article inconnu'),
        })),
        
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      }));

      return res.status(200).json({ sales: transformedSales });
    }

    if (req.method === 'POST') {
      const session = await getServerSession(req, res, authOptions);

      if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const saleData = req.body;
      
      // Validate required fields
      if (!saleData) {
        return res.status(400).json({ error: 'No sale data provided' });
      }
      
      if (!saleData.processedById) {
        // Use the current user's ID from the session
        saleData.processedById = session.user.id;  
      }
      
      // Validate client information
      if (!saleData.patientId && !saleData.companyId) {
        return res.status(400).json({ error: 'Either patientId or companyId must be provided' });
      }
      
      // Validate items
      if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
        return res.status(400).json({ error: 'At least one item must be provided' });
      }
      
      try {
        // Start a transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
          // 1. Create the payment if provided
          let paymentId = null;
          
          // Handle the new payment structure from the stepper
          // The stepper sends payment data in saleData.payment as an array
          let payments: any[] = [];
          if (saleData.payment) {
            // The stepper now sends an array of payments directly
            payments = Array.isArray(saleData.payment) ? saleData.payment : [saleData.payment];
            
            if (payments.length > 0) {
              // Calculate total payment amount
              const totalPaymentAmount = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
              
              // Get the primary payment (first one or the one marked as 'principale')
              const primaryPayment = payments.find((p: any) => p.classification === 'principale') || payments[0];
              
              // Create the main payment record
              const payment = await tx.payment.create({
                data: {
                  amount: totalPaymentAmount,
                  method: mapPaymentMethod(primaryPayment.type),
                  status: totalPaymentAmount >= Number(saleData.finalAmount) ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
                  // Store primary payment details in main fields
                  chequeNumber: primaryPayment.type === 'cheque' ? primaryPayment.chequeNumber || null : null,
                  bankName: primaryPayment.type === 'cheque' ? primaryPayment.bank || null : null,
                  referenceNumber: ['virement', 'mandat'].includes(primaryPayment.type) ? primaryPayment.reference || null : null,
                  cnamCardNumber: primaryPayment.type === 'cnam' ? primaryPayment.dossierNumber || null : null,
                  notes: primaryPayment.notes || null,
                  paymentDate: primaryPayment.paymentDate ? new Date(primaryPayment.paymentDate) : new Date(),
                  dueDate: primaryPayment.dueDate ? new Date(primaryPayment.dueDate) : null,
                  // Create payment details for each payment method
                  paymentDetails: {
                    create: payments.map((p: any) => ({
                      method: p.type,
                      amount: Number(p.amount),
                      classification: p.classification || 'principale',
                      reference: createPaymentReference(p),
                      metadata: {
                        ...p,
                        // Store CNAM info if present
                        ...(p.cnamInfo && { cnamInfo: p.cnamInfo }),
                        // Store payment-specific details
                        ...(p.type === 'cheque' && {
                          chequeNumber: p.chequeNumber,
                          bank: p.bank
                        }),
                        ...(p.type === 'virement' && {
                          reference: p.reference,
                          bank: p.bank
                        }),
                        ...(p.type === 'cnam' && {
                          bondType: p.cnamInfo?.bondType,
                          dossierNumber: p.dossierNumber,
                          currentStep: p.cnamInfo?.currentStep,
                          status: p.cnamInfo?.status
                        })
                      }
                    }))
                  }
                }
              });
              paymentId = payment.id;
            }
          }
          
          // 1.5. Create CNAM dossiers for CNAM payments (only for patients)
          const cnamDossierIds: string[] = [];
          if (saleData.patientId && paymentId) {
            const cnamPayments = payments.filter((p: any) => p.type === 'cnam' && p.cnamInfo);
            
            for (const cnamPayment of cnamPayments) {
              if (cnamPayment.cnamInfo && cnamPayment.dossierNumber) {
                // Map bond type from string to enum
                const bondTypeEnum = cnamPayment.cnamInfo.bondType?.toUpperCase() || 'AUTRE';
                const validBondType = ['MASQUE', 'CPAP', 'AUTRE'].includes(bondTypeEnum) ? bondTypeEnum : 'AUTRE';
                
                // Map status from string to enum  
                const statusEnum = cnamPayment.cnamInfo.status?.toUpperCase() || 'EN_ATTENTE_APPROBATION';
                const validStatus = ['EN_ATTENTE_APPROBATION', 'APPROUVE', 'EN_COURS', 'TERMINE', 'REFUSE'].includes(statusEnum) 
                  ? statusEnum : 'EN_ATTENTE_APPROBATION';
                
                // Create CNAM dossier (will update with saleId after sale creation)
                const cnamDossier = await tx.cNAMDossier.create({
                  data: {
                    dossierNumber: cnamPayment.dossierNumber,
                    bondType: validBondType as any,
                    bondAmount: Number(cnamPayment.cnamInfo.bondAmount || cnamPayment.amount),
                    devicePrice: Number(cnamPayment.cnamInfo.devicePrice || 0),
                    complementAmount: Number(cnamPayment.cnamInfo.complementAmount || 0),
                    currentStep: cnamPayment.cnamInfo.currentStep || 1,
                    totalSteps: cnamPayment.cnamInfo.totalSteps || 7,
                    status: validStatus as any,
                    notes: cnamPayment.notes || cnamPayment.cnamInfo.notes,
                    saleId: '', // Temporary - will be updated after sale creation
                    patientId: saleData.patientId
                  }
                });
                
                cnamDossierIds.push(cnamDossier.id);
              }
            }
          }
          
          // 2. Generate invoice number and create the sale record
          const salesCount = await tx.sale.count();
          const newInvoiceNumber = (salesCount + 1).toString().padStart(5, '0');

          const sale = await tx.sale.create({
            data: {
              invoiceNumber: newInvoiceNumber,
              saleDate: new Date(saleData.saleDate || new Date()),
              totalAmount: parseFloat(saleData.totalAmount),
              discount: saleData.discount ? parseFloat(saleData.discount) : 0,
              finalAmount: parseFloat(saleData.finalAmount),
              status: saleData.status || 'PENDING',
              notes: saleData.notes,
              processedById: saleData.processedById, // Use the user ID from the session
              patientId: saleData.patientId || null,
              companyId: saleData.companyId || null,
              paymentId: paymentId,
              // Items will be created in the next step
            }
          });
          
          // 3. Create the sale items
          const saleItems = [];
          for (const item of saleData.items) {
            const saleItem = await tx.saleItem.create({
              data: {
                saleId: sale.id,
                quantity: parseInt(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                discount: item.discount ? parseFloat(item.discount) : 0,
                itemTotal: parseFloat(item.itemTotal),
                serialNumber: item.serialNumber,
                warranty: item.warranty,
                productId: item.productId || null,
                medicalDeviceId: item.medicalDeviceId || null,
              }
            });
            saleItems.push(saleItem);
            
            // 4. Update inventory if needed
            if (item.productId) {
              // Find all stock records for this product
              const stockRecords = await tx.stock.findMany({
                where: { productId: item.productId },
                orderBy: { updatedAt: 'desc' }
              });
              
              if (stockRecords.length > 0) {
                // Update the most recently updated stock record
                const stockToUpdate = stockRecords[0];
                const newQuantity = Math.max(0, stockToUpdate.quantity - parseInt(item.quantity));
                
                await tx.stock.update({
                  where: { id: stockToUpdate.id },
                  data: { quantity: newQuantity }
                });
              }
            }
            
            if (item.medicalDeviceId) {
              await tx.medicalDevice.update({
                where: { id: item.medicalDeviceId },
                data: {
                  status: 'SOLD',
                  // Associate the device with the patient or company
                  patientId: saleData.patientId || null,
                  companyId: saleData.companyId || null
                }
              });
            }
          }
          
          // 4.5. Update CNAM dossiers with sale ID and create step history
          if (cnamDossierIds.length > 0) {
            for (const dossierId of cnamDossierIds) {
              // Update CNAM dossier with sale ID
              await tx.cNAMDossier.update({
                where: { id: dossierId },
                data: { saleId: sale.id }
              });
              
              // Create initial step history entry
              const dossier = await tx.cNAMDossier.findUnique({
                where: { id: dossierId }
              });
              
              if (dossier) {
                await tx.cNAMStepHistory.create({
                  data: {
                    dossierId: dossierId,
                    toStep: dossier.currentStep,
                    toStatus: dossier.status,
                    notes: 'Dossier CNAM créé lors de la vente',
                    changedById: saleData.processedById,
                    changeDate: new Date()
                  }
                });
              }
            }
          }
          
          // 5. Create patient history record if a patient is associated
          if (sale.patientId) {
            const patient = await tx.patient.findUnique({
              where: { id: sale.patientId },
              select: { doctorId: true }
            });

            await tx.patientHistory.create({
              data: {
                patientId: sale.patientId,
                actionType: 'SALE',
                performedById: sale.processedById,
                relatedItemId: sale.id,
                relatedItemType: 'Sale',
                details: {
                  saleId: sale.id,
                  finalAmount: sale.finalAmount,
                  notes: sale.notes,
                  itemCount: saleData.items.length,
                  responsibleDoctorId: patient?.doctorId,
                },
              },
            });
          }
          
          // Return the created sale with its items
          return { sale, saleItems };
        });
        
        return res.status(201).json({
          message: 'Sale created successfully',
          sale: result.sale,
          saleItems: result.saleItems
        });
      } catch (error) {
        console.error('Error creating sale:', error);
        return res.status(500).json({ error: 'Failed to create sale' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}