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
        // Fetch all rentals with enhanced related data
        const rentals = await prisma.rental.findMany({
          include: {
            medicalDevice: {
              select: {
                id: true,
                name: true,
                type: true,
                brand: true,
                model: true,
                serialNumber: true,
                rentalPrice: true,
              }
            },
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                telephone: true,
                cnamId: true,
              }
            },
            Company: {
              select: {
                id: true,
                companyName: true,
                telephone: true,
              }
            },
            payment: true,
            cnamBonds: {
              select: {
                id: true,
                bondNumber: true,
                bondType: true,
                status: true,
                totalAmount: true,
                coveredMonths: true,
                startDate: true,
                endDate: true,
              }
            },
            rentalPeriods: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                amount: true,
                paymentMethod: true,
                isGapPeriod: true,
                gapReason: true,
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
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
        // Create an enhanced rental with comprehensive data
        const { 
          clientId, 
          clientType, 
          products, 
          // Enhanced rental details
          globalStartDate,
          globalEndDate,
          isGlobalOpenEnded,
          urgentRental,
          productPeriods,
          identifiedGaps,
          notes,
          // Enhanced payment data
          paymentPeriods,
          cnamBonds,
          depositAmount,
          depositMethod,
          paymentGaps,
          cnamEligible,
          // Legacy fields for compatibility
          startDate, 
          endDate, 
          payment,
          // Status and totals
          status,
          totalPrice,
          totalPaymentAmount,
          isRental
        } = req.body;
        
        // Use enhanced or legacy date fields
        const rentalStartDate = globalStartDate || startDate;
        const rentalEndDate = globalEndDate || endDate;
        
        // Validate required fields
        if (!clientId || !products || !rentalStartDate) {
          return res.status(400).json({ 
            error: 'Missing required fields: clientId, products, and start date are required' 
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
            // Create CNAM bonds first if provided (only for patients)
            let cnamBondRecords = [];
            if (cnamBonds && Array.isArray(cnamBonds) && cnamBonds.length > 0 && clientType === 'patient' && clientId) {
              for (const bond of cnamBonds) {
                const cnamBondRecord = await tx.cnamBondRental.create({
                  data: {
                    bondNumber: bond.bondNumber || null,
                    bondType: bond.bondType,
                    status: bond.status || 'EN_ATTENTE_APPROBATION',
                    dossierNumber: bond.dossierNumber || null,
                    submissionDate: bond.submissionDate ? new Date(bond.submissionDate) : null,
                    approvalDate: bond.approvalDate ? new Date(bond.approvalDate) : null,
                    startDate: bond.startDate ? new Date(bond.startDate) : null,
                    endDate: bond.endDate ? new Date(bond.endDate) : null,
                    monthlyAmount: bond.monthlyAmount,
                    coveredMonths: bond.coveredMonths,
                    totalAmount: bond.totalAmount,
                    renewalReminderDays: bond.renewalReminderDays || 30,
                    notes: bond.notes || null,
                    patient: { connect: { id: clientId } }
                  }
                });
                cnamBondRecords.push(cnamBondRecord);
              }
            }

            // Create enhanced payment records if payment periods are provided
            let paymentRecords = [];
            
            // Handle enhanced payment periods
            if (paymentPeriods && Array.isArray(paymentPeriods) && paymentPeriods.length > 0) {
              for (const period of paymentPeriods) {
                const paymentRecord = await tx.payment.create({
                  data: {
                    amount: period.amount,
                    method: period.paymentMethod || 'CASH',
                    status: period.cnamStatus === 'APPROUVE' ? 'PAID' : 'PENDING',
                    ...(clientType === 'patient' && clientId ? {
                      patient: { connect: { id: clientId } }
                    } : {}),
                    ...(clientType === 'societe' && clientId ? {
                      company: { connect: { id: clientId } }
                    } : {}),
                    notes: period.notes || null,
                    // Enhanced payment period data
                    metadata: {
                      periodId: period.id,
                      productIds: period.productIds,
                      startDate: period.startDate,
                      endDate: period.endDate,
                      cnamBondNumber: period.cnamBondNumber,
                      cnamBondType: period.cnamBondType,
                      cnamStatus: period.cnamStatus,
                      cnamApprovalDate: period.cnamApprovalDate,
                      cnamStartDate: period.cnamStartDate,
                      cnamEndDate: period.cnamEndDate,
                      isGapPeriod: period.isGapPeriod,
                      gapReason: period.gapReason,
                      isRental: true
                    }
                  }
                });
                paymentRecords.push(paymentRecord);
              }
            }
            
            // Handle deposit payment if provided
            let depositRecord = null;
            if (depositAmount && depositAmount > 0) {
              depositRecord = await tx.payment.create({
                data: {
                  amount: depositAmount,
                  method: depositMethod || 'CASH',
                  status: 'GUARANTEE', // Deposit is a guarantee payment
                  ...(clientType === 'patient' && clientId ? {
                    patient: { connect: { id: clientId } }
                  } : {}),
                  ...(clientType === 'societe' && clientId ? {
                    company: { connect: { id: clientId } }
                  } : {}),
                  notes: 'Dépôt de garantie pour location',
                  metadata: {
                    isDeposit: true,
                    isRental: true
                  }
                }
              });
            }
            
            // Create legacy payment record if provided (for backward compatibility)
            let legacyPaymentRecord = null;
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
              
              legacyPaymentRecord = await tx.payment.create({
                data: {
                  amount: payment.amount || totalPrice,
                  method: paymentMethod,
                  status: paymentStatus,
                  chequeNumber: payment.chequeNumber,
                  bankName: payment.bankName,
                  referenceNumber: payment.referenceNumber,
                  cnamCardNumber: payment.cnamCardNumber,
                  notes: payment.notes,
                  ...(clientType === 'patient' && clientId ? {
                    patient: { connect: { id: clientId } }
                  } : {}),
                  ...(clientType === 'societe' && clientId ? {
                    company: { connect: { id: clientId } }
                  } : {}),
                  // Add any other payment fields as needed
                }
              });
            }
            
            // Create enhanced rental records for each product
            const rentalRecords = [];
            
            for (const product of products) {
              // Find the specific product period if available
              const productPeriod = productPeriods?.find(p => p.productId === product.productId) || null;
              
              // Determine dates for this specific product
              const productStartDate = productPeriod?.startDate || rentalStartDate;
              const productEndDate = productPeriod?.endDate || rentalEndDate;
              
              // Create the enhanced rental record
              const rental = await tx.rental.create({
                data: {
                  medicalDeviceId: product.productId,
                  patientId: clientType === 'patient' ? clientId : null,
                  companyId: clientType === 'societe' ? clientId : null,
                  startDate: new Date(productStartDate),
                  endDate: productEndDate ? new Date(productEndDate) : null,
                  notes: notes || null,
                  paymentId: legacyPaymentRecord?.id || paymentRecords[0]?.id || null,
                  // Enhanced rental metadata
                  metadata: {
                    isGlobalOpenEnded,
                    urgentRental,
                    productPeriod: productPeriod || null,
                    identifiedGaps: identifiedGaps || [],
                    paymentGaps: paymentGaps || [],
                    cnamEligible,
                    isEnhancedRental: true,
                    totalPaymentAmount,
                    depositAmount,
                    depositMethod
                  }
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
            
            // Create rental periods for enhanced tracking
            let rentalPeriodRecords = [];
            if (paymentPeriods && Array.isArray(paymentPeriods) && paymentPeriods.length > 0 && rentalRecords.length > 0) {
              for (const period of paymentPeriods) {
                // Find corresponding payment and CNAM bond
                const correspondingPayment = paymentRecords.find(p => 
                  p.metadata && p.metadata.periodId === period.id
                );
                const correspondingCnamBond = cnamBondRecords.find(b => 
                  b.bondNumber === period.cnamBondNumber
                );
                
                const rentalPeriod = await tx.rentalPeriod.create({
                  data: {
                    rentalId: rentalRecords[0].id, // Link to first rental for now
                    startDate: new Date(period.startDate),
                    endDate: new Date(period.endDate),
                    amount: period.amount,
                    paymentMethod: period.paymentMethod || 'CASH',
                    isGapPeriod: period.isGapPeriod || false,
                    gapReason: period.gapReason || null,
                    notes: period.notes || null,
                    paymentId: correspondingPayment?.id || null,
                    cnamBondId: correspondingCnamBond?.id || null,
                  }
                });
                rentalPeriodRecords.push(rentalPeriod);
              }
            }

            // Update CNAM bonds with rental references
            for (const bond of cnamBondRecords) {
              if (rentalRecords.length > 0) {
                await tx.cnamBondRental.update({
                  where: { id: bond.id },
                  data: { rentalId: rentalRecords[0].id }
                });
              }
            }
            
            return {
              rentals: rentalRecords,
              paymentRecords: paymentRecords,
              depositRecord: depositRecord,
              legacyPayment: legacyPaymentRecord,
              cnamBondRecords: cnamBondRecords,
              rentalPeriodRecords: rentalPeriodRecords,
              enhancedData: {
                paymentPeriods,
                cnamBonds,
                identifiedGaps,
                paymentGaps,
                totalPaymentAmount,
                cnamEligible,
                isEnhancedRental: true
              }
            };
          });
          
          return res.status(201).json({
            success: true,
            message: 'Enhanced rental created successfully',
            data: result,
            summary: {
              totalRentals: result.rentals.length,
              totalPaymentPeriods: result.paymentRecords.length,
              totalCnamBonds: result.cnamBondRecords.length,
              totalRentalPeriods: result.rentalPeriodRecords.length,
              hasDeposit: !!result.depositRecord,
              totalAmount: totalPaymentAmount || totalPrice,
              cnamEligible: cnamEligible || false,
              urgentRental: urgentRental || false,
              isOpenEnded: isGlobalOpenEnded || false
            }
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
