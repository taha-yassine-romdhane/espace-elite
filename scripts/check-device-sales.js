const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeviceSales() {
  const deviceId = 'cmhp0yf6f000pximo0ycv3mm6';

  try {
    // Get the device
    const device = await prisma.medicalDevice.findUnique({
      where: { id: deviceId },
      include: {
        saleItems: {
          include: {
            sale: {
              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    patientCode: true
                  }
                },
                company: {
                  select: {
                    id: true,
                    companyName: true,
                    companyCode: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!device) {
      console.log('❌ Device not found!');
      return;
    }

    console.log('\n========== DEVICE INFORMATION ==========');
    console.log('Device ID:', device.id);
    console.log('Device Code:', device.deviceCode);
    console.log('Device Name:', device.name);
    console.log('Device Type:', device.type);
    console.log('Device Status:', device.status);
    console.log('Device Destination:', device.destination);
    console.log('Stock Location ID:', device.stockLocationId);

    console.log('\n========== SALES INFORMATION ==========');
    if (device.saleItems && device.saleItems.length > 0) {
      console.log(`✅ Device IS SOLD - Found ${device.saleItems.length} sale item(s):`);

      device.saleItems.forEach((saleItem, index) => {
        console.log(`\n--- Sale Item #${index + 1} ---`);
        console.log('Sale Item ID:', saleItem.id);
        console.log('Sale ID:', saleItem.saleId);
        console.log('Sale Code:', saleItem.sale.saleCode);
        console.log('Sale Date:', saleItem.sale.saleDate);
        console.log('Sale Status:', saleItem.sale.status);
        console.log('Quantity:', saleItem.quantity);
        console.log('Unit Price:', saleItem.unitPrice.toString());
        console.log('Item Total:', saleItem.itemTotal.toString());
        console.log('Serial Number:', saleItem.serialNumber || 'N/A');

        if (saleItem.sale.patient) {
          console.log('Patient:', `${saleItem.sale.patient.firstName} ${saleItem.sale.patient.lastName} (${saleItem.sale.patient.patientCode})`);
        }

        if (saleItem.sale.company) {
          console.log('Company:', saleItem.sale.company.companyName, `(${saleItem.sale.company.companyCode})`);
        }
      });

      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('The device status is "' + device.status + '" but it IS linked to sale(s)!');
      console.log('The device detail page should show this sale information.');
    } else {
      console.log('❌ Device is NOT sold - No sale items found.');
      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('The device status is "' + device.status + '" but it is NOT linked to any sale!');
      console.log('This is a data inconsistency - the status should not be SOLD.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeviceSales();
