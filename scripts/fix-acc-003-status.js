const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAccessoryStatus() {
  try {
    console.log('\n========================================');
    console.log('🔧 FIXING ACCESSORY ACC-003 STATUS');
    console.log('========================================\n');

    // 1. Find the product and its stock
    const product = await prisma.product.findFirst({
      where: {
        productCode: 'ACC-003'
      },
      include: {
        stocks: true
      }
    });

    if (!product) {
      console.log('❌ Product ACC-003 NOT FOUND');
      return;
    }

    console.log(`✅ Found product: ${product.name}`);
    console.log(`   Product ID: ${product.id}\n`);

    if (!product.stocks || product.stocks.length === 0) {
      console.log('❌ No stock entries found for this product');
      return;
    }

    // 2. Fix each stock entry
    console.log('📦 Fixing stock entries:\n');

    for (const stock of product.stocks) {
      console.log(`Stock ID: ${stock.id}`);
      console.log(`  Current Status: ${stock.status}`);
      console.log(`  Current Quantity: ${stock.quantity}`);

      if (stock.status === 'SOLD') {
        // Update status based on quantity
        const newStatus = stock.quantity > 0 ? 'FOR_SALE' : 'OUT_OF_STOCK';

        const updated = await prisma.stock.update({
          where: { id: stock.id },
          data: {
            status: newStatus
          }
        });

        console.log(`  ✅ Updated Status: ${stock.status} → ${newStatus}`);
      } else {
        console.log(`  ℹ️  Status is OK (${stock.status})`);
      }

      console.log('');
    }

    console.log('\n========================================');
    console.log('✅ FIX COMPLETE');
    console.log('========================================');
    console.log('\n💡 The accessory should now be visible in the employee inventory!\n');

  } catch (error) {
    console.error('❌ Error fixing accessory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccessoryStatus();
