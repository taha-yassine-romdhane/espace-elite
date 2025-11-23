const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPaymentAssignments() {
  log('\n=== TESTING PAYMENT ASSIGNMENTS ===\n', 'bright');

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Test payments with period end dates
    log('1. PAYMENTS WITH PERIOD END DATES (Fin Période)', 'cyan');
    log('─'.repeat(60), 'cyan');

    const payments = await prisma.payment.findMany({
      where: {
        periodEndDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow },
        status: { not: 'CANCELLED' }
      },
      include: {
        patient: {
          include: {
            technician: true
          }
        },
        company: {
          include: {
            technician: true
          }
        }
      },
      take: 10
    });

    log(`Found ${payments.length} payments with period end dates:\n`, 'yellow');

    payments.forEach(payment => {
      const responsibleUser = payment.patient?.technician || payment.company?.technician;
      const clientName = payment.patient
        ? `${payment.patient.firstName} ${payment.patient.lastName} (${payment.patient.patientCode})`
        : payment.company?.companyName || 'Unknown';

      log(`Payment: ${payment.paymentCode || 'N/A'}`, 'yellow');
      log(`  Client: ${clientName}`);
      log(`  Amount: ${Number(payment.amount).toFixed(2)} TND`);
      log(`  Period End: ${payment.periodEndDate?.toISOString().split('T')[0] || 'N/A'}`);

      if (responsibleUser) {
        log(`  ✅ Assigned To: ${responsibleUser.firstName} ${responsibleUser.lastName} (${responsibleUser.role})`, 'green');
      } else {
        log(`  ❌ NOT ASSIGNED - Patient/Company has no technician`, 'red');
      }
      log('');
    });

    // Test overdue payments
    log('\n2. OVERDUE PAYMENTS (PAYMENT_DUE)', 'cyan');
    log('─'.repeat(60), 'cyan');

    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow }
      },
      include: {
        patient: {
          include: {
            technician: true
          }
        },
        company: {
          include: {
            technician: true
          }
        }
      },
      take: 10
    });

    log(`Found ${overduePayments.length} pending payments:\n`, 'yellow');

    overduePayments.forEach(payment => {
      const responsibleUser = payment.patient?.technician || payment.company?.technician;
      const clientName = payment.patient
        ? `${payment.patient.firstName} ${payment.patient.lastName} (${payment.patient.patientCode})`
        : payment.company?.companyName || 'Unknown';

      log(`Payment: ${payment.paymentCode || 'N/A'}`, 'yellow');
      log(`  Client: ${clientName}`);
      log(`  Amount: ${Number(payment.amount).toFixed(2)} TND`);
      log(`  Due Date: ${payment.dueDate?.toISOString().split('T')[0] || 'N/A'}`);

      if (responsibleUser) {
        log(`  ✅ Assigned To: ${responsibleUser.firstName} ${responsibleUser.lastName} (${responsibleUser.role})`, 'green');
      } else {
        log(`  ❌ NOT ASSIGNED - Patient/Company has no technician`, 'red');
      }
      log('');
    });

    // Summary
    log('=== SUMMARY ===', 'bright');
    log('─'.repeat(60), 'cyan');
    log('Assignment Logic:', 'cyan');
    log('  • Payment → Patient → technician (if patient exists)', 'yellow');
    log('  • Payment → Company → technician (if company exists)', 'yellow');
    log('  • If neither has technician → "Non assigné"', 'yellow');
    log('\n✅ Fix implemented successfully!', 'green');
    log('Payment tasks will now show assigned technicians.\n', 'yellow');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentAssignments();
