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
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function analyzeAllEventTypes() {
  log('\n╔═══════════════════════════════════════════════════════════════════╗', 'bright');
  log('║         COMPREHENSIVE CALENDAR EVENT TYPES ANALYSIS              ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════╝\n', 'bright');

  try {
    const eventTypes = [];

    // 1. TASK - Manual Tasks
    log('📋 TYPE 1: TASK (Manual Tasks)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const tasks = await prisma.task.findMany({ take: 3 });
    log(`Source: Task table`, 'yellow');
    log(`Count: ${tasks.length} (showing first 3)`, 'yellow');
    log(`Purpose: User-created manual tasks/reminders`, 'yellow');
    log(`Completion: ✅ CAN mark as completed (updates Task.status to COMPLETED)`, 'green');
    log(`Recommended Action: "Marquer comme terminé" button`, 'green');
    log(`Database Change: Task.status → COMPLETED, Task.completedAt → NOW\n`, 'yellow');

    eventTypes.push({
      type: 'TASK',
      source: 'Task table',
      canComplete: true,
      action: 'Mark as completed',
      dbChange: 'Updates Task.status to COMPLETED'
    });

    // 2. DIAGNOSTIC_PENDING
    log('🩺 TYPE 2: DIAGNOSTIC_PENDING (Pending Diagnostics)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const diagnostics = await prisma.diagnostic.findMany({
      where: { status: 'PENDING' },
      take: 3
    });
    log(`Source: Diagnostic table (status = PENDING)`, 'yellow');
    log(`Count: ${diagnostics.length}`, 'yellow');
    log(`Purpose: Diagnostics awaiting results entry`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires data entry`, 'red');
    log(`Recommended Action: Redirect to diagnostic results page`, 'cyan');
    log(`What to do: Employee must enter diagnostic results, then status → COMPLETED\n`, 'yellow');

    eventTypes.push({
      type: 'DIAGNOSTIC_PENDING',
      source: 'Diagnostic table (PENDING)',
      canComplete: false,
      action: 'Redirect to results page',
      dbChange: 'User must enter results manually'
    });

    // 3. RENTAL_EXPIRING
    log('📦 TYPE 3: RENTAL_EXPIRING (Expiring Rentals)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const expiringRentals = await prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { gte: new Date() }
      },
      take: 3
    });
    log(`Source: Rental table (ACTIVE, endDate within 30 days)`, 'yellow');
    log(`Count: ${expiringRentals.length}`, 'yellow');
    log(`Purpose: Alert for rentals ending soon`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires action`, 'red');
    log(`Recommended Action: Redirect to rental page`, 'cyan');
    log(`What to do: Extend rental, end rental, or contact patient\n`, 'yellow');

    eventTypes.push({
      type: 'RENTAL_EXPIRING',
      source: 'Rental table (ACTIVE, expiring)',
      canComplete: false,
      action: 'Redirect to rental page',
      dbChange: 'User must extend/end rental'
    });

    // 4. PAYMENT_DUE
    log('💳 TYPE 4: PAYMENT_DUE (Overdue Payments)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() }
      },
      take: 3
    });
    log(`Source: Payment table (status = PENDING, dueDate < NOW)`, 'yellow');
    log(`Count: ${overduePayments.length}`, 'yellow');
    log(`Purpose: Alert for overdue payments`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires payment`, 'red');
    log(`Recommended Action: Redirect to patient page to process payment`, 'cyan');
    log(`What to do: Process payment, update Payment.status to PAID\n`, 'yellow');

    eventTypes.push({
      type: 'PAYMENT_DUE',
      source: 'Payment table (PENDING, overdue)',
      canComplete: false,
      action: 'Redirect to patient page',
      dbChange: 'User must process payment'
    });

    // 5. APPOINTMENT_REMINDER
    log('📅 TYPE 5: APPOINTMENT_REMINDER (Upcoming Appointments)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      },
      take: 3
    });
    log(`Source: Appointment table (SCHEDULED or CONFIRMED, within 7 days)`, 'yellow');
    log(`Count: ${appointments.length}`, 'yellow');
    log(`Purpose: Reminder for upcoming appointments`, 'yellow');
    log(`Completion: ✅ CAN mark as completed`, 'green');
    log(`Recommended Action: "Marquer comme terminé" button`, 'green');
    log(`Database Change: Appointment.status → COMPLETED\n`, 'yellow');

    eventTypes.push({
      type: 'APPOINTMENT_REMINDER',
      source: 'Appointment table (SCHEDULED/CONFIRMED)',
      canComplete: true,
      action: 'Mark as completed',
      dbChange: 'Updates Appointment.status to COMPLETED'
    });

    // 6. CNAM_RENEWAL
    log('🏥 TYPE 6: CNAM_RENEWAL (CNAM Bond Renewals)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const cnamBonds = await prisma.cNAMBonRental.findMany({
      take: 3
    });
    log(`Source: CNAMBonRental table`, 'yellow');
    log(`Count: ${cnamBonds.length}`, 'yellow');
    log(`Purpose: Alert for expiring CNAM bonds`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires renewal`, 'red');
    log(`Recommended Action: Redirect to patient page to renew bond`, 'cyan');
    log(`What to do: Create new CNAM bond, update bond number and dates\n`, 'yellow');

    eventTypes.push({
      type: 'CNAM_RENEWAL',
      source: 'CNAMBond table (expiring)',
      canComplete: false,
      action: 'Redirect to patient page',
      dbChange: 'User must create new bond'
    });

    // 7. SALE_RAPPEL_2YEARS
    log('🔔 TYPE 7: SALE_RAPPEL_2YEARS (2-Year Sale Reminders)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const sales2Years = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - (2 * 365 + 30) * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)
        }
      },
      take: 3
    });
    log(`Source: Sale table (createdAt ~2 years ago)`, 'yellow');
    log(`Count: ${sales2Years.length}`, 'yellow');
    log(`Purpose: Remind to contact patient 2 years after sale (warranty/check-up)`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - informational only`, 'red');
    log(`Recommended Action: Dismiss/Acknowledge + Redirect to patient`, 'cyan');
    log(`What to do: Contact patient, schedule appointment, or dismiss reminder\n`, 'yellow');

    eventTypes.push({
      type: 'SALE_RAPPEL_2YEARS',
      source: 'Sale table (2 years old)',
      canComplete: false,
      action: 'Dismiss or redirect',
      dbChange: 'Could add dismissedAt field to Sale'
    });

    // 8. SALE_RAPPEL_7YEARS
    log('🔔 TYPE 8: SALE_RAPPEL_7YEARS (7-Year Sale Reminders)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const sales7Years = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - (7 * 365 + 30) * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000)
        }
      },
      take: 3
    });
    log(`Source: Sale table (createdAt ~7 years ago)`, 'yellow');
    log(`Count: ${sales7Years.length}`, 'yellow');
    log(`Purpose: Remind to contact patient 7 years after sale (replacement)`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - informational only`, 'red');
    log(`Recommended Action: Dismiss/Acknowledge + Redirect to patient`, 'cyan');
    log(`What to do: Contact patient about replacement, or dismiss reminder\n`, 'yellow');

    eventTypes.push({
      type: 'SALE_RAPPEL_7YEARS',
      source: 'Sale table (7 years old)',
      canComplete: false,
      action: 'Dismiss or redirect',
      dbChange: 'Could add dismissedAt field to Sale'
    });

    // 9. RENTAL_ALERT
    log('⚠️  TYPE 9: RENTAL_ALERT (Rental Alert Dates)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const rentalAlerts = await prisma.rental.findMany({
      where: {
        alertDate: { lte: new Date() }
      },
      take: 3
    });
    log(`Source: Rental table (alertDate reached)`, 'yellow');
    log(`Count: ${rentalAlerts.length}`, 'yellow');
    log(`Purpose: Custom alert date set for rental`, 'yellow');
    log(`Completion: 🤔 MAYBE - depends on alert purpose`, 'yellow');
    log(`Recommended Action: Dismiss/Acknowledge + Redirect to rental`, 'cyan');
    log(`What to do: Check rental, contact patient, or dismiss alert\n`, 'yellow');

    eventTypes.push({
      type: 'RENTAL_ALERT',
      source: 'Rental table (alertDate)',
      canComplete: 'maybe',
      action: 'Dismiss or redirect',
      dbChange: 'Could clear alertDate or add alertDismissedAt'
    });

    // 10. RENTAL_TITRATION
    log('💊 TYPE 10: RENTAL_TITRATION (Titration Reminders)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const rentalTitrations = await prisma.rental.findMany({
      where: {
        titrationReminderDate: { lte: new Date() }
      },
      take: 3
    });
    log(`Source: Rental table (titrationReminderDate reached)`, 'yellow');
    log(`Count: ${rentalTitrations.length}`, 'yellow');
    log(`Purpose: Reminder for titration procedure`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires action`, 'red');
    log(`Recommended Action: Redirect to rental page`, 'cyan');
    log(`What to do: Schedule titration, update rental parameters\n`, 'yellow');

    eventTypes.push({
      type: 'RENTAL_TITRATION',
      source: 'Rental table (titrationReminderDate)',
      canComplete: false,
      action: 'Redirect to rental page',
      dbChange: 'User must perform titration'
    });

    // 11. RENTAL_APPOINTMENT
    log('🗓️  TYPE 11: RENTAL_APPOINTMENT (Rental Appointment Dates)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const rentalAppointments = await prisma.rental.findMany({
      where: {
        appointmentDate: { lte: new Date() }
      },
      take: 3
    });
    log(`Source: Rental table (appointmentDate reached)`, 'yellow');
    log(`Count: ${rentalAppointments.length}`, 'yellow');
    log(`Purpose: Scheduled appointment for rental follow-up`, 'yellow');
    log(`Completion: 🤔 MAYBE - could mark appointment as done`, 'yellow');
    log(`Recommended Action: Mark as done OR Redirect to rental`, 'cyan');
    log(`What to do: Complete appointment, update notes, clear appointmentDate\n`, 'yellow');

    eventTypes.push({
      type: 'RENTAL_APPOINTMENT',
      source: 'Rental table (appointmentDate)',
      canComplete: 'maybe',
      action: 'Mark done or redirect',
      dbChange: 'Could clear appointmentDate or add appointmentCompletedAt'
    });

    // 12. PAYMENT_PERIOD_END
    log('📊 TYPE 12: PAYMENT_PERIOD_END (Payment Period Endings)', 'cyan');
    log('─'.repeat(70), 'cyan');
    const periodEndPayments = await prisma.payment.findMany({
      where: {
        periodEndDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      },
      take: 3
    });
    log(`Source: Payment table (periodEndDate within ±30 days)`, 'yellow');
    log(`Count: ${periodEndPayments.length}`, 'yellow');
    log(`Purpose: Alert for payment period ending (generate next payment)`, 'yellow');
    log(`Completion: ⚠️  CANNOT quick-complete - requires action`, 'red');
    log(`Recommended Action: Redirect to patient page`, 'cyan');
    log(`What to do: Generate next period payment, contact patient\n`, 'yellow');

    eventTypes.push({
      type: 'PAYMENT_PERIOD_END',
      source: 'Payment table (periodEndDate)',
      canComplete: false,
      action: 'Redirect to patient page',
      dbChange: 'User must create next payment'
    });

    // Summary
    log('\n╔═══════════════════════════════════════════════════════════════════╗', 'bright');
    log('║                         SUMMARY                                   ║', 'bright');
    log('╚═══════════════════════════════════════════════════════════════════╝\n', 'bright');

    const canComplete = eventTypes.filter(e => e.canComplete === true);
    const cannotComplete = eventTypes.filter(e => e.canComplete === false);
    const maybeComplete = eventTypes.filter(e => e.canComplete === 'maybe');

    log(`Total Event Types: ${eventTypes.length}`, 'cyan');
    log(`\n✅ Can Quick-Complete (${canComplete.length}):`, 'green');
    canComplete.forEach(e => {
      log(`   • ${e.type} - ${e.action}`, 'green');
    });

    log(`\n⚠️  Cannot Quick-Complete (${cannotComplete.length}):`, 'red');
    cannotComplete.forEach(e => {
      log(`   • ${e.type} - ${e.action}`, 'yellow');
    });

    log(`\n🤔 Maybe Complete (${maybeComplete.length}):`, 'yellow');
    maybeComplete.forEach(e => {
      log(`   • ${e.type} - ${e.action}`, 'cyan');
    });

    log('\n' + '═'.repeat(70), 'bright');
    log('RECOMMENDATIONS:', 'bright');
    log('═'.repeat(70) + '\n', 'bright');

    log('Option A: Simple Approach (Current Implementation)', 'cyan');
    log('  • Show "Marquer comme terminé" only for TASK and APPOINTMENT_REMINDER', 'yellow');
    log('  • Show "Voir les détails" for everything else', 'yellow');
    log('  • Pros: Simple, no confusion', 'green');
    log('  • Cons: Cannot dismiss reminders\n', 'red');

    log('Option B: Dismiss System', 'cyan');
    log('  • Add "Terminé" for: TASK, APPOINTMENT_REMINDER', 'yellow');
    log('  • Add "Ignorer" for: SALE_RAPPEL_*, RENTAL_ALERT, RENTAL_APPOINTMENT', 'yellow');
    log('  • Add "Traiter" redirect for: DIAGNOSTIC_PENDING, PAYMENT_*, RENTAL_EXPIRING, CNAM_RENEWAL, RENTAL_TITRATION', 'yellow');
    log('  • Pros: More control, can hide reminders', 'green');
    log('  • Cons: More complex UI\n', 'red');

    log('Option C: Status-Based Actions (Recommended)', 'cyan');
    log('  • Actionable (complete): TASK, APPOINTMENT_REMINDER', 'green');
    log('  • Dismissable (acknowledge): SALE_RAPPEL_*, RENTAL_ALERT, RENTAL_APPOINTMENT', 'yellow');
    log('  • Redirect-only (process): DIAGNOSTIC_PENDING, PAYMENT_*, RENTAL_*, CNAM_RENEWAL', 'cyan');
    log('  • Pros: Clear intent, better UX', 'green');
    log('  • Cons: Requires schema changes for dismiss tracking\n', 'red');

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAllEventTypes();
