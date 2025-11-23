const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setAllPatientsActive() {
  try {
    console.log('🔍 Checking current patient status...');

    const totalPatients = await prisma.patient.count();
    const activePatients = await prisma.patient.count({ where: { isActive: true } });
    const inactivePatients = await prisma.patient.count({ where: { isActive: false } });

    console.log(`📊 Current Status:`);
    console.log(`   Total Patients: ${totalPatients}`);
    console.log(`   Active (true): ${activePatients}`);
    console.log(`   Inactive (false): ${inactivePatients}`);
    console.log('');

    // Update all patients to isActive = true
    console.log('🔄 Setting all patients to active...');

    const result = await prisma.patient.updateMany({
      data: {
        isActive: true
      }
    });

    console.log(`✅ Updated ${result.count} patients to active status`);
    console.log('');

    // Verify the update
    const newActiveCount = await prisma.patient.count({ where: { isActive: true } });
    console.log(`✅ Verification: ${newActiveCount} patients are now active`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAllPatientsActive();
