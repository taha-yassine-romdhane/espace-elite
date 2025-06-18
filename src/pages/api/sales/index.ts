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
      return `Chèque N°${payment.chequeNumber || ''} ${payment.bankName || ''}: ${payment.amount} DT`;
      
    case 'virement':
      return `Virement Réf:${payment.reference || ''}: ${payment.amount} DT`;
      
    case 'mondat':
      return `Mandat N°${payment.mondatNumber || ''}: ${payment.amount} DT`;
      
    case 'cnam':
      return `CNAM Dossier N°${payment.fileNumber || ''}: ${payment.amount} DT`;
      
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
        processedBy: {
          id: sale.processedBy.id,
          name: `${sale.processedBy.firstName} ${sale.processedBy.lastName}`,
          email: sale.processedBy.email,
        },
        
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
          if (saleData.payment) {
            // Parse payment amount to ensure it's a valid number
            const paymentAmount = typeof saleData.payment.amount === 'string' 
              ? parseFloat(saleData.payment.amount) 
              : Number(saleData.payment.amount);
            
            // Check if we have multiple payments
            const hasMultiplePayments = saleData.payment.payments && Array.isArray(saleData.payment.payments) && saleData.payment.payments.length > 0;
            
            // Create the payment record with all details
            const payment = await tx.payment.create({
              data: {
                amount: paymentAmount,
                // Use the primary payment method if available, otherwise use the first one
                method: hasMultiplePayments 
                  ? mapPaymentMethod(saleData.payment.payments.find((p: any) => p.classification === 'principale')?.type || saleData.payment.payments[0].type)
                  : mapPaymentMethod(saleData.payment.method),
                status: mapPaymentStatus(saleData.payment.status),
                // Store reference information in the appropriate fields based on payment method
                chequeNumber: saleData.payment.method === 'cheque' ? saleData.payment.reference?.split(' ')[0] || null : null,
                bankName: saleData.payment.method === 'cheque' ? saleData.payment.reference?.split(' ')[1] || null : null,
                referenceNumber: ['virement', 'mondat'].includes(saleData.payment.method) ? saleData.payment.reference || null : null,
                cnamCardNumber: saleData.payment.method === 'cnam' ? saleData.payment.reference || null : null,
                notes: saleData.payment.notes || null,
                paymentDate: new Date(),
                dueDate: saleData.payment.dueDate ? new Date(saleData.payment.dueDate) : null,
                // Create payment details for each payment method
                paymentDetails: hasMultiplePayments ? {
                  create: saleData.payment.payments.map((p: any) => ({
                    method: p.type,
                    amount: typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount),
                    classification: p.classification || 'principale',
                    reference: createPaymentReference(p),
                    metadata: p // Store all payment data as metadata
                  }))
                } : undefined
              }
            });
            paymentId = payment.id;
          }
          
          // 2. Create the sale
          const sale = await tx.sale.create({
            data: {
              saleDate: new Date(saleData.saleDate || new Date()),
              totalAmount: parseFloat(saleData.totalAmount),
              discount: saleData.discount ? parseFloat(saleData.discount) : 0,
              finalAmount: parseFloat(saleData.finalAmount),
              status: saleData.status || 'PENDING',
              notes: saleData.notes,
              processedById: saleData.processedById,
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