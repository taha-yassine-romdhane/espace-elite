import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSoldItems() {
  console.log('🚀 Starting migration: Update sold items and vendu location...\n');

  try {
    // Step 1: Find and update "vendu" location
    console.log('📍 Step 1: Finding "vendu" location...');
    const venduLocation = await prisma.stockLocation.findFirst({
      where: {
        name: {
          contains: 'vendu',
          mode: 'insensitive'
        }
      }
    });

    if (venduLocation) {
      console.log(`✅ Found "vendu" location: ${venduLocation.name} (ID: ${venduLocation.id})`);

      // Update to VIRTUAL and non-transferable
      await prisma.stockLocation.update({
        where: { id: venduLocation.id },
        data: {
          type: 'VIRTUAL',
          isTransferable: false,
          description: 'Location virtuelle pour les articles vendus (legacy)'
        }
      });
      console.log('✅ Updated "vendu" location to VIRTUAL and isTransferable=false\n');

      // Step 2: Find all stock items in vendu location
      console.log('📦 Step 2: Finding stock items in "vendu" location...');
      const stocksInVendu = await prisma.stock.findMany({
        where: { locationId: venduLocation.id },
        include: {
          product: {
            select: { name: true, type: true }
          },
          location: {
            select: { name: true }
          }
        }
      });

      console.log(`✅ Found ${stocksInVendu.length} stock items in "vendu" location\n`);

      // Step 3: Update status to SOLD for all items in vendu
      if (stocksInVendu.length > 0) {
        console.log('🔄 Step 3: Updating stock items status to SOLD...');

        let updatedCount = 0;
        for (const stock of stocksInVendu) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: { status: 'SOLD' }
          });
          updatedCount++;
          console.log(`  ✓ Updated: ${stock.product.name} (Qty: ${stock.quantity}) → Status: SOLD`);
        }

        console.log(`\n✅ Updated ${updatedCount} items to SOLD status\n`);
      } else {
        console.log('ℹ️  No items found in "vendu" location to update\n');
      }

      // Step 4: Generate summary
      console.log('📊 Migration Summary:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ "vendu" location marked as VIRTUAL`);
      console.log(`✅ Transfer requests blocked for "vendu"`);
      console.log(`✅ ${stocksInVendu.length} items marked as SOLD`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Step 5: Verify all stock locations have correct defaults
      console.log('🔍 Step 5: Verifying all other locations...');
      const allLocations = await prisma.stockLocation.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          isTransferable: true
        }
      });

      console.log('\n📋 All Stock Locations:');
      allLocations.forEach(loc => {
        const icon = loc.type === 'VIRTUAL' ? '🔒' : '📍';
        const transferable = loc.isTransferable ? '✓ Transferable' : '✗ Not Transferable';
        console.log(`  ${icon} ${loc.name} - ${loc.type} - ${transferable}`);
      });

    } else {
      console.log('⚠️  Warning: No "vendu" location found in database');
      console.log('ℹ️  If you have sold items, they may be tracked differently\n');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateSoldItems()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
