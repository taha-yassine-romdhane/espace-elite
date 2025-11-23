# Sales Page - Complete Logic Documentation

## Overview
The Sales page (`/roles/admin/sales`) is a comprehensive sales management interface with **5 main tabs** that provide different views and management capabilities for sales operations.

**Location**: `src/pages/roles/admin/sales/index.tsx`

---

## Table of Contents
1. [Page Structure](#page-structure)
2. [Tab 1: Ventes (Sales)](#tab-1-ventes-sales)
3. [Tab 2: Articles](#tab-2-articles)
4. [Tab 3: Paiements (Payments)](#tab-3-paiements-payments)
5. [Tab 4: Bons CNAM](#tab-4-bons-cnam)
6. [Tab 5: Rappels CNAM](#tab-5-rappels-cnam)
7. [Data Flow and API Integration](#data-flow-and-api-integration)
8. [Key Business Logic](#key-business-logic)

---

## Page Structure

### Main Container
**File**: `src/pages/roles/admin/sales/index.tsx`

```tsx
- Title: "Gestion des Ventes"
- Description: "Gérer toutes les ventes, paiements et bons CNAM dans des tableaux séparés"
- Refresh Button: Triggers refresh of all tabs simultaneously
- 5 Tabs with separate Excel-like tables
```

### State Management
```tsx
const [refreshKey, setRefreshKey] = useState(0);
const [activeTab, setActiveTab] = useState('sales');
```

Each tab component receives a unique refresh key to force re-fetching when needed.

---

## Tab 1: Ventes (Sales)

**Component**: `SalesExcelTable.tsx`
**Icon**: ShoppingCart
**Purpose**: Main sales management interface

### Key Features

#### 1. **Comprehensive Filter System**
Located in a blue gradient panel at the top:

**Search Bar**:
- Searches: saleCode, invoiceNumber, client name, notes

**Status Filter**:
- All statuses
- COMPLETED (Terminé)
- PENDING (En attente)
- CANCELLED (Annulé)

**Client Type Filter**:
- All clients
- Patients only
- Companies only

**Date Range Filter**:
- All periods
- Last 30 days
- Last 6 months
- Last year
- Older than 1 year

**Amount Range Filter**:
- All amounts
- < 100 DT
- 100 - 500 DT
- 500 - 1000 DT
- 1000 - 5000 DT
- > 5000 DT

#### 2. **Data Columns**

| Column | Description | Editable |
|--------|-------------|----------|
| Code Vente | Auto-generated sale code | No |
| Facture | Auto-generated invoice number | No |
| Date | Sale date | Yes (inline) |
| Client | Patient or Company | Yes (via dialog) |
| Type | Patient/Société badge | No (derived) |
| Assigné à | Employee assigned to sale | Yes (dropdown) |
| Créé par | User who created sale | No |
| Montant Total | Total before discount | No (calculated) |
| Remise | Discount amount | Yes (inline) |
| Montant Final | Total after discount | No (calculated) |
| Statut | Sale status | Yes (dropdown) |
| Articles | Number of items | Clickable (opens dialog) |
| Paiements | Number of payments | Clickable (opens dialog) |
| Bons CNAM | Number of CNAM bonds | Clickable (opens dialog) |
| Notes | Free text notes | Yes (inline) |
| Actions | Edit/View/Delete buttons | - |

#### 3. **Add New Sale Workflow**

When clicking "Ajouter une Vente":
1. Green-highlighted row appears at top of table
2. Client selection (via PatientSelectorDialog)
3. Sale date (default: today)
4. Assigned employee (dropdown)
5. Status (default: PENDING)
6. Discount (optional)
7. Notes (optional)
8. **Items and payments are NOT required** - can be added later

**Validation**:
- No strict validation - flexible workflow
- Items, payments, client can all be added after sale creation

#### 4. **Inline Editing**

Click "Edit" (pencil icon) on any row:
- Editable fields become input controls
- Save/Cancel buttons appear
- Changes sent to PUT `/api/sales/{id}`

#### 5. **Dialogs**

**Items Dialog** (Articles):
- Shows all sale items with device codes
- Displays: item name, quantity, price, total
- Shows device/product type (badge colored)
- Shows serial numbers for medical devices

**Payments Dialog** (Paiements):
- Payment summary card with gradient background
- Shows: total paid, remaining amount, status
- Lists individual payment details
- Shows CNAM info if payment method is CNAM
- Payment method badges with colors

**CNAM Bons Dialog**:
- Shows all CNAM bonds linked to this sale
- Progress bar for each bond (7-step process)
- Financial breakdown: device price, CNAM amount, patient complement
- Status badges with icons
- Summary section at bottom with totals

#### 6. **Delete Confirmation**

Shows comprehensive warning:
- Deletes all sale items
- Deletes all payments
- Deletes all CNAM bonds
- **Automatically restores stock**

### Data Flow

```typescript
// Fetching
useQuery(['sales']) -> GET /api/sales?details=true&paginate=false
  Returns: Sales with patient/company/items/payments/cnamBons

// Creating
POST /api/sales
  Body: { saleDate, status, patientId?, companyId?, assignedToId?, notes, items?, payments? }

// Updating
PUT /api/sales/{id}
  Body: Partial<Sale>

// Deleting
DELETE /api/sales/{id}
  Cascades: items, payments, CNAM bonds
  Side effect: Restores stock quantities
```

---

## Tab 2: Articles

**Component**: `ArticlesExcelTable.tsx`
**Icon**: Package
**Purpose**: Manage individual items within sales

### Key Features

#### 1. **Filter System**

**Search Bar**:
- Searches: sale code, invoice, client, product name, product code, serial number

**Client Type Filter**:
- All clients
- Patients
- Companies

**Article Type Filter**:
- All articles
- Products (green badge)
- Medical Devices (blue badge)

#### 2. **Data Columns**

| Column | Description | Details |
|--------|-------------|---------|
| Code Vente | Sale code | Badge |
| Facture | Invoice number | Blue badge |
| Client | Patient/Company name + code | Clickable link to patient |
| Type | Product vs Medical Device | Color-coded badge |
| Article | Product/device name with code | Badge + name |
| Marque/Modèle | Brand and model | Only for products |
| N° Série | Serial number | For medical devices |
| Description | Free text description | Textarea |
| Stock | Source stock location | Shows "Sortie de: [location]" |
| Config | Device configuration | Shows CPAP/VNI/O2 parameters |
| Qté | Quantity | Always 1 for devices, editable for products |
| Prix U. | Unit price | Editable |
| Remise | Discount | Editable |
| Total | Item total (qty × price - discount) | Calculated |
| Actions | Edit/Delete | - |

#### 3. **Add New Article Workflow**

Complex multi-step process:
1. **Client Selection**: Opens dialog to select patient/company
2. **Sale Selection**: Dropdown filtered by selected client's sales
3. **Article Selection**: Opens ArticleSelectionDialog
   - Shows medical devices, products, accessories, spare parts
   - Displays availability and prices
   - For devices: shows serial numbers
4. **Quantity**: Only for products (devices are always qty=1)
5. **Price**: Pre-filled from product/device, editable
6. **Discount**: Optional
7. **Stock Location**: Required for products (auto-selected for admin from their location)
8. **Configuration**: For medical devices only (CPAP, VNI, O2 concentrator parameters)

**Stock Validation**:
- For products: checks available stock in selected location
- Shows "Disponible: X" or "Stock épuisé" warning
- Prevents overselling

#### 4. **Device Configuration**

For medical devices (CPAP, VNI, Oxygen Concentrators):
- Opens ProductParameterDialog when device selected
- Stores configuration in `SaleConfiguration` model
- Displays parameters in Config column:
  - CPAP: Pression, Pression Rampe, Durée Rampe, EPR
  - VNI: IPAP, EPAP, AID, Mode, FR, VT
  - O2: Débit

**Configuration Display**:
```
"P: 10 • P.Rampe: 6 • Durée: 15min • EPR: 2"
```

#### 5. **Serial Number Tracking**

For medical devices:
- Serial number auto-populated from device record
- Displayed in font-mono for easy reading
- Immutable (can't be changed in article)

### Data Flow

```typescript
// Fetching
useQuery(['sale-items']) -> GET /api/sale-items
  Returns: All sale items with full relations

// Creating
POST /api/sale-items
  Body: {
    saleId, productId?, medicalDeviceId?,
    quantity, unitPrice, discount, itemTotal,
    serialNumber?, stockLocationId?, description?,
    parameters? // For device configuration
  }
  Side effects:
    - Decrements stock quantity
    - Updates sale totalAmount
    - Updates device status to SOLD if medical device

// Updating
PUT /api/sale-items/{id}
  Body: Partial<SaleItem> + parameters?

// Deleting
DELETE /api/sale-items/{id}
  Side effects:
    - Restores stock quantity
    - Updates sale totalAmount
    - Updates device status back to ACTIVE
```

---

## Tab 3: Paiements (Payments)

**Component**: `PaymentsExcelTable.tsx`
**Icon**: CreditCard
**Purpose**: Manage all sale payments

### Key Features

#### 1. **Comprehensive Filter System**

**6 Filters Available**:

1. **Source Filter** (DEFAULT: SALE only)
   - SALE: Payments from sales
   - RENTAL: Payments from rentals
   - DIAGNOSTIC: Payments from diagnostics
   - AUTRE: Other payments
   - All sources

2. **Status Filter**
   - PAID (Payé) - Green
   - PENDING (En attente) - Yellow
   - PARTIAL (Partiel) - Orange
   - CANCELLED (Annulé) - Red

3. **Method Filter**
   - CASH (Espèces) - Emerald
   - CHEQUE (Chèque) - Blue
   - VIREMENT (Virement) - Purple
   - BANK_TRANSFER (Virement Bancaire) - Cyan
   - CNAM - Red
   - TRAITE (Traite) - Amber
   - MANDAT (Mandat) - Indigo
   - MIXED (Mixte) - Gray

4. **Client Type Filter**
   - Patients
   - Companies

5. **Date Range Filter**
   - Last 30 days
   - Last 6 months
   - Last year
   - Older than 1 year

6. **Amount Range Filter**
   - < 100 DT
   - 100-500 DT
   - 500-1000 DT
   - 1000-5000 DT
   - > 5000 DT

#### 2. **Data Columns**

| Column | Description | Details |
|--------|-------------|---------|
| Code Paiement | Auto-generated | PAY-XXXX format |
| Date | Payment date | Editable |
| Source | SALE/RENTAL/etc | Color-coded badge |
| Client | Patient/Company | Clickable link |
| Vente | Sale code | Badge |
| Méthode | Payment method | Color-coded badge |
| Montant | Payment amount | Bold green text |
| Statut | Payment status | Badge with icon |
| N° CNAM | CNAM dossier number | Only for CNAM payments |
| Échéance | Due date | Orange text (for TRAITE) |
| Notes | Free text | Editable |
| Actions | Edit/Delete | - |

#### 3. **Add New Payment Workflow**

1. **Date**: Default today
2. **Client Selection**: Opens client selector dialog
   - Shows both patients and companies
   - Searchable by name or code
3. **Sale Selection**: Dropdown of client's sales
   - Shows sale code and final amount
4. **Method Selection**: Dropdown with all payment methods
5. **Amount**:
   - For CNAM: Select bon CNAM (auto-fills amount)
   - For others: Manual input
6. **CNAM-specific fields** (if method = CNAM):
   - CNAM bon selector (auto-populates amount and dossier number)
   - Dossier number input
7. **Due Date**: Only for TRAITE method
8. **Notes**: Optional

**CNAM Payment Logic**:
- When CNAM method selected, shows CNAM bon selector
- Bons filtered by selected sale
- Selecting bon auto-fills:
  - Amount (from bonAmount)
  - Dossier number (from bon.dossierNumber)

#### 4. **Payment Data Aggregation**

**3 Data Sources** (priority order):
1. `sale.payments[]` array (from details=true API)
2. `sale.payment.paymentDetails[]` (aggregated payment model)
3. Standalone payments from `/api/payments/all?source=SALE`

**Deduplication**: Uses payment.id to avoid showing same payment multiple times

### Data Flow

```typescript
// Fetching
// Multi-source fetching for complete payment data
useQuery(['sale-payments']) -> GET /api/payments/all?source=SALE
useQuery(['sales']) -> GET /api/sales?paginate=false (for embedded payments)

// Creating
POST /api/sales/{saleId}/payments
  Body: {
    type, amount, classification: 'principale',
    paymentDate, notes,
    // Method-specific fields:
    chequeNumber?, bank?,          // CHEQUE
    reference?, bank?,             // VIREMENT/BANK_TRANSFER
    traiteNumber?, dueDate?,       // TRAITE
    mandatNumber?,                 // MANDAT
    dossierNumber?, cnamCardNumber?, cnamBonId?  // CNAM
  }
  Side effects:
    - Creates Payment record
    - Updates sale payment status
    - Updates sale remainingAmount

// Updating
PUT /api/payments/{id}
  Body: Partial<Payment>

// Deleting
DELETE /api/payments/{id}
  Side effects:
    - Updates sale remainingAmount
    - Updates sale payment status
```

---

## Tab 4: Bons CNAM

**Component**: `CNAMBonsExcelTable.tsx`
**Icon**: FileText
**Purpose**: Manage CNAM reimbursement bonds for sales

### Key Features

#### 1. **Filter System**

**Search Bar**:
- Dossier number, patient name, patient code, sale code

**Status Filter**:
- EN_ATTENTE_APPROBATION (En attente) - Yellow with Clock icon
- APPROUVE (Approuvé) - Green with CheckCircle icon
- EN_COURS (En cours) - Blue with TrendingUp icon
- TERMINE (Terminé) - Emerald with CheckCircle icon
- REFUSE (Refusé) - Red with XCircle icon

**Bon Type Filter**:
- CPAP (Blue badge)
- MASQUE (Purple badge)
- VNI
- CONCENTRATEUR_OXYGENE
- AUTRE (Gray badge)

#### 2. **Data Columns**

| Column | Description | Details |
|--------|-------------|---------|
| N° Dossier | CNAM dossier number | Font-mono, editable |
| Patient | Patient name + code | Clickable link |
| Vente | Sale code | Badge |
| Type Bon | CPAP/MASQUE/etc | Color-coded badge |
| Montant Bon | CNAM reimbursement amount | Red bold (what CNAM pays) |
| Prix Appareil | Total device price | Bold |
| Complément | Patient pays (Price - Bon) | Orange bold |
| Progression | Current step (1-7) | Progress bar with % |
| Statut | Bond status | Badge with icon |
| Date Création | Creation date | With calendar icon |
| Actions | View/Edit/Delete | - |

#### 3. **7-Step CNAM Process**

Each bond progresses through 7 steps:

```
1. En attente approbation CNAM
2. Accord avec patient
3. Tech récupère Bon CNAM
4. Livraison Bon à Admin
5. Livraison au Technicien
6. Signature Médecin
7. Livraison finale Admin
```

**Visual Progress Bar**:
- Shows: "Étape X/7 - [Step Name]"
- Blue progress bar with percentage
- Editable via dropdown when editing

#### 4. **Add New Bon CNAM Workflow**

1. **Dossier Number**: Manual input
2. **Client Selection**: Via PatientSelectorDialog
3. **Sale Selection**: Dropdown filtered by client
4. **Bon Type**: Dropdown shows CNAM fixed rate for each type
   - E.g., "CPAP (1000 DT)" - shows nomenclature rate
5. **CNAM Monthly Rate**: Auto-filled from nomenclature, editable
6. **Device Monthly Rate**: Auto-calculated from sale items total, editable
7. **Complément**: Auto-calculated (devicePrice - bonAmount)
8. **Status**: Default EN_ATTENTE_APPROBATION
9. **Submission Date**: Default today

**Financial Calculation**:
```typescript
// For ACHAT (purchase) category:
coveredMonths = 1 (one-time purchase, not rental)
bonAmount = cnamMonthlyRate × coveredMonths
devicePrice = deviceMonthlyRate × coveredMonths
complementAmount = devicePrice - bonAmount
```

#### 5. **CNAM Nomenclature Integration**

Fetches fixed CNAM rates:
```typescript
useQuery(['cnam-nomenclature']) -> GET /api/cnam-nomenclature
  Filters by: bonType + category=ACHAT
  Returns: Fixed reimbursement amounts per device type
```

**Example Rates**:
- CPAP: 1000 DT
- MASQUE: 200 DT
- VNI: 1500 DT
- etc.

### Data Flow

```typescript
// Fetching - DUAL SOURCE
useQuery(['sales']) -> GET /api/sales
  Includes: sale.cnamDossiers[] and sale.cnamBons[]
useQuery(['sale-cnam-bons']) -> GET /api/cnam-bons?category=ACHAT
  Standalone bonds with category=ACHAT

// Data Combination
Combines CNAMDossier records + CNAMBonRental (category=ACHAT)
Deduplicates by ID

// Creating
POST /api/cnam-bons
  Body: {
    category: 'ACHAT',
    saleId, patientId, bonType, status,
    cnamMonthlyRate, deviceMonthlyRate, coveredMonths,
    dossierNumber, submissionDate, notes
  }
  Calculations:
    - bonAmount = cnamMonthlyRate × coveredMonths
    - devicePrice = deviceMonthlyRate × coveredMonths
    - complementAmount = devicePrice - bonAmount

// Updating
PUT /api/cnam-bons/{id}
  Body: { bonType?, status?, currentStep?, bondAmount?,
          devicePrice?, complementAmount?, dossierNumber?, notes? }

// Deleting
DELETE /api/cnam-bons/{id}
```

---

## Tab 5: Rappels CNAM

**Component**: `CNAMRappelsTable.tsx`
**Icon**: Bell
**Purpose**: CNAM replacement reminders (2-year accessories, 7-year devices)

### Key Features

#### 1. **Business Logic: Replacement Cycles**

**CNAM regulations** allow patients to get replacement devices/accessories:
- **2 Years**: Accessories (masks, tubes, filters)
- **7 Years**: Main device (CPAP, VNI, O2 concentrator)

**Calculation**:
```typescript
saleDate = Date of original sale
rappel2Years = saleDate + 2 years
rappel7Years = saleDate + 7 years

Status:
- "passed": Date has passed (negative days)
- "upcoming": Within 90 days (0-90 days)
- "distant": More than 90 days away
```

#### 2. **Comprehensive Filter System**

**6 Filters**:

1. **Rappel Status Filter**:
   - All rappels
   - Any upcoming (90 days)
   - Accessories upcoming (2 years approaching)
   - Accessories passed (2 years exceeded)
   - Devices upcoming (7 years approaching)
   - Devices passed (7 years exceeded)

2. **Client Type**: Patient/Company

3. **Payment Method**: CASH/CHEQUE/VIREMENT/CNAM/etc

4. **Date Range**: Sale date filters

5. **CNAM Bon**: With bon / Without bon

#### 3. **Data Columns**

| Column | Description | Details |
|--------|-------------|---------|
| Code Vente | Sale code | Badge |
| Facture | Invoice | Blue badge |
| Date Vente | Sale date | With calendar icon |
| Client | Patient/Company | Clickable link |
| Code Paiement | ALL payment codes | Shows all, stacked vertically |
| Méthode | ALL payment methods | Shows all, stacked vertically |
| Montant Payé | Total paid (sum of all payments) | Bold green |
| Prix Appareil | Sale total (finalAmount) | Bold blue |
| Reste à Payer | Remaining amount | Red if positive, green if zero |
| N° Bon CNAM | CNAM bon number + type | Red badge |
| Rappel Accessoires (2 ans) | Date + status badge | Color-coded by status |
| Rappel Appareil (7 ans) | Date + status badge | Color-coded by status |
| Notes | Sale notes | Truncated |
| Actions | View sale | File icon |

#### 4. **Status Badges**

**Passed** (Dépassé):
```
Red badge with AlertCircle icon
"Dépassé (15j)" - shows days overdue
```

**Upcoming** (À venir):
```
Orange badge with Bell icon
"Dans 45j" - shows days remaining
```

**Distant**:
```
Gray badge with Clock icon
"2a 3m" - shows years and months remaining
```

#### 5. **Multiple Payments Support**

**CRITICAL**: This tab properly handles multiple payments per sale:
- Shows ALL payment codes (vertically stacked)
- Shows ALL payment methods (vertically stacked)
- Calculates total paid across all payments
- Shows count: "(3 paiements)" if multiple

**Payment Aggregation**:
```typescript
// Priority order:
1. sale.payments[] array (from details=true)
2. sale.payment.paymentDetails[] (aggregated model)
3. Standalone salePaymentsData

totalPaid = sum of all payment amounts
remainingAmount = saleAmount - totalPaid
```

#### 6. **Visual Highlighting**

Rows with upcoming rappels (2-year OR 7-year):
```css
className="bg-orange-50/30" // Light orange background
```

### Data Flow

```typescript
// Fetching
useQuery(['cnam-rappels-sales']) -> GET /api/sales?paginate=false&details=true
  Returns: ALL sales with full details
useQuery(['cnam-rappels-bons']) -> GET /api/cnam-bons?category=ACHAT
useQuery(['cnam-rappels-payments']) -> GET /api/payments/all?source=SALE

// Processing
For each sale:
  1. Calculate rappel dates (saleDate + 2 years, saleDate + 7 years)
  2. Aggregate all payments (from 3 sources)
  3. Calculate totals and remaining
  4. Find CNAM bon if exists
  5. Return unified CNAMRappelRow

// Display
Filters and displays processed rows
No mutations - read-only view
```

---

## Data Flow and API Integration

### API Endpoints Used

**Sales Tab**:
- `GET /api/sales?details=true&paginate=false`
- `POST /api/sales`
- `PUT /api/sales/{id}`
- `DELETE /api/sales/{id}`
- `GET /api/patients`
- `GET /api/societes` (companies)
- `GET /api/users`

**Articles Tab**:
- `GET /api/sale-items`
- `POST /api/sale-items`
- `PUT /api/sale-items/{id}`
- `DELETE /api/sale-items/{id}`
- `GET /api/sales?paginate=false`
- `GET /api/products`
- `GET /api/medical-devices`
- `GET /api/patients`
- `GET /api/societes`
- `GET /api/stock/locations`
- `GET /api/stocks?locationId=X&productId=Y` (availability check)

**Payments Tab**:
- `GET /api/payments/all?source=SALE`
- `GET /api/sales?paginate=false`
- `POST /api/payments`
- `PUT /api/payments/{id}`
- `DELETE /api/payments/{id}`
- `GET /api/patients`
- `GET /api/societes`
- `GET /api/cnam-bons?category=ACHAT` (for CNAM payment bon selection)

**CNAM Bons Tab**:
- `GET /api/sales` (includes cnamDossiers and cnamBons)
- `GET /api/cnam-bons?category=ACHAT`
- `POST /api/cnam-bons`
- `PUT /api/cnam-bons/{id}`
- `DELETE /api/cnam-bons/{id}`
- `GET /api/cnam-nomenclature` (fixed CNAM rates)
- `GET /api/patients`

**CNAM Rappels Tab**:
- `GET /api/sales?paginate=false&details=true`
- `GET /api/cnam-bons?category=ACHAT`
- `GET /api/payments/all?source=SALE`

---

## Key Business Logic

### 1. Stock Management with Sales

**Critical Flow**:
```typescript
// When sale item is CREATED:
1. Check stock availability
   - Query: GET /api/stocks?locationId=X&productId=Y
   - Verify: quantity <= availableQuantity
2. Decrement stock
   - Update Stock.quantity -= saleItem.quantity
3. Update device status (for medical devices)
   - Set MedicalDevice.status = 'SOLD'
   - Set MedicalDevice.destination = 'SOLD_TO_PATIENT' or 'SOLD_TO_COMPANY'

// When sale item is DELETED:
1. Restore stock
   - Update Stock.quantity += saleItem.quantity
2. Revert device status
   - Set MedicalDevice.status = 'ACTIVE'
   - Clear MedicalDevice.destination

// When sale is DELETED:
1. Cascade delete all items
2. Each deletion restores stock (via item deletion logic)
3. Restore all device statuses
```

**Stock Validation Logic**:
```typescript
const validateStockAvailability = async (locationId, productId, requestedQty) => {
  const stock = await prisma.stock.findUnique({
    where: {
      stockLocationId_productId: {
        stockLocationId: locationId,
        productId: productId
      }
    }
  });

  if (!stock || stock.quantity < requestedQty) {
    throw new Error('Stock insuffisant');
  }

  return true;
};
```

### 2. CNAM Reimbursement System

**CNAM = Caisse Nationale d'Assurance Maladie** (Tunisian Social Security)

#### Financial Model:
```
Total Device Price = [X] DT
CNAM Pays (Bon Amount) = [Y] DT (from nomenclature)
Patient Pays (Complement) = X - Y
```

#### Example:
```
CPAP Device:
- Device Price: 2500 DT (from sale items)
- CNAM Monthly Rate: 1000 DT (from nomenclature)
- Covered Months: 1 (ACHAT category)
- Bon Amount: 1000 × 1 = 1000 DT
- Patient Complement: 2500 - 1000 = 1500 DT

Breakdown:
- Patient pays 1500 DT upfront
- CNAM reimburses 1000 DT through bon process
```

#### 7-Step Process Explained:
```
Step 1: En attente approbation CNAM
  → Admin submits dossier to CNAM, waiting for approval

Step 2: Accord avec patient
  → CNAM approved, agreement signed with patient

Step 3: Tech récupère Bon CNAM
  → Technician picks up physical bon from CNAM office

Step 4: Livraison Bon à Admin
  → Technician delivers bon to admin

Step 5: Livraison au Technicien
  → Admin sends bon to technician for patient delivery

Step 6: Signature Médecin
  → Doctor signature obtained on bon

Step 7: Livraison finale Admin
  → Final signed bon delivered to admin for archiving
```

#### Bon Types and Rates:
```typescript
// From CNAM nomenclature API
const cnamRates = {
  CPAP: 1000, // DT per month
  MASQUE: 200, // DT per month
  VNI: 1500,
  CONCENTRATEUR_OXYGENE: 800,
  HUMIDIFICATEUR: 150,
  CIRCUIT: 100,
  FILTRE: 50
};
```

### 3. Payment Aggregation Strategy

**Problem**: Payments can come from multiple sources and data structures

**Solution**: 3-tier fallback system

```typescript
const aggregatePayments = (sale) => {
  const allPayments = [];

  // TIER 1: sale.payments[] (most detailed, from details=true API)
  if (sale.payments && Array.isArray(sale.payments)) {
    sale.payments.forEach(payment => {
      allPayments.push({
        id: payment.id,
        paymentCode: payment.paymentCode,
        amount: Number(payment.amount),
        method: payment.method,
        paymentDate: payment.paymentDate,
        status: payment.status,
        source: 'embedded'
      });
    });
  }
  // TIER 2: sale.payment.paymentDetails[] (aggregated payment model)
  else if (sale.payment?.paymentDetails) {
    sale.payment.paymentDetails.forEach(detail => {
      allPayments.push({
        id: detail.id,
        paymentCode: detail.paymentCode || 'N/A',
        amount: Number(detail.amount || 0),
        method: detail.type || 'UNKNOWN',
        paymentDate: detail.paymentDate || sale.saleDate,
        source: 'payment_model'
      });
    });
  }
  // TIER 3: Standalone payments from /api/payments/all
  else if (standalonePaymentsData) {
    const standalone = standalonePaymentsData.filter(
      p => p.saleId === sale.id && p.source === 'SALE'
    );
    standalone.forEach(payment => {
      allPayments.push({
        id: payment.id,
        paymentCode: payment.paymentCode,
        amount: Number(payment.amount),
        method: payment.method,
        paymentDate: payment.paymentDate,
        status: payment.status,
        source: 'standalone'
      });
    });
  }

  // Deduplicate by ID
  const uniquePayments = [];
  const seenIds = new Set();
  allPayments.forEach(payment => {
    if (!seenIds.has(payment.id)) {
      seenIds.add(payment.id);
      uniquePayments.push(payment);
    }
  });

  return uniquePayments;
};

const calculateTotals = (payments) => {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  return {
    totalPaid,
    paymentCount: payments.length
  };
};
```

**Why 3 tiers?**:
- **Tier 1**: Modern API with `?details=true` includes full payment array
- **Tier 2**: Legacy aggregated payment model (Sale → Payment → PaymentDetails)
- **Tier 3**: Fallback to standalone payments table for data integrity

### 4. CNAM Rappel (Reminder) Calculation

**Regulations**:
- Accessories (masks, tubes, filters): Replaceable every **2 years**
- Main devices (CPAP, VNI, O2): Replaceable every **7 years**

**Calculation Logic**:
```typescript
const calculateRappelInfo = (saleDate: string) => {
  const sale = new Date(saleDate);
  const today = new Date();

  // Calculate rappel dates
  const rappel2Years = new Date(sale);
  rappel2Years.setFullYear(sale.getFullYear() + 2);

  const rappel7Years = new Date(sale);
  rappel7Years.setFullYear(sale.getFullYear() + 7);

  // Calculate days until rappel
  const daysUntil2Years = Math.floor(
    (rappel2Years.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysUntil7Years = Math.floor(
    (rappel7Years.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine status (90-day warning window)
  const get2YearsStatus = (): 'passed' | 'upcoming' | 'distant' => {
    if (daysUntil2Years < 0) return 'passed';
    if (daysUntil2Years <= 90) return 'upcoming';
    return 'distant';
  };

  const get7YearsStatus = (): 'passed' | 'upcoming' | 'distant' => {
    if (daysUntil7Years < 0) return 'passed';
    if (daysUntil7Years <= 90) return 'upcoming';
    return 'distant';
  };

  // Format remaining time
  const formatRemainingTime = (days: number) => {
    if (days < 0) {
      return `Dépassé (${Math.abs(days)}j)`;
    }
    if (days <= 90) {
      return `Dans ${days}j`;
    }
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    return `${years}a ${months}m`;
  };

  return {
    rappel2Years: rappel2Years.toISOString().split('T')[0],
    rappel7Years: rappel7Years.toISOString().split('T')[0],
    rappel2YearsStatus: get2YearsStatus(),
    rappel7YearsStatus: get7YearsStatus(),
    daysUntil2Years,
    daysUntil7Years,
    formatted2Years: formatRemainingTime(daysUntil2Years),
    formatted7Years: formatRemainingTime(daysUntil7Years)
  };
};
```

**Status Colors**:
- **Passed** (Dépassé): Red badge with AlertCircle icon - patient is overdue for replacement
- **Upcoming** (À venir): Orange badge with Bell icon - within 90 days, action needed
- **Distant**: Gray badge with Clock icon - more than 90 days away, no action needed

### 5. Device Configuration Parameters

**For Medical Devices Only** (CPAP, VNI, O2 Concentrators)

#### CPAP Parameters:
```typescript
interface CPAPConfig {
  pression: number;          // Main pressure (4-20 cmH2O)
  pressionRampe: number;     // Ramp pressure (4-10 cmH2O)
  dureeRampe: number;        // Ramp duration (0-45 minutes)
  epr: number;               // Expiratory Pressure Relief (0-3)
}

// Display format:
"P: 10 • P.Rampe: 6 • Durée: 15min • EPR: 2"
```

#### VNI (BiPAP) Parameters:
```typescript
interface VNIConfig {
  ipap: number;      // Inspiratory Positive Airway Pressure (4-30 cmH2O)
  epap: number;      // Expiratory Positive Airway Pressure (4-25 cmH2O)
  aid: number;       // Assisted Inspiratory Duration
  mode: string;      // Mode (S, T, S/T, CPAP)
  fr: number;        // Respiratory Frequency (breaths per minute)
  vt: number;        // Tidal Volume (ml)
}

// Display format:
"IPAP: 15 • EPAP: 5 • Mode: S/T • FR: 14 • VT: 500ml"
```

#### O2 Concentrator Parameters:
```typescript
interface O2Config {
  debit: number;     // Flow rate (0.5-10 L/min)
}

// Display format:
"Débit: 3 L/min"
```

**Storage**:
- Stored in `SaleConfiguration` table (linked to SaleItem)
- JSON structure: `{ pression: 10, pressionRampe: 6, ... }`
- Displayed in ArticlesExcelTable Config column

### 6. Serial Number Tracking

**For Medical Devices**:
```typescript
// When adding device to sale:
1. Device selected from ArticleSelectionDialog
2. Serial number auto-populated from MedicalDevice.serialNumber
3. Displayed in font-mono for clarity
4. Immutable - cannot be changed in sale item

// Purpose:
- Traceability for warranty
- Maintenance history tracking
- CNAM reimbursement documentation
- Quality control and recalls
```

**Display Logic**:
```tsx
{saleItem.serialNumber && (
  <div className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded">
    N° Série: {saleItem.serialNumber}
  </div>
)}
```

### 7. Sale Amount Calculations

**Multi-level calculation**:

```typescript
// 1. Item Total
itemTotal = (unitPrice × quantity) - discount

// 2. Sale Subtotal
subtotal = sum of all itemTotal values

// 3. Sale Discount
saleDiscount = user-entered discount on entire sale

// 4. Sale Final Amount
finalAmount = subtotal - saleDiscount

// 5. Total Paid
totalPaid = sum of all payment amounts

// 6. Remaining Amount
remainingAmount = finalAmount - totalPaid
```

**Example**:
```
Items:
- CPAP: 2500 DT × 1 - 0 = 2500 DT
- Masque: 150 DT × 2 - 10 = 290 DT

Subtotal: 2500 + 290 = 2790 DT
Sale Discount: 90 DT
Final Amount: 2790 - 90 = 2700 DT

Payments:
- CASH: 1200 DT
- CNAM: 1000 DT

Total Paid: 2200 DT
Remaining: 2700 - 2200 = 500 DT
```

### 8. Payment Method-Specific Fields

**Different payment methods require different information**:

```typescript
type PaymentMethodFields = {
  CASH: {
    // No additional fields
  },
  CHEQUE: {
    chequeNumber: string;
    bank: string;
    dueDate?: Date;
  },
  VIREMENT: {
    reference: string;
    bank: string;
  },
  BANK_TRANSFER: {
    reference: string;
    bank: string;
  },
  CNAM: {
    dossierNumber: string;
    cnamCardNumber?: string;
    cnamBonId: string;  // Links to CNAMBonRental
  },
  TRAITE: {
    traiteNumber: string;
    dueDate: Date;  // Required for traite
    bank?: string;
  },
  MANDAT: {
    mandatNumber: string;
    reference?: string;
  },
  MIXED: {
    notes: string;  // Describe the mix of methods
  }
};
```

**Validation Logic**:
```typescript
const validatePaymentFields = (payment) => {
  switch (payment.method) {
    case 'CHEQUE':
      if (!payment.chequeNumber || !payment.bank) {
        throw new Error('Numéro de chèque et banque requis');
      }
      break;
    case 'CNAM':
      if (!payment.dossierNumber || !payment.cnamBonId) {
        throw new Error('Numéro de dossier et bon CNAM requis');
      }
      break;
    case 'TRAITE':
      if (!payment.traiteNumber || !payment.dueDate) {
        throw new Error('Numéro de traite et date d\'échéance requis');
      }
      break;
    // ... other methods
  }
};
```

### 9. Cascade Delete Logic

**When deleting a Sale**:

```typescript
// DELETE /api/sales/{id} performs cascading deletes:

1. Find all SaleItems linked to this sale
   → For each SaleItem:
      a. Restore stock quantity
      b. If MedicalDevice: set status back to ACTIVE
      c. Delete SaleConfiguration (device parameters)
      d. Delete SaleItem record

2. Find all Payments linked to this sale
   → Delete Payment records

3. Find all CNAMBonRental records (category=ACHAT)
   → Delete CNAM bon records

4. Delete Sale record

// Total cascade:
- Sale (1)
  → SaleItems (n)
    → SaleConfigurations (n)
    → Stock updates (n)
    → MedicalDevice status updates (n)
  → Payments (n)
  → CNAMBonRental (n)
```

**Safety Checks**:
```typescript
// Before deletion, show confirmation with counts:
const confirmDeletion = (sale) => {
  const itemCount = sale.saleItems?.length || 0;
  const paymentCount = sale.payments?.length || 0;
  const bonCount = sale.cnamBons?.length || 0;

  const message = `
    Voulez-vous vraiment supprimer cette vente ?

    Cela supprimera également :
    - ${itemCount} article(s)
    - ${paymentCount} paiement(s)
    - ${bonCount} bon(s) CNAM

    Le stock sera automatiquement restauré.
  `;

  return confirm(message);
};
```

### 10. Client Selection Logic

**Dual Client Types**: Patients OR Companies (mutually exclusive)

```typescript
type Client =
  | { type: 'PATIENT', patientId: string, companyId: null }
  | { type: 'COMPANY', companyId: string, patientId: null };

// Sale creation validation:
const validateClient = (sale) => {
  if (sale.patientId && sale.companyId) {
    throw new Error('Une vente ne peut pas avoir à la fois un patient et une société');
  }
  if (!sale.patientId && !sale.companyId) {
    // This is ALLOWED - sale can be created without client initially
    // Client can be added later via inline editing
    return true;
  }
  return true;
};
```

**Client Display**:
```tsx
const ClientBadge = ({ sale }) => {
  if (sale.patient) {
    return (
      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4" />
        <Link href={`/roles/admin/renseignement/patient/${sale.patientId}`}>
          {sale.patient.firstName} {sale.patient.lastName}
        </Link>
        <Badge variant="outline">Patient</Badge>
      </div>
    );
  }
  if (sale.company) {
    return (
      <div className="flex items-center gap-2">
        <BuildingIcon className="h-4 w-4" />
        <span>{sale.company.companyName}</span>
        <Badge variant="outline">Société</Badge>
      </div>
    );
  }
  return <span className="text-gray-400">Aucun client</span>;
};
```

---

## TypeScript Interfaces

### Core Types

```typescript
interface Sale {
  id: string;
  saleCode: string;
  invoiceNumber: string;
  saleDate: Date;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  totalAmount: Decimal;
  discount: Decimal;
  finalAmount: Decimal;
  notes?: string;

  // Client (mutually exclusive)
  patientId?: string;
  companyId?: string;

  // Assignment
  assignedToId?: string;
  createdById: string;

  // Relations
  patient?: Patient;
  company?: Company;
  assignedTo?: User;
  createdBy: User;
  saleItems: SaleItem[];
  payments: Payment[];
  cnamBons: CNAMBonRental[];
  cnamDossiers: CNAMDossier[];

  createdAt: Date;
  updatedAt: Date;
}

interface SaleItem {
  id: string;
  saleId: string;

  // Product OR Device (mutually exclusive)
  productId?: string;
  medicalDeviceId?: string;

  quantity: number;
  unitPrice: Decimal;
  discount: Decimal;
  itemTotal: Decimal;

  description?: string;
  serialNumber?: string;
  stockLocationId?: string;

  // Relations
  sale: Sale;
  product?: Product;
  medicalDevice?: MedicalDevice;
  stockLocation?: StockLocation;
  configuration?: SaleConfiguration;

  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  paymentCode: string;
  amount: Decimal;
  paymentDate: Date;
  method: PaymentMethod;
  status: 'PAID' | 'PENDING' | 'PARTIAL' | 'CANCELLED';
  source: 'SALE' | 'RENTAL' | 'DIAGNOSTIC' | 'AUTRE';

  // Linked transaction
  saleId?: string;
  rentalId?: string;
  diagnosticId?: string;

  // Method-specific fields
  chequeNumber?: string;
  traiteNumber?: string;
  mandatNumber?: string;
  reference?: string;
  bank?: string;
  dueDate?: Date;
  dossierNumber?: string;
  cnamCardNumber?: string;
  cnamBonId?: string;

  notes?: string;

  // Relations
  sale?: Sale;
  rental?: Rental;
  diagnostic?: Diagnostic;
  cnamBon?: CNAMBonRental;

  createdAt: Date;
  updatedAt: Date;
}

interface CNAMBonRental {
  id: string;
  category: 'LOCATION' | 'ACHAT';
  bonType: 'CPAP' | 'MASQUE' | 'VNI' | 'CONCENTRATEUR_OXYGENE' | 'AUTRE';
  status: 'EN_ATTENTE_APPROBATION' | 'APPROUVE' | 'EN_COURS' | 'TERMINE' | 'REFUSE';

  // For ACHAT category
  saleId?: string;

  // For LOCATION category
  rentalId?: string;

  // Common fields
  patientId: string;
  dossierNumber: string;

  // Financial
  cnamMonthlyRate: Decimal;
  deviceMonthlyRate: Decimal;
  coveredMonths: number;
  bonAmount: Decimal;        // cnamMonthlyRate × coveredMonths
  devicePrice: Decimal;      // deviceMonthlyRate × coveredMonths
  complementAmount: Decimal; // devicePrice - bonAmount

  // Progress
  currentStep: number;  // 1-7

  submissionDate: Date;
  approvalDate?: Date;
  notes?: string;

  // Relations
  patient: Patient;
  sale?: Sale;
  rental?: Rental;

  createdAt: Date;
  updatedAt: Date;
}

interface SaleConfiguration {
  id: string;
  saleItemId: string;
  parameters: Json;  // Device-specific config (CPAP, VNI, O2)

  saleItem: SaleItem;

  createdAt: Date;
  updatedAt: Date;
}

interface CNAMRappelRow {
  // Sale info
  saleId: string;
  saleCode: string;
  invoiceNumber: string;
  saleDate: string;

  // Client info
  clientType: 'PATIENT' | 'COMPANY';
  clientName: string;
  clientCode: string;
  clientId: string;

  // Financial
  saleAmount: number;
  totalPaid: number;
  remainingAmount: number;

  // Payments
  paymentCodes: string[];
  paymentMethods: string[];
  paymentCount: number;

  // CNAM bon
  cnamBonNumber?: string;
  cnamBonType?: string;

  // Rappels
  rappel2Years: string;
  rappel7Years: string;
  rappel2YearsStatus: 'passed' | 'upcoming' | 'distant';
  rappel7YearsStatus: 'passed' | 'upcoming' | 'distant';
  daysUntil2Years: number;
  daysUntil7Years: number;

  notes?: string;
}

type PaymentMethod =
  | 'CASH'
  | 'CHEQUE'
  | 'VIREMENT'
  | 'BANK_TRANSFER'
  | 'CNAM'
  | 'TRAITE'
  | 'MANDAT'
  | 'MIXED';
```

---

## Component Hierarchy

```
index.tsx (Main Sales Page)
├── PageHeader
│   └── RefreshButton
├── Tabs
│   ├── TabsList
│   │   ├── Sales Tab
│   │   ├── Articles Tab
│   │   ├── Payments Tab
│   │   ├── CNAM Bons Tab
│   │   └── CNAM Rappels Tab
│   ├── TabContent: Sales
│   │   └── SalesExcelTable
│   │       ├── Filter Panel (5 filters)
│   │       ├── Add Button
│   │       ├── Data Table
│   │       ├── PatientSelectorDialog
│   │       ├── SaleItemsDialog
│   │       ├── SalePaymentsDialog
│   │       └── SaleCNAMBonsDialog
│   ├── TabContent: Articles
│   │   └── ArticlesExcelTable
│   │       ├── Filter Panel (3 filters)
│   │       ├── Add Button (multi-step)
│   │       ├── Data Table
│   │       ├── PatientSelectorDialog
│   │       ├── ArticleSelectionDialog
│   │       └── ProductParameterDialog
│   ├── TabContent: Payments
│   │   └── PaymentsExcelTable
│   │       ├── Filter Panel (6 filters)
│   │       ├── Add Button
│   │       ├── Data Table
│   │       ├── PatientSelectorDialog
│   │       └── CNAMBonSelectorDialog
│   ├── TabContent: CNAM Bons
│   │   └── CNAMBonsExcelTable
│   │       ├── Filter Panel (3 filters)
│   │       ├── Add Button
│   │       ├── Data Table
│   │       └── PatientSelectorDialog
│   └── TabContent: CNAM Rappels
│       └── CNAMRappelsTable
│           ├── Filter Panel (6 filters)
│           └── Data Table (read-only)
```

---

## Summary

The Sales page is a **comprehensive sales management system** with 5 specialized tabs covering the entire sales lifecycle:

1. **Ventes Tab**: Core sales records with flexible workflow
2. **Articles Tab**: Detailed item management with stock integration
3. **Paiements Tab**: Payment tracking across multiple methods and sources
4. **Bons CNAM Tab**: CNAM reimbursement process management
5. **Rappels CNAM Tab**: Automated replacement reminders based on CNAM regulations

**Key Technical Features**:
- Multi-source data aggregation
- Cascading deletes with stock restoration
- Complex filter systems (up to 6 filters per tab)
- Inline editing with validation
- Device configuration management
- CNAM business logic integration
- Payment method-specific field handling
- Serial number tracking
- Real-time calculation of totals and remainders

**Data Integrity**:
- Stock synchronization
- Payment deduplication
- Device status management
- Cascade delete protection
- Multi-tier data fallback

---

**End of Documentation**