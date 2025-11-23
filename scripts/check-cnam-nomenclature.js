const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const nomenclature = await prisma.cNAMNomenclature.findMany({
      orderBy: {
        bonType: 'asc',
      },
    });

    console.log('=== CNAM Nomenclature Data ===\n');

    const locationBons = nomenclature.filter(n => n.category === 'LOCATION');
    const achatBons = nomenclature.filter(n => n.category === 'ACHAT');

    console.log('📍 LOCATION (Rental) Bons:');
    console.log('─'.repeat(80));
    locationBons.forEach(bon => {
      console.log(`  Type: ${bon.bonType.padEnd(25)} | Monthly Rate: ${bon.monthlyRate} DT | Amount: ${bon.amount} DT`);
      if (bon.description) console.log(`    → ${bon.description}`);
    });

    console.log('\n💰 ACHAT (Purchase/Sale) Bons:');
    console.log('─'.repeat(80));
    achatBons.forEach(bon => {
      console.log(`  Type: ${bon.bonType.padEnd(25)} | Total Amount: ${bon.amount} DT | Monthly Rate: ${bon.monthlyRate} DT`);
      if (bon.description) console.log(`    → ${bon.description}`);
    });

    console.log('\n=== Summary ===');
    console.log(`Total LOCATION bons: ${locationBons.length}`);
    console.log(`Total ACHAT bons: ${achatBons.length}`);
    console.log(`Total bons: ${nomenclature.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
