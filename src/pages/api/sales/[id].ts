import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

/**
 * Sale details API endpoint
 * 
 * Handles GET, PUT, and DELETE requests for a specific sale
 * 
 * @param {NextApiRequest} req - The incoming request
 * @param {NextApiResponse} res - The outgoing response
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    console.log(`[SALE-API] ${req.method} request for sale ID: ${id}`);
    
    if (!id || typeof id !== 'string') {
      console.log(`[SALE-API] Invalid sale ID: ${id}`);
      return res.status(400).json({ error: 'Invalid sale ID' });
    }
    
    switch (req.method) {
      case 'GET':
        // Get a single sale by ID
        console.log(`[SALE-API] Fetching sale with ID: ${id}`);
        const sale = await prisma.sale.findUnique({
          where: { id },
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
                telephoneTwo: true,
                cin: true,
                cnamId: true,
                address: true,
                affiliation: true,
                beneficiaryType: true,
              },
            },
            company: {
              select: {
                id: true,
                companyName: true,
                telephone: true,
              },
            },
            payment: {
              include: {
                paymentDetails: true // Include payment details
              }
            },
            items: {
              include: {
                product: true,
                medicalDevice: true,
              },
            },
          },
        });

        if (!sale) {
          console.log(`[SALE-API] Sale not found with ID: ${id}`);
          return res.status(404).json({ error: 'Sale not found' });
        }

        console.log(`[SALE-API] Sale found with ID: ${id}, payment ID: ${sale.paymentId || 'none'}`);

        // Log the raw sale data for debugging
        console.log(`[SALE-API] Raw sale data:`, {
          id: sale.id,
          status: sale.status,
          paymentId: sale.paymentId,
          hasPayment: !!sale.payment,
          paymentMethod: sale.payment?.method,
          paymentDetailsCount: sale.payment?.paymentDetails?.length || 0,
          hasPaymentNotes: !!sale.payment?.notes
        });
        
        // If payment has notes, try to parse and log them
        if (sale.payment?.notes) {
          try {
            const notesData = JSON.parse(sale.payment.notes);
            console.log(`[SALE-API] Payment notes contains:`, {
              hasPaymentsArray: !!notesData.payments,
              paymentsCount: notesData.payments?.length || 0,
              paymentTypes: notesData.payments?.map((p: any) => p.type).join(', ') || 'none'
            });
          } catch (error) {
            console.log(`[SALE-API] Error parsing payment notes:`, error);
          }
        }
        
        // Transform the data to match the expected format in the frontend
        const transformedSale = {
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
          
          // Payment information with details
          paymentId: sale.paymentId,
          payment: sale.payment ? {
            id: sale.payment.id,
            amount: sale.payment.amount,
            status: sale.payment.status,
            method: sale.payment.method,
            createdAt: sale.payment.createdAt,
            // Handle both storage approaches: PaymentDetail records or JSON in notes
            paymentDetails: getPaymentDetails(sale.payment),
            // Group payment details by method for easy display
            paymentByMethod: groupPaymentDetailsByMethod(getPaymentDetails(sale.payment))
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
        };

        return res.status(200).json({ sale: transformedSale });

      case 'PUT':
        // Update a sale
        const updateData = req.body;
        
        // Validate the update data
        if (!updateData) {
          return res.status(400).json({ error: 'No update data provided' });
        }

        // Update the sale
        const updatedSale = await prisma.sale.update({
          where: { id },
          data: {
            status: updateData.status,
            notes: updateData.notes,
            discount: updateData.discount ? parseFloat(updateData.discount) : undefined,
            finalAmount: updateData.finalAmount ? parseFloat(updateData.finalAmount) : undefined,
            // Only update these if they are provided
            patientId: updateData.patientId || undefined,
            companyId: updateData.companyId || undefined,
            // Don't allow updating the processedBy user
          },
          include: {
            processedBy: true,
            patient: true,
            company: true,
            payment: {
              include: {
                paymentDetails: true
              }
            },
            items: {
              include: {
                product: true,
                medicalDevice: true,
              },
            },
          },
        });

        return res.status(200).json({ sale: updatedSale });

      case 'DELETE':
        // Check if the sale can be deleted (e.g., not COMPLETED)
        const saleToDelete = await prisma.sale.findUnique({
          where: { id },
          select: { status: true },
        });

        if (!saleToDelete) {
          return res.status(404).json({ error: 'Sale not found' });
        }

        // Only allow deletion of sales that are not completed
        if (saleToDelete.status === 'COMPLETED') {
          return res.status(400).json({ 
            error: 'Cannot delete a completed sale. Consider cancelling it instead.' 
          });
        }

        // Delete the sale
        await prisma.sale.delete({
          where: { id },
        });

        return res.status(200).json({ message: 'Sale deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Helper function to get a display-friendly payment method name
function getPaymentMethodDisplay(method: string): string {
  const methodMap: Record<string, string> = {
    'especes': 'Espèces',
    'cheque': 'Chèque',
    'virement': 'Virement',
    'mondat': 'Mandat',
    'cnam': 'CNAM',
    'traite': 'Traite'
  };
  return methodMap[method.toLowerCase()] || method;
}

// Helper function to get a display-friendly payment classification
function getPaymentClassificationDisplay(classification: string): string {
  const classMap: Record<string, string> = {
    'principale': 'Principal',
    'garantie': 'Garantie',
    'complement': 'Complément'
  };
  return classMap[classification.toLowerCase()] || classification;
}

// Helper function to extract payment details from either PaymentDetail records or notes JSON
function getPaymentDetails(payment: any): any[] {
  if (!payment) {
    console.log(`[SALE-API] getPaymentDetails called with null or undefined payment`);
    return [];
  }
  
  console.log(`[SALE-API] getPaymentDetails called for payment:`, {
    id: payment?.id || 'unknown',
    method: payment?.method,
    amount: payment?.amount,
    status: payment?.status,
    hasPaymentDetails: !!payment?.paymentDetails,
    paymentDetailsCount: payment?.paymentDetails?.length || 0,
    hasNotes: !!payment?.notes,
    notesLength: payment?.notes?.length || 0
  });
  
  // If we have PaymentDetail records, use those
  if (payment.paymentDetails && Array.isArray(payment.paymentDetails) && payment.paymentDetails.length > 0) {
    console.log(`[SALE-API] Found ${payment.paymentDetails.length} PaymentDetail records`);
    console.log(`[SALE-API] PaymentDetail methods: ${payment.paymentDetails.map((d: any) => d.method).join(', ')}`);
    
    return payment.paymentDetails.map((detail: any) => {
      console.log(`[SALE-API] Processing PaymentDetail:`, {
        id: detail?.id,
        method: detail?.method,
        amount: detail?.amount,
        classification: detail?.classification,
        reference: detail?.reference,
        hasMetadata: !!detail?.metadata
      });
      return {
        id: detail.id,
        method: detail.method,
        amount: detail.amount,
        classification: detail.classification,
        reference: detail.reference,
        // Format for display
        displayMethod: getPaymentMethodDisplay(detail.method),
        displayClassification: getPaymentClassificationDisplay(detail.classification),
        // Include metadata if available
        ...(detail.metadata ? { metadata: detail.metadata } : {})
      };
    });
  }
  
  // Otherwise, try to parse the notes field if it exists and contains payment data
  if (payment.notes && typeof payment.notes === 'string') {
    console.log(`[SALE-API] No PaymentDetail records found, checking notes field`);
    console.log(`[SALE-API] Notes field length: ${payment.notes.length} characters`);
    console.log(`[SALE-API] Notes field content (first 200 chars): ${payment.notes.substring(0, 200)}...`);
    
    try {
      const notesData = JSON.parse(payment.notes);
      console.log(`[SALE-API] Successfully parsed notes JSON:`, {
        hasPaymentsArray: !!notesData.payments,
        paymentsCount: notesData.payments?.length || 0,
        notesDataKeys: Object.keys(notesData)
      });
      
      // If we have a payments array in the notes JSON
      if (notesData.payments && Array.isArray(notesData.payments)) {
        console.log(`[SALE-API] Found ${notesData.payments.length} legacy payment details in notes`);
        console.log(`[SALE-API] Legacy payment details:`, JSON.stringify(notesData.payments, null, 2));
        
        return notesData.payments.map((detail: any) => {
          const legacyId = detail.id || `legacy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          console.log(`[SALE-API] Processing legacy payment:`, {
            legacyId,
            type: detail.type || 'unknown',
            amount: detail.amount || 0,
            classification: detail.classification || 'principale',
            reference: detail.reference || detail.dossierReference || null,
            hasMetadata: !!detail.metadata
          });
          
          return {
            id: legacyId,
            method: detail.type || 'unknown',
            amount: detail.amount || 0,
            classification: detail.classification || 'principale',
            reference: detail.reference || detail.dossierReference || null,
            // Format for display
            displayMethod: getPaymentMethodDisplay(detail.type || 'unknown'),
            displayClassification: getPaymentClassificationDisplay(detail.classification || 'principale'),
            // Include CNAM-specific fields if available
            ...(detail.etatDossier ? { etatDossier: detail.etatDossier } : {}),
            ...(detail.isPending !== undefined ? { isPending: detail.isPending } : {}),
            ...(detail.metadata ? { metadata: detail.metadata } : {})
          };
        });
      } else {
        console.log(`[SALE-API] No payments array found in notes JSON or it's not an array`);
      }
    } catch (error) {
      console.error('[SALE-API] Error parsing payment notes:', error);
      return [];
    }
  }
  
  // If no details found, return empty array
  console.log(`[SALE-API] No payment details found in either PaymentDetail records or notes JSON`);
  return [];
}

// Helper function to group payment details by method
function groupPaymentDetailsByMethod(details: any[]): Record<string, any> {
  console.log(`[SALE-API] groupPaymentDetailsByMethod called with ${details.length} details`);
  console.log(`[SALE-API] Payment details to group:`, JSON.stringify(details, null, 2));
  
  const result = details.reduce((acc, detail) => {
    if (!detail || typeof detail !== 'object') {
      console.log(`[SALE-API] Invalid detail item:`, detail);
      return acc;
    }
    
    if (!detail.method) {
      console.log(`[SALE-API] Detail missing method:`, detail);
      return acc;
    }
    
    const method = detail.method.toLowerCase();
    console.log(`[SALE-API] Processing detail with method: ${method}`);
    
    if (!acc[method]) {
      acc[method] = {
        method: method,
        displayMethod: getPaymentMethodDisplay(method),
        details: [],
        totalAmount: 0
      };
      console.log(`[SALE-API] Created new group for method: ${method}`);
    }
    
    acc[method].details.push(detail);
    
    // Safely parse amount
    const amount = typeof detail.amount === 'number' 
      ? detail.amount 
      : parseFloat(String(detail.amount || 0));
    
    if (isNaN(amount)) {
      console.log(`[SALE-API] Invalid amount for detail:`, detail);
    } else {
      acc[method].totalAmount += amount;
      console.log(`[SALE-API] Added amount ${amount} to ${method}, new total: ${acc[method].totalAmount}`);
    }
    
    return acc;
  }, {});
  
  console.log(`[SALE-API] Final grouped payment details:`, JSON.stringify(result, null, 2));
  return result;
}