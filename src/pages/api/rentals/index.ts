import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Fetch all rentals with related data
        const rentals = await prisma.rental.findMany({
          include: {
            medicalDevice: true,
            patient: true,
            Company: true,
            payment: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        // Transform the data to match the expected format in the frontend
        const transformedRentals = rentals.map(rental => ({
          id: rental.id,
          medicalDeviceId: rental.medicalDeviceId,
          medicalDevice: {
            id: rental.medicalDevice.id,
            name: rental.medicalDevice.name,
            type: rental.medicalDevice.type,
            brand: rental.medicalDevice.brand || null,
            model: rental.medicalDevice.model || null,
            serialNumber: rental.medicalDevice.serialNumber || null,
          },
          patientId: rental.patientId,
          patient: rental.patient ? {
            id: rental.patient.id,
            firstName: rental.patient.firstName,
            lastName: rental.patient.lastName,
            telephone: rental.patient.telephone,
          } : null,
          companyId: rental.companyId || null,
          company: rental.Company ? {
            id: rental.Company.id,
            companyName: rental.Company.companyName,
            telephone: rental.Company.telephone,
          } : null,
          startDate: rental.startDate,
          endDate: rental.endDate,
          notes: rental.notes || null,
          paymentId: rental.paymentId || null,
          payment: rental.payment ? {
            id: rental.payment.id,
            amount: rental.payment.amount,
            status: rental.payment.status,
            method: rental.payment.method,
          } : null,
          createdAt: rental.createdAt,
          updatedAt: rental.updatedAt,
        }));

        return res.status(200).json({ rentals: transformedRentals });

      case 'POST':
        // Create a new rental
        const { 
          clientId, 
          clientType, 
          products, 
          startDate, 
          endDate, 
          notes, 
          payment, 
          status, 
          totalPrice, 
          paidAmount, 
          remainingAmount 
        } = req.body;
        
        // Validate required fields
        if (!clientId || !products || !startDate || !endDate) {
          return res.status(400).json({ 
            error: 'Missing required fields: clientId, products, startDate, endDate are required' 
          });
        }
        
        // Validate products array
        if (!Array.isArray(products) || products.length === 0) {
          return res.status(400).json({ 
            error: 'At least one product is required for rental' 
          });
        }
        
        try {
          // Start a transaction to ensure all operations succeed or fail together
          const result = await prisma.$transaction(async (tx) => {
            // Create payment record if payment data is provided
            let paymentRecord = null;
            if (payment) {
              // Ensure payment method is set - default to CASH if not provided
              const paymentMethod = payment.method || 'CASH';
              
              // Validate that the method is one of the allowed enum values
              if (!['CNAM', 'CHEQUE', 'CASH', 'BANK_TRANSFER', 'MAD', 'TRAITE'].includes(paymentMethod)) {
                throw new Error(`Invalid payment method: ${paymentMethod}. Must be one of: CNAM, CHEQUE, CASH, BANK_TRANSFER, MAD, TRAITE`);
              }
              
              // Map and validate payment status to ensure it's a valid enum value
              let paymentStatus = payment.status || 'PENDING';
              // Only allow valid PaymentStatus enum values
              const validStatuses = ['PENDING', 'PAID', 'GUARANTEE', 'PARTIAL'];
              if (!validStatuses.includes(paymentStatus)) {
                // Map custom statuses to valid ones
                if (paymentStatus === 'COMPLETED_WITH_PENDING_CNAM') {
                  paymentStatus = 'PARTIAL'; // Map to PARTIAL as it's partially paid
                } else if (paymentStatus === 'COMPLETED') {
                  paymentStatus = 'PAID'; // Map COMPLETED to PAID
                } else {
                  // Default to PENDING for any other invalid status
                  paymentStatus = 'PENDING';
                }
              }
              
              paymentRecord = await tx.payment.create({
                data: {
                  amount: payment.amount || totalPrice,
                  method: paymentMethod,
                  status: paymentStatus,
                  chequeNumber: payment.chequeNumber,
                  bankName: payment.bankName,
                  referenceNumber: payment.referenceNumber,
                  cnamCardNumber: payment.cnamCardNumber,
                  notes: payment.notes,
                  patientId: clientType === 'patient' ? clientId : null,
                  companyId: clientType === 'societe' ? clientId : null,
                  // Add any other payment fields as needed
                }
              });
            }
            
            // Create rental records for each product
            const rentalRecords = [];
            
            for (const product of products) {
              // Create the rental record
              const rental = await tx.rental.create({
                data: {
                  medicalDeviceId: product.productId,
                  patientId: clientType === 'patient' ? clientId : null,
                  companyId: clientType === 'societe' ? clientId : null,
                  startDate: new Date(startDate),
                  endDate: new Date(endDate),
                  notes: notes || null,
                  paymentId: paymentRecord?.id || null,
                },
                include: {
                  medicalDevice: true,
                  patient: true,
                  Company: true,
                  payment: true,
                }
              });
              
              // Update the medical device to associate it with the patient/company
              if (clientType === 'patient' && clientId) {
                await tx.medicalDevice.update({
                  where: { id: product.productId },
                  data: { patientId: clientId }
                });
              } else if (clientType === 'societe' && clientId) {
                await tx.medicalDevice.update({
                  where: { id: product.productId },
                  data: { companyId: clientId }
                });
              }
              
              // Create patient history record for the rental
              if (rental.patientId) {
                const patient = await tx.patient.findUnique({
                  where: { id: rental.patientId },
                  select: { doctorId: true }
                });

                await tx.patientHistory.create({
                  data: {
                    patientId: rental.patientId,
                    actionType: 'RENTAL',
                    performedById: session.user.id,
                    relatedItemId: rental.id,
                    relatedItemType: 'Rental',
                    details: {
                      rentalId: rental.id,
                      deviceId: rental.medicalDeviceId,
                      deviceName: rental.medicalDevice.name,
                      startDate: rental.startDate,
                      endDate: rental.endDate,
                      notes: rental.notes,
                      responsibleDoctorId: patient?.doctorId,
                    },
                  },
                });
              }

              rentalRecords.push(rental);
            }
            
            return {
              rentals: rentalRecords,
              payment: paymentRecord
            };
          });
          
          return res.status(201).json({
            success: true,
            message: 'Rental created successfully',
            data: result
          });
          
        } catch (error) {
          console.error('Error creating rental:', error);
          return res.status(500).json({ 
            error: 'Failed to create rental', 
            details: error as string 
          });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
