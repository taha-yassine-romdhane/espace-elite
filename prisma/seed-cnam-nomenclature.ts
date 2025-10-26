import { PrismaClient, CNAMBondType, CNAMBondCategory } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * CNAM Nomenclature Seed Script
 *
 * This script populates the CNAMNomenclature table with fixed CNAM rates
 * based on the official CNAM (Tunisia) pricing structure for medical device rentals and purchases.
 *
 * Official CNAM Tunisia Pricing (2024-2025):
 *
 * BON DE LOCATION (Monthly Rental):
 * - CONCENTRATEUR_OXYGENE: 190 TND/month
 * - VNI (Ventilation Non Invasive): 570 TND/month
 *
 * BON D'ACHAT (One-time Purchase):
 * - CPAP: 1,475 TND (one-time)
 * - MASQUE: 200 TND (one-time)
 *
 * - AUTRE: Variable (case by case)
 */

const cnamNomenclature = [
  // BON DE LOCATION (Monthly Rentals)
  {
    bondType: CNAMBondType.CONCENTRATEUR_OXYGENE,
    category: CNAMBondCategory.LOCATION,
    amount: 190.00,
    monthlyRate: 190.00,
    description: 'Concentrateur d\'Oxygène - Bon de Location CNAM (mensuel)',
    isActive: true,
  },
  {
    bondType: CNAMBondType.VNI,
    category: CNAMBondCategory.LOCATION,
    amount: 570.00,
    monthlyRate: 570.00,
    description: 'Ventilation Non Invasive (VNI) - Bon de Location CNAM (mensuel)',
    isActive: true,
  },

  // BON D'ACHAT (One-time Purchases)
  {
    bondType: CNAMBondType.CPAP,
    category: CNAMBondCategory.ACHAT,
    amount: 1475.00,
    monthlyRate: 0.00, // Not applicable for purchase
    description: 'CPAP - Bon d\'Achat CNAM (paiement unique)',
    isActive: true,
  },
  {
    bondType: CNAMBondType.MASQUE,
    category: CNAMBondCategory.ACHAT,
    amount: 200.00,
    monthlyRate: 0.00, // Not applicable for purchase
    description: 'Masque - Bon d\'Achat CNAM (paiement unique)',
    isActive: true,
  },

  // AUTRE (Variable)
  {
    bondType: CNAMBondType.AUTRE,
    category: CNAMBondCategory.LOCATION,
    amount: 0.00,
    monthlyRate: 0.00,
    description: 'Autre - Tarif variable selon le type d\'équipement (à définir)',
    isActive: true,
  },
];

async function seedCNAMNomenclature() {
  console.log('🏥 Seeding CNAM Nomenclature...');

  for (const item of cnamNomenclature) {
    const result = await prisma.cNAMNomenclature.upsert({
      where: { bondType: item.bondType },
      update: {
        category: item.category,
        amount: item.amount,
        monthlyRate: item.monthlyRate,
        description: item.description,
        isActive: item.isActive,
      },
      create: item,
    });

    const rateDisplay = item.category === 'LOCATION'
      ? `${item.amount} TND/month`
      : `${item.amount} TND (achat)`;

    console.log(`✅ ${item.bondType} (${item.category}): ${rateDisplay}`);
  }

  console.log('✨ CNAM Nomenclature seeded successfully!');
}

async function main() {
  try {
    await seedCNAMNomenclature();
  } catch (error) {
    console.error('❌ Error seeding CNAM nomenclature:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
