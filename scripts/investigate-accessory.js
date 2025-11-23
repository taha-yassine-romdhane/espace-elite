const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateAccessory() {
  try {
    console.log('\n========================================');
    console.log('🔍 INVESTIGATING ACCESSORY: ACC-003');
    console.log('========================================\n');

    // 1. Find the product
    const product = await prisma.product.findFirst({
      where: {
        productCode: 'ACC-003'
      },
      include: {
        stocks: {
          include: {
            location: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      console.log('❌ Product ACC-003 NOT FOUND in database');
      return;
    }

    console.log('✅ PRODUCT FOUND:');
    console.log('─────────────────────────────────────────');
    console.log(`ID: ${product.id}`);
    console.log(`Name: ${product.name}`);
    console.log(`Brand: ${product.brand}`);
    console.log(`Model: ${product.model}`);
    console.log(`Type: ${product.type}`);
    console.log(`Product Code: ${product.productCode}`);
    console.log(`Selling Price: ${product.sellingPrice} DT`);
    console.log(`Purchase Price: ${product.purchasePrice || 'N/A'}`);
    console.log(`Status: ${product.status || 'N/A'}`);
    console.log(`Created At: ${product.createdAt}`);
    console.log(`Updated At: ${product.updatedAt}`);

    // 2. Stock Information
    console.log('\n📦 STOCK INFORMATION:');
    console.log('─────────────────────────────────────────');

    if (product.stocks && product.stocks.length > 0) {
      console.log(`Total Stock Entries: ${product.stocks.length}\n`);

      let totalQuantity = 0;
      product.stocks.forEach((stock, index) => {
        console.log(`Stock Entry #${index + 1}:`);
        console.log(`  Stock ID: ${stock.id}`);
        console.log(`  Location ID: ${stock.locationId}`);
        console.log(`  Location Name: ${stock.location?.name || 'Unknown'}`);
        console.log(`  Quantity: ${stock.quantity}`);
        console.log(`  Status: ${stock.status || 'N/A'}`);
        console.log(`  Min Stock Level: ${stock.minStockLevel || 'N/A'}`);
        console.log(`  Max Stock Level: ${stock.maxStockLevel || 'N/A'}`);
        console.log(`  Reserved Quantity: ${stock.reservedQuantity || 0}`);

        if (stock.location?.user) {
          console.log(`  Assigned User: ${stock.location.user.name} (${stock.location.user.email})`);
          console.log(`  User Role: ${stock.location.user.role}`);
        } else {
          console.log(`  Assigned User: None`);
        }

        console.log(`  Created At: ${stock.createdAt}`);
        console.log(`  Updated At: ${stock.updatedAt}`);
        console.log('');

        totalQuantity += stock.quantity;
      });

      console.log(`📊 TOTAL QUANTITY ACROSS ALL LOCATIONS: ${totalQuantity}\n`);
    } else {
      console.log('⚠️  NO STOCK ENTRIES FOUND for this product!\n');
    }

    // 3. Sales History
    console.log('\n💰 SALES HISTORY:');
    console.log('─────────────────────────────────────────');

    const saleItems = await prisma.saleItem.findMany({
      where: {
        productId: product.id
      },
      include: {
        sale: {
          include: {
            patient: true,
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (saleItems.length > 0) {
      console.log(`Total Sales: ${saleItems.length}\n`);

      let totalSold = 0;
      saleItems.forEach((item, index) => {
        console.log(`Sale #${index + 1}:`);
        console.log(`  Sale ID: ${item.saleId}`);
        console.log(`  Sale Code: ${item.sale?.saleCode || 'N/A'}`);
        console.log(`  Quantity Sold: ${item.quantity}`);
        console.log(`  Unit Price: ${item.unitPrice} DT`);
        console.log(`  Discount: ${item.discount || 0} DT`);
        console.log(`  Total: ${item.total} DT`);
        console.log(`  Customer: ${item.sale?.patient ? `${item.sale.patient.firstName} ${item.sale.patient.lastName}` : item.sale?.company?.name || 'N/A'}`);
        console.log(`  Sale Date: ${item.createdAt}`);
        console.log('');

        totalSold += item.quantity;
      });

      console.log(`📊 TOTAL QUANTITY SOLD: ${totalSold}\n`);
    } else {
      console.log('No sales found for this product.\n');
    }

    // 4. Stock Movements
    console.log('\n📋 STOCK MOVEMENTS:');
    console.log('─────────────────────────────────────────');

    const movements = await prisma.stockMovement.findMany({
      where: {
        productId: product.id
      },
      include: {
        location: true,
        createdBy: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (movements.length > 0) {
      console.log(`Recent Movements (last 10): ${movements.length}\n`);

      movements.forEach((movement, index) => {
        console.log(`Movement #${index + 1}:`);
        console.log(`  Type: ${movement.type}`);
        console.log(`  Quantity: ${movement.quantityChanged}`);
        console.log(`  Location: ${movement.location?.name || 'N/A'}`);
        console.log(`  Notes: ${movement.notes || 'N/A'}`);
        console.log(`  Reference: ${movement.referenceType || 'N/A'} - ${movement.referenceId || 'N/A'}`);
        console.log(`  Created By: ${movement.createdBy?.name || 'N/A'}`);
        console.log(`  Date: ${movement.createdAt}`);
        console.log('');
      });
    } else {
      console.log('No stock movements found for this product.\n');
    }

    // 5. All Stock Locations (for reference)
    console.log('\n🏢 ALL STOCK LOCATIONS IN SYSTEM:');
    console.log('─────────────────────────────────────────');

    const allLocations = await prisma.stockLocation.findMany({
      include: {
        user: true
      }
    });

    allLocations.forEach((loc, index) => {
      console.log(`Location #${index + 1}:`);
      console.log(`  ID: ${loc.id}`);
      console.log(`  Name: ${loc.name}`);
      console.log(`  Type: ${loc.type}`);
      console.log(`  User: ${loc.user ? `${loc.user.name} (${loc.user.role})` : 'None'}`);
      console.log('');
    });

    console.log('\n========================================');
    console.log('✅ INVESTIGATION COMPLETE');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error investigating accessory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateAccessory();
