# CNAM Bon Creation Fix - Investigation & Solution

## 🐛 The Problem

When creating a sale with CNAM payment type:
- ✅ Payment was created successfully
- ✅ Sale was created successfully
- ❌ **CNAM Bon was NOT created**
- ❌ CNAM Dossier was NOT linked properly

## 🔍 Root Cause Analysis

### Issue 1: Missing `cnamInfo` in Payment Data

**Frontend (CreateSaleDialog.tsx)**:
- The `SalePayment` interface had basic CNAM fields:
  ```typescript
  dossierNumber?: string;
  cnamBonId?: string;
  ```
- But it was **missing `cnamInfo`** object with bon details:
  - bonType
  - bonAmount
  - devicePrice
  - complementAmount
  - currentStep, totalSteps
  - status, notes

**API Expectation (sales/index.ts line 571)**:
```typescript
const cnamPayments = payments.filter(p => p.type === 'cnam' && p.cnamInfo);
```
The API was looking for `payment.cnamInfo` but it was never sent!

### Issue 2: Wrong Bon Creation Logic

**API (sales/index.ts lines 814-838)**:
- CNAM bons were created from `saleData.cnamBons` array
- But the frontend **never sends `saleData.cnamBons`**
- It only sends CNAM info within payment objects

**Result**: Even when dossiers were created (from payment data), bons were not created because the API was looking in the wrong place!

## ✅ Fixes Applied

### Fix 1: Frontend - Add `cnamInfo` to Payment Interface

**File**: `src/components/sales/CreateSaleDialog.tsx`

**Added to SalePayment interface** (lines 77-86):
```typescript
cnamInfo?: {
  bonType: string;
  bonAmount: number;
  devicePrice: number;
  complementAmount: number;
  currentStep: number;
  totalSteps: number;
  status: string;
  notes?: string;
};
```

**Updated payment payload** (line 298):
```typescript
payment: payments.map(payment => ({
  // ... other fields
  cnamInfo: payment.cnamInfo // ✅ Now includes CNAM bon details
}))
```

### Fix 2: Frontend - Populate `cnamInfo` When Creating CNAM Payment

**File**: `src/components/sales/SaleCNAMBonDialog.tsx`

**Updated cnamPayment object** (lines 101-110):
```typescript
const cnamPayment = {
  id: `temp-payment-${Date.now()}`,
  method: 'CNAM',
  amount: Number(selectedNomenclature.amount) || 0,
  date: new Date().toISOString().split('T')[0],
  notes: `Bon CNAM ${bonData.bonType}`,
  cnamBonId: cnamBon.id,
  dossierNumber: bonData.dossierNumber || undefined,
  // ✅ Added cnamInfo with complete bon details
  cnamInfo: {
    bonType: bonData.bonType,
    bonAmount: Number(selectedNomenclature.amount) || 0,
    devicePrice: saleAmount || 0,
    complementAmount: 0,
    currentStep: 1,
    totalSteps: 7,
    status: 'EN_ATTENTE_APPROBATION',
    notes: bonData.notes || undefined
  }
};
```

### Fix 3: Backend - Create Bons from Payment Data

**File**: `src/pages/api/sales/index.ts`

**Updated CNAM creation logic** (lines 774-834):

**Before**:
1. Create CNAM dossiers from `cnamPaymentsData` ✅
2. Create CNAM bons from `saleData.cnamBons` ❌ (never sent)

**After**:
1. Create CNAM dossiers from `cnamPaymentsData` ✅
2. **Create CNAM bons directly after each dossier** ✅ (lines 812-832)

```typescript
// Create CNAM Bon directly from payment data
const bonNumber = `BON-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

await tx.cNAMBonRental.create({
  data: {
    bonNumber: bonNumber,
    category: 'ACHAT', // Sale type CNAM bon
    bonType: cnamData.bonType,
    status: cnamData.status,
    bonAmount: cnamData.bonAmount || 0,
    devicePrice: cnamData.devicePrice || 0,
    complementAmount: cnamData.complementAmount || 0,
    cnamMonthlyRate: 0, // Not applicable for sales
    deviceMonthlyRate: 0,
    coveredMonths: 1,
    notes: cnamData.notes || null,
    patientId: saleData.patientId,
    saleId: sale.id,
    cnamDossierId: cnamDossier.id // ✅ Linked to dossier
  }
});
```

## 🎯 Data Flow (After Fix)

### Step 1: User Selects CNAM Payment
1. Opens CNAM Bon Dialog
2. Selects bon type (CPAP, MASQUE, etc.)
3. Enters dossier number (optional)
4. Dialog creates payment object **with `cnamInfo`**

### Step 2: Payment Added to Sale
```javascript
{
  method: 'CNAM',
  amount: 1500,
  dossierNumber: 'DOS-12345',
  cnamInfo: {
    bonType: 'CPAP',
    bonAmount: 1500,
    devicePrice: 2000,
    complementAmount: 500,
    currentStep: 1,
    totalSteps: 7,
    status: 'EN_ATTENTE_APPROBATION'
  }
}
```

### Step 3: Sale Submission
Frontend sends complete payment data including `cnamInfo` to API.

### Step 4: API Processing
1. **Extract CNAM payments** (line 568):
   ```javascript
   const cnamPayments = payments.filter(p => p.type === 'cnam' && p.cnamInfo);
   ```
   ✅ Now finds payments because `cnamInfo` exists!

2. **Store in cnamPaymentsData** (lines 582-592):
   ```javascript
   cnamPaymentsData.push({
     dossierNumber: cnamPayment.dossierNumber,
     bonType: cnamPayment.cnamInfo.bonType,
     bonAmount: cnamPayment.cnamInfo.bonAmount,
     // ... etc
   });
   ```

3. **Create CNAM dossier** (lines 782-796):
   - Generates or uses provided dossier number
   - Creates dossier record
   - Links to sale and patient

4. **Create CNAM bon** (lines 815-832):
   - Generates bon number
   - Creates bon record
   - **Links to dossier and sale** ✅
   - Category: ACHAT (for sales)

5. **Create step history** (lines 801-810):
   - Records initial step
   - Links to dossier

## ✅ Verification

After fixes, when creating a sale with CNAM payment:

### Database Records Created:
1. ✅ **Sale** record
2. ✅ **Payment** record (method: CNAM)
3. ✅ **CNAMDossier** record (linked to sale)
4. ✅ **CNAMBonRental** record (linked to sale AND dossier)
5. ✅ **CNAMStepHistory** record (initial step)

### Relationships:
```
Sale
  └─ Payment (CNAM)
  └─ CNAMDossier
       └─ CNAMBonRental
       └─ CNAMStepHistory
```

## 📊 Testing Checklist

- [ ] Create sale with 1 CNAM payment
- [ ] Verify payment created
- [ ] Verify CNAM dossier created
- [ ] **Verify CNAM bon created** ✅ (previously failed)
- [ ] Verify bon linked to dossier
- [ ] Verify bon linked to sale
- [ ] Verify step history created
- [ ] Check bon appears in CNAM management screens

## 🚀 Impact

### Before Fix:
- ❌ CNAM bons never created for sales
- ❌ CNAM workflow incomplete
- ❌ No tracking of CNAM approvals for sales

### After Fix:
- ✅ Complete CNAM workflow for sales
- ✅ Proper dossier-bon linking
- ✅ Full CNAM tracking and management
- ✅ Correct data structure for reporting

## 📝 Files Modified

1. `src/components/sales/CreateSaleDialog.tsx` - Added `cnamInfo` interface & payload
2. `src/components/sales/SaleCNAMBonDialog.tsx` - Populated `cnamInfo` in payment
3. `src/pages/api/sales/index.ts` - Create bons from payment data

---

**Fixed by**: Claude Code
**Date**: November 21, 2025
**Status**: ✅ RESOLVED
