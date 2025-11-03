# 🔔 CNAM Rappels (Renewal Reminders) Feature

## Business Context

In Tunisia, the CNAM (Caisse Nationale d'Assurance Maladie) provides sponsorship for medical device purchases with specific renewal schedules:

### Renewal Periods
- **Accessories (Masque, etc.)**: Can be replaced every **2 years** with CNAM sponsorship
- **Medical Devices (CPAP, VNI, etc.)**: Can be replaced every **7 years** with CNAM sponsorship

### Business Value
Each renewal represents:
- ✅ New sales opportunity with CNAM coverage
- 👥 Continued patient care
- 💰 Recurring revenue stream
- 🏥 Regulatory compliance

---

## Feature Overview

The **Rappels CNAM** tab provides a comprehensive view of all sales with automatic calculation of renewal dates, helping you:

1. **Identify upcoming renewals** (90-day advance notice)
2. **Track overdue renewals** (opportunities to contact patients)
3. **Manage CNAM-sponsored sales pipeline**
4. **Maintain patient relationships**

---

## How It Works

### Data Sources
The table combines data from:
- ✅ Sales records
- ✅ Payment information
- ✅ CNAM bons (dossiers)
- ✅ Client information (patients/companies)

### Automatic Calculations
For each sale, the system **automatically calculates** (no database storage):

```typescript
// Accessories Rappel (2 years)
rappel2Years = saleDate + 2 years
daysUntil2Years = rappel2Years - today
status2Years = {
  'passed': daysUntil < 0 (overdue)
  'upcoming': 0 <= daysUntil <= 90 (next 3 months)
  'distant': daysUntil > 90 (future)
}

// Device Rappel (7 years)
rappel7Years = saleDate + 7 years
daysUntil7Years = rappel7Years - today
status7Years = {
  'passed': daysUntil < 0 (overdue)
  'upcoming': 0 <= daysUntil <= 90 (next 3 months)
  'distant': daysUntil > 90 (future)
}
```

---

## User Interface

### Statistics Dashboard (Top)
Four real-time metric cards:

| Card | Description | Color |
|------|-------------|-------|
| **Accessoires à renouveler** | Accessories due within 90 days | 🟠 Orange |
| **Appareils à renouveler** | Devices due within 90 days | 🔵 Blue |
| **Accessoires dépassés** | Overdue accessories | 🔴 Red |
| **Appareils dépassés** | Overdue devices | 🟣 Purple |

### Filters
- 🔍 **Search**: Sale code, client name, payment code, CNAM bon number
- ⏰ **Rappel Filter**:
  - All rappels
  - 🔔 All upcoming (90 days)
  - Accessories upcoming
  - Accessories passed
  - Devices upcoming
  - Devices passed
- 👤 **Client Type**: All, Patients, Companies

### Table Columns

| Column | Description | Example |
|--------|-------------|---------|
| Code Vente | Sale code | `V-2024-001` |
| Facture | Invoice number | `FAC-2024-001` |
| Date Vente | Original sale date | `15/03/2024` |
| Client | Patient or company name | `Ahmed Ben Ali` |
| Code Paiement | Payment reference | `PAY-2024-001` |
| Méthode | Payment method | CNAM, Espèces, etc. |
| Montant | Payment amount | `1,475.00 DT` |
| N° Bon CNAM | CNAM bon number | `CNAM-001` |
| **Rappel Accessoires (2 ans)** | Renewal date + status | `15/03/2026 - Dans 45j` |
| **Rappel Appareil (7 ans)** | Renewal date + status | `15/03/2031 - 5a 2m` |
| Notes | Sale notes | Custom notes |

---

## Status Badges

### Rappel Status Indicators

#### 🔴 Dépassé (Passed)
```
Badge: Red background
Icon: ⚠️ AlertCircle
Text: "Dépassé (123j)" (number of days overdue)
```
**Action**: Contact patient immediately - renewal is overdue

#### 🟠 À venir (Upcoming - within 90 days)
```
Badge: Orange background
Icon: 🔔 Bell
Text: "Dans 45j" (days remaining)
```
**Action**: Schedule renewal appointment, prepare paperwork

#### ⚪ Distant (Future - more than 90 days)
```
Badge: Gray background
Icon: 🕐 Clock
Text: "2a 3m" (years and months remaining)
```
**Action**: No immediate action needed

---

## Use Cases

### 1. Monthly Renewal Planning
**Goal**: Plan next month's CNAM renewals

**Steps**:
1. Filter by "🔔 Tous à venir (90j)"
2. Sort by rappel date
3. Export list (future enhancement)
4. Contact patients proactively

### 2. Recovery Campaign (Overdue Renewals)
**Goal**: Recover lost renewal opportunities

**Steps**:
1. Filter by "Accessoires dépassés" or "Appareils dépassés"
2. Review client list
3. Contact patients about delayed renewals
4. Create new sales with CNAM sponsorship

### 3. Patient Care Follow-up
**Goal**: Maintain patient relationships

**Steps**:
1. Search for specific patient
2. View all their sales history
3. Check upcoming renewal dates
4. Schedule preventive maintenance visit

### 4. Revenue Forecasting
**Goal**: Predict upcoming CNAM-sponsored sales

**Steps**:
1. View statistics cards (upcoming renewals)
2. Calculate potential revenue (avg. sale price × renewals)
3. Plan inventory for accessories/devices
4. Coordinate with CNAM for bon preparation

---

## Business Benefits

### 📈 Revenue Growth
- Proactive renewal reminders = more sales
- No missed opportunities (automated tracking)
- Predictable recurring revenue

### 👥 Patient Satisfaction
- Timely equipment replacement
- Better health outcomes
- Maintained care continuity

### 💼 Operational Efficiency
- No manual calculation of renewal dates
- Centralized tracking dashboard
- Automated status updates

### 🏥 Compliance
- Meet CNAM renewal schedules
- Proper documentation trail
- Audit-ready records

---

## Technical Implementation

### Architecture
```
┌─────────────────────┐
│   Sales Database    │
│  (saleDate stored)  │
└──────────┬──────────┘
           │
           ├──> Fetch sales data
           │
┌──────────▼──────────┐
│  Frontend Component │
│  CNAMRappelsTable   │
│                     │
│  - Calculate dates  │ ← Real-time calculation
│  - Compute status   │ ← Based on today's date
│  - Filter results   │
└─────────────────────┘
```

### Why NOT Store in Database?
1. **Always up-to-date**: Status changes automatically each day
2. **No data drift**: Calculated from authoritative source (saleDate)
3. **Simpler maintenance**: No scheduled jobs to update statuses
4. **Reduced storage**: No duplicate data

### Performance Considerations
- ✅ Calculations done in `useMemo` (cached until dependencies change)
- ✅ Efficient filtering with early returns
- ✅ Pagination to limit rendered rows
- ✅ Lightweight date operations

---

## Future Enhancements

### 🔔 Notification System
```typescript
// Automated email/SMS reminders
if (daysUntil2Years === 90) {
  sendNotification({
    to: patient.email,
    subject: "Rappel: Renouvellement Accessoires CNAM",
    message: "Votre masque peut être renouvelé dans 90 jours..."
  });
}
```

### 📊 Export & Reporting
- Export to Excel with filtered results
- Generate renewal reports for CNAM
- Print-friendly renewal schedules

### 📅 Calendar Integration
- Add renewal dates to Google Calendar
- Sync with CRM systems
- Automated appointment scheduling

### 🤖 Automatic Sale Creation
- Pre-fill renewal sale with previous items
- Auto-assign to responsible employee
- Link to original sale for history

### 📱 Mobile App Integration
- Push notifications for technicians
- Field updates on patient visits
- GPS-based renewal route planning

---

## Usage Example

### Scenario: Monthly Renewal Review

**Date**: March 1, 2024

**Actions**:
1. Navigate to: **Sales → Rappels CNAM** tab
2. Statistics show:
   - 🟠 **12 accessories** due within 90 days
   - 🔵 **3 devices** due within 90 days
   - 🔴 **5 accessories** overdue
   - 🟣 **1 device** overdue

3. Filter by "🔔 Tous à venir (90j)"
4. Results show 15 upcoming renewals

5. For each row:
   - View client: `Ahmed Ben Ali`
   - Original sale: `15/06/2022` (CPAP + Masque)
   - Accessory renewal: `15/06/2024 - Dans 45j` 🟠
   - Device renewal: `15/06/2029 - 4a 3m` ⚪

6. Action: Contact Ahmed to schedule masque replacement
7. Create new sale with CNAM sponsorship
8. Link to original sale in notes

**Result**: Proactive patient care + new revenue opportunity

---

## Support & Maintenance

### Common Questions

**Q: Why don't I see some sales in the rappels table?**
A: Only sales with valid `saleDate` are shown. Check that the sale has a date recorded.

**Q: Can I change the 2-year or 7-year periods?**
A: These are hardcoded based on Tunisian CNAM regulations. Contact development team if regulations change.

**Q: How are "upcoming" renewals defined?**
A: Renewals within 90 days are flagged as "upcoming" (3-month advance notice).

**Q: What happens if a renewal date has passed?**
A: The status shows as "Dépassé" with days overdue. You can still create the renewal sale - CNAM may allow retroactive coverage.

---

## Related Documentation

- [Sales Management System](./SALES_SYSTEM_DOCUMENTATION.md)
- [CNAM Bons Management](./CNAM_TABLE_ROW_EDITS.md)
- [Payment Processing](./src/components/payment/README.md)

---

## Change Log

### Version 1.0.0 (Current)
- ✅ Initial implementation
- ✅ 2-year and 7-year rappel calculations
- ✅ Statistics dashboard
- ✅ Advanced filtering
- ✅ Status badges with visual indicators

### Planned Features
- 🔜 Email/SMS notifications
- 🔜 Export to Excel
- 🔜 Renewal sale wizard
- 🔜 Historical renewal tracking

---

**Last Updated**: January 2025
**Feature Status**: ✅ Production Ready
**Documentation Version**: 1.0.0
