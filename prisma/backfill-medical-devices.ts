import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * This script backfills the patientId and companyId fields on MedicalDevice records
 * by finding their associations in Rental and Sale records.
 * 
 * It will:
 * 1. Find all medical devices without a patient or company association
 * 2. For each device, look for rental or sale records that include the device
 * 3. Update the device with the patient/company from the most recent rental/sale
 */
async function backfillMedicalDevices() {
  try {
    console.log('Starting medical device backfill process...');
    
    // Get all medical devices without patient or company associations
    const unassociatedDevices = await prisma.medicalDevice.findMany({
      where: {
        patientId: null,
        companyId: null
      },
      select: {
        id: true,
        name: true,
        serialNumber: true
      }
    });
    
    console.log(`Found ${unassociatedDevices.length} unassociated medical devices`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each device
    for (const device of unassociatedDevices) {
      console.log(`Processing device: ${device.name} (${device.serialNumber || device.id})`);
      
      // Try to find the most recent rental for this device
      const rental = await prisma.rental.findFirst({
        where: {
          medicalDeviceId: device.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          patientId: true,
          companyId: true
        }
      });
      
      // If no rental found, try to find a sale
      if (!rental) {
        const saleItem = await prisma.saleItem.findFirst({
          where: {
            medicalDeviceId: device.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sale: {
              select: {
                patientId: true,
                companyId: true
              }
            }
          }
        });
        
        if (saleItem && saleItem.sale) {
          // Update the device with the patient/company from the sale
          await prisma.medicalDevice.update({
            where: {
              id: device.id
            },
            data: {
              patientId: saleItem.sale.patientId,
              companyId: saleItem.sale.companyId
            }
          });
          
          console.log(`Updated device ${device.name} based on sale record`);
          updatedCount++;
          continue;
        }
      } else {
        // Update the device with the patient/company from the rental
        await prisma.medicalDevice.update({
          where: {
            id: device.id
          },
          data: {
            patientId: rental.patientId,
            companyId: rental.companyId
          }
        });
        
        console.log(`Updated device ${device.name} based on rental record`);
        updatedCount++;
        continue;
      }
      
      // If we get here, no rental or sale was found
      console.log(`No rental or sale found for device ${device.name}`);
      skippedCount++;
    }
    
    console.log(`Backfill complete. Updated ${updatedCount} devices. Skipped ${skippedCount} devices.`);
  } catch (error) {
    console.error('Error backfilling medical devices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillMedicalDevices()
  .then(() => console.log('Backfill script execution complete'))
  .catch(error => console.error('Backfill failed:', error));
