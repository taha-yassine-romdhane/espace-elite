const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toISOString().split('T')[0];
}

async function analyzeCalendarData() {
  log('\n=== CALENDAR DATA ANALYSIS ===\n', 'bright');

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    // 1. Analyze Manual Tasks
    log('1. MANUAL TASKS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { startDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow } },
          { endDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow } }
        ]
      },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        diagnostic: { include: { patient: { select: { firstName: true, lastName: true } } } }
      },
      take: 10
    });

    log(`Total: ${tasks.length}`, 'yellow');
    tasks.forEach(task => {
      const isOverdue = task.endDate && new Date(task.endDate) < today;
      log(`  • ${task.title} [${task.status}] ${isOverdue ? '⚠️ OVERDUE' : ''}`, isOverdue ? 'red' : 'green');
      log(`    Start: ${formatDate(task.startDate)} | End: ${formatDate(task.endDate)}`);
      log(`    Assigned: ${task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : 'Unassigned'}`);
    });

    // 2. Analyze Pending Diagnostics
    log('\n2. PENDING DIAGNOSTICS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const pendingDiagnostics = await prisma.diagnostic.findMany({
      where: {
        status: 'PENDING',
        diagnosticDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow }
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        medicalDevice: { select: { name: true } },
        performedBy: { select: { firstName: true, lastName: true } }
      },
      take: 10
    });

    log(`Total: ${pendingDiagnostics.length}`, 'yellow');
    pendingDiagnostics.forEach(diag => {
      const daysSince = Math.ceil((today - new Date(diag.diagnosticDate)) / (1000 * 60 * 60 * 24));
      const isUrgent = daysSince > 7;
      log(`  • Patient: ${diag.patient?.firstName} ${diag.patient?.lastName} (${diag.patient?.patientCode})`, isUrgent ? 'red' : 'green');
      log(`    Device: ${diag.medicalDevice.name}`);
      log(`    Date: ${formatDate(diag.diagnosticDate)} (${daysSince} days ago) ${isUrgent ? '⚠️ URGENT' : ''}`);
      log(`    Performed by: ${diag.performedBy ? `${diag.performedBy.firstName} ${diag.performedBy.lastName}` : 'Unknown'}`);
    });

    // 3. Analyze Expiring Rentals
    log('\n3. EXPIRING RENTALS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const expiringRentals = await prisma.rental.findMany({
      where: {
        endDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow },
        status: 'ACTIVE'
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        medicalDevice: { select: { name: true, deviceCode: true } }
      },
      take: 10
    });

    log(`Total: ${expiringRentals.length}`, 'yellow');
    expiringRentals.forEach(rental => {
      const daysUntil = Math.ceil((new Date(rental.endDate) - today) / (1000 * 60 * 60 * 24));
      const isExpired = daysUntil <= 0;
      log(`  • ${rental.patient?.firstName} ${rental.patient?.lastName} - ${rental.medicalDevice.name}`, isExpired ? 'red' : 'green');
      log(`    Start: ${formatDate(rental.startDate)} | End: ${formatDate(rental.endDate)}`);
      log(`    ${isExpired ? '🔴 EXPIRED' : `${daysUntil} days remaining`}`);
    });

    // 4. Analyze Overdue Payments
    log('\n4. OVERDUE PAYMENTS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow }
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        company: { select: { companyName: true } }
      },
      take: 10
    });

    log(`Total: ${overduePayments.length}`, 'yellow');
    overduePayments.forEach(payment => {
      const daysOverdue = payment.dueDate ? Math.ceil((today - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
      const isOverdue = daysOverdue > 0;
      const clientName = payment.patient
        ? `${payment.patient.firstName} ${payment.patient.lastName} (${payment.patient.patientCode})`
        : payment.company?.companyName || 'Unknown';

      log(`  • ${clientName} - ${Number(payment.amount).toFixed(2)} TND`, isOverdue ? 'red' : 'green');
      log(`    Due: ${formatDate(payment.dueDate)} ${isOverdue ? `(${daysOverdue} days overdue) ⚠️` : ''}`);
      log(`    Method: ${payment.method} | Code: ${payment.paymentCode || 'N/A'}`);
    });

    // 5. Analyze Appointments
    log('\n5. UPCOMING APPOINTMENTS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const appointments = await prisma.appointment.findMany({
      where: {
        scheduledDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        company: { select: { companyName: true } },
        assignedTo: { select: { firstName: true, lastName: true } }
      },
      take: 10
    });

    log(`Total: ${appointments.length}`, 'yellow');
    appointments.forEach(apt => {
      const daysUntil = Math.ceil((new Date(apt.scheduledDate) - today) / (1000 * 60 * 60 * 24));
      const clientName = apt.patient
        ? `${apt.patient.firstName} ${apt.patient.lastName}`
        : apt.company?.companyName || 'Unknown';

      log(`  • ${clientName} - ${apt.appointmentType}`, daysUntil <= 0 ? 'red' : 'green');
      log(`    Date: ${formatDate(apt.scheduledDate)} (${daysUntil === 0 ? 'TODAY' : daysUntil > 0 ? `in ${daysUntil} days` : `${Math.abs(daysUntil)} days ago`})`);
      log(`    Location: ${apt.location} | Status: ${apt.status}`);
      log(`    Assigned: ${apt.assignedTo ? `${apt.assignedTo.firstName} ${apt.assignedTo.lastName}` : 'Unassigned'}`);
    });

    // 6. Analyze CNAM Bonds
    log('\n6. EXPIRING CNAM BONDS', 'cyan');
    log('─'.repeat(50), 'cyan');
    const cnamBonds = await prisma.cNAMBonRental.findMany({
      where: {
        endDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow },
        status: 'APPROUVE'
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        rental: { include: { medicalDevice: { select: { name: true } } } }
      },
      take: 10
    });

    log(`Total: ${cnamBonds.length}`, 'yellow');
    cnamBonds.forEach(bond => {
      const daysUntil = bond.endDate ? Math.ceil((new Date(bond.endDate) - today) / (1000 * 60 * 60 * 24)) : 0;
      log(`  • ${bond.patient.firstName} ${bond.patient.lastName} - ${bond.bonType}`, daysUntil <= 0 ? 'red' : 'green');
      log(`    Bon #: ${bond.bonNumber || 'N/A'} | Dossier: ${bond.dossierNumber || 'N/A'}`);
      log(`    End: ${formatDate(bond.endDate)} ${daysUntil <= 0 ? '🔴 EXPIRED' : `(${daysUntil} days remaining)`}`);
      log(`    Amount: ${Number(bond.bonAmount).toFixed(2)} TND`);
    });

    // 7. Analyze Rental Alerts (alertDate, titrationReminderDate, appointmentDate)
    log('\n7. RENTAL REMINDER DATES', 'cyan');
    log('─'.repeat(50), 'cyan');
    const rentalsWithReminders = await prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { alertDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow } },
          { titrationReminderDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow } },
          { appointmentDate: { gte: thirtyDaysAgo, lte: thirtyDaysFromNow } }
        ]
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        medicalDevice: { select: { name: true } }
      },
      take: 10
    });

    log(`Total: ${rentalsWithReminders.length}`, 'yellow');
    rentalsWithReminders.forEach(rental => {
      log(`  • ${rental.patient?.firstName} ${rental.patient?.lastName} - ${rental.medicalDevice.name}`, 'green');

      if (rental.alertDate) {
        const daysUntil = Math.ceil((new Date(rental.alertDate) - today) / (1000 * 60 * 60 * 24));
        log(`    📅 Alert Date: ${formatDate(rental.alertDate)} ${daysUntil <= 0 ? '⚠️ OVERDUE' : `(in ${daysUntil} days)`}`);
      }

      if (rental.titrationReminderDate) {
        const daysUntil = Math.ceil((new Date(rental.titrationReminderDate) - today) / (1000 * 60 * 60 * 24));
        log(`    💉 Titration: ${formatDate(rental.titrationReminderDate)} ${daysUntil <= 0 ? '⚠️ OVERDUE' : `(in ${daysUntil} days)`}`);
      }

      if (rental.appointmentDate) {
        const daysUntil = Math.ceil((new Date(rental.appointmentDate) - today) / (1000 * 60 * 60 * 1000));
        log(`    🏥 RDV: ${formatDate(rental.appointmentDate)} ${daysUntil <= 0 ? '⚠️ OVERDUE' : `(in ${daysUntil} days)`}`);
      }
    });

    // 8. Analyze Sales Rappels
    log('\n8. SALES RAPPELS (2 & 7 YEARS)', 'cyan');
    log('─'.repeat(50), 'cyan');
    const sales = await prisma.sale.findMany({
      where: {
        status: { not: 'CANCELLED' },
        saleDate: { lte: new Date(today.getTime() + 365 * 7 * 24 * 60 * 60 * 1000) } // Sales within 7 years
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientCode: true } },
        company: { select: { companyName: true } }
      },
      take: 20,
      orderBy: { saleDate: 'desc' }
    });

    let rappel2YearsCount = 0;
    let rappel7YearsCount = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.saleDate);
      const rappel2Years = new Date(saleDate);
      rappel2Years.setFullYear(saleDate.getFullYear() + 2);
      const rappel7Years = new Date(saleDate);
      rappel7Years.setFullYear(saleDate.getFullYear() + 7);

      const clientName = sale.patient
        ? `${sale.patient.firstName} ${sale.patient.lastName}`
        : sale.company?.companyName || 'Unknown';

      // Check if 2-year rappel is within range
      if (rappel2Years >= thirtyDaysAgo && rappel2Years <= thirtyDaysFromNow) {
        const daysUntil = Math.floor((rappel2Years - today) / (1000 * 60 * 60 * 24));
        rappel2YearsCount++;
        log(`  • 2-YEAR RAPPEL: ${clientName} - ${sale.saleCode || 'N/A'}`, daysUntil <= 0 ? 'red' : 'yellow');
        log(`    Sale Date: ${formatDate(sale.saleDate)} → Rappel: ${formatDate(rappel2Years)} ${daysUntil <= 0 ? `⚠️ ${Math.abs(daysUntil)} days overdue` : `(in ${daysUntil} days)`}`);
      }

      // Check if 7-year rappel is within range
      if (rappel7Years >= thirtyDaysAgo && rappel7Years <= thirtyDaysFromNow) {
        const daysUntil = Math.floor((rappel7Years - today) / (1000 * 60 * 60 * 24));
        rappel7YearsCount++;
        log(`  • 7-YEAR RAPPEL: ${clientName} - ${sale.saleCode || 'N/A'}`, daysUntil <= 0 ? 'red' : 'yellow');
        log(`    Sale Date: ${formatDate(sale.saleDate)} → Rappel: ${formatDate(rappel7Years)} ${daysUntil <= 0 ? `⚠️ ${Math.abs(daysUntil)} days overdue` : `(in ${daysUntil} days)`}`);
      }
    });

    log(`2-Year Rappels: ${rappel2YearsCount} | 7-Year Rappels: ${rappel7YearsCount}`, 'yellow');

    // 9. Summary Stats
    log('\n=== SUMMARY ===', 'bright');
    log('─'.repeat(50), 'cyan');
    log(`📋 Manual Tasks: ${tasks.length}`, 'blue');
    log(`🩺 Pending Diagnostics: ${pendingDiagnostics.length}`, 'blue');
    log(`🏠 Expiring Rentals: ${expiringRentals.length}`, 'blue');
    log(`💰 Overdue Payments: ${overduePayments.length}`, 'blue');
    log(`📅 Appointments: ${appointments.length}`, 'blue');
    log(`🏥 CNAM Bonds: ${cnamBonds.length}`, 'blue');
    log(`🔔 Rental Reminders: ${rentalsWithReminders.length}`, 'blue');
    log(`📊 Sales Rappels: ${rappel2YearsCount + rappel7YearsCount}`, 'blue');

    const totalEvents = tasks.length + pendingDiagnostics.length + expiringRentals.length +
                        overduePayments.length + appointments.length + cnamBonds.length +
                        rentalsWithReminders.length + rappel2YearsCount + rappel7YearsCount;

    log(`\n🎯 TOTAL EVENTS: ${totalEvents}`, 'green');
    log('\n✅ Analysis complete!', 'green');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeCalendarData();
