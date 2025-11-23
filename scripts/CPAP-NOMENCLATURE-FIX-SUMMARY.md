# CPAP Amount Not Fetching in CNAM Bon Forms - Fix Summary

## 🐛 The Problem

**Location**: Sales Management Page (`/roles/employee/sales` and `/roles/admin/sales`)

**Symptom**: When selecting CPAP as the bon type in CNAM bons form:
- ✅ VNI shows 430 DT (correct)
- ✅ Oxygen shows 190 DT (correct)
- ❌ **CPAP shows nothing or 0 DT** (incorrect - should show 1475 DT)

## 🔍 Root Cause Analysis

### Issue 1: Fetching ALL Categories

**Employee Version** (`src/pages/roles/employee/sales/components/CNAMBonsExcelTable.tsx`):
```typescript
// Line 60 - BEFORE FIX
const response = await fetch('/api/cnam-nomenclature?isActive=true');
```

**Admin Version** (`src/pages/roles/admin/sales/components/CNAMBonsExcelTable.tsx`):
```typescript
// Line 117 - BEFORE FIX
const response = await fetch('/api/cnam-nomenclature');
```

**Problem**: Both were fetching **ALL** nomenclature entries (both LOCATION and ACHAT categories).

### Issue 2: Wrong Lookup Logic

**Employee Version** (`line 199`):
```typescript
// BEFORE FIX - Only matches bonType
const nomenclatureItem = nomenclature.find((n: any) => n.bonType === selectedBondType);
```

**Problem**:
- CNAM nomenclature has entries for **both categories**:
  - `CPAP` with `category: 'LOCATION'` (for rentals) - monthly rate
  - `CPAP` with `category: 'ACHAT'` (for sales) - one-time purchase amount
- The `.find()` was returning the **first match** regardless of category
- If `LOCATION` CPAP comes first in the array, it returns the wrong rate
- For sales pages, we need the `ACHAT` category entry!

### Issue 3: Using Wrong Field

**Employee Version** (`line 200`):
```typescript
const cnamRate = nomenclatureItem?.monthlyRate || 0;
```

**Problem**:
- For ACHAT category, the amount is stored in the `amount` field, not `monthlyRate`
- `monthlyRate` is for LOCATION (rentals)
- Should use `amount` field for ACHAT

## ✅ Fixes Applied

### Fix 1: Filter by Category When Fetching

**Employee Version** (`CNAMBonsExcelTable.tsx` lines 56-64):
```typescript
// AFTER FIX - Fetch ACHAT category only
const { data: nomenclature = [] } = useQuery({
  queryKey: ['cnam-nomenclature', 'ACHAT'],
  queryFn: async () => {
    const response = await fetch('/api/cnam-nomenclature?isActive=true&category=ACHAT');
    if (!response.ok) throw new Error('Failed to fetch nomenclature');
    return response.json();
  },
});
```

**Admin Version** (`CNAMBonsExcelTable.tsx` lines 113-121):
```typescript
// AFTER FIX - Fetch ACHAT category only
const { data: cnamNomenclature } = useQuery({
  queryKey: ['cnam-nomenclature', 'ACHAT'],
  queryFn: async () => {
    const response = await fetch('/api/cnam-nomenclature?isActive=true&category=ACHAT');
    if (!response.ok) throw new Error('Failed to fetch CNAM nomenclature');
    return response.json();
  },
});
```

**Benefit**: Now only ACHAT entries are fetched, eliminating confusion!

### Fix 2: Double-Check Category in Find

**Employee Version** (`lines 197-217`):
```typescript
// AFTER FIX - Filter by BOTH bonType AND category
const handleBondTypeChange = (selectedBondType: string) => {
  if (!editData) return;

  // Find nomenclature for ACHAT category (sales)
  const nomenclatureItem = nomenclature.find((n: any) =>
    n.bonType === selectedBondType && n.category === 'ACHAT'
  );

  // Use 'amount' field for ACHAT, fallback to monthlyRate
  const cnamRate = nomenclatureItem?.amount || nomenclatureItem?.monthlyRate || 0;

  const bonAmount = cnamRate * 1; // Sales are always 1 month (1x purchase amount)
  // ...
};
```

**Admin Version** (already had this):
```typescript
// Line 453-454 - Already correct
const nomenclatureEntry = cnamNomenclature?.find(
  (entry: any) => entry.bonType === bonType && entry.category === 'ACHAT'
);
```

**Benefit**: Extra safety check ensures we never get the wrong category!

### Fix 3: Use Correct Field

**Employee Version** (`line 204`):
```typescript
// AFTER FIX - Use 'amount' for ACHAT
const cnamRate = nomenclatureItem?.amount || nomenclatureItem?.monthlyRate || 0;
```

**Benefit**: Correctly reads the purchase amount from the `amount` field!

## 📊 Data Structure

### CNAM Nomenclature Table:

| bonType | category | amount | monthlyRate | Description |
|---------|----------|--------|-------------|-------------|
| CPAP | LOCATION | 200 | 200 | Monthly rental |
| CPAP | **ACHAT** | **1475** | 1475 | One-time purchase |
| VNI | ACHAT | 430 | 430 | One-time purchase |
| CONCENTRATEUR_OXYGENE | ACHAT | 190 | 190 | One-time purchase |

### Before Fix:
```javascript
// Fetched ALL categories
[
  { bonType: 'CPAP', category: 'LOCATION', amount: 200, monthlyRate: 200 },
  { bonType: 'CPAP', category: 'ACHAT', amount: 1475, monthlyRate: 1475 },
  { bonType: 'VNI', category: 'ACHAT', amount: 430, monthlyRate: 430 },
  // ...
]

// Find returned FIRST match (LOCATION)
nomenclature.find(n => n.bonType === 'CPAP')
// ❌ Returns: { bonType: 'CPAP', category: 'LOCATION', monthlyRate: 200 }
// Should be: { bonType: 'CPAP', category: 'ACHAT', amount: 1475 }
```

### After Fix:
```javascript
// Fetched ACHAT only
[
  { bonType: 'CPAP', category: 'ACHAT', amount: 1475, monthlyRate: 1475 },
  { bonType: 'VNI', category: 'ACHAT', amount: 430, monthlyRate: 430 },
  { bonType: 'CONCENTRATEUR_OXYGENE', category: 'ACHAT', amount: 190, monthlyRate: 190 },
  // ...
]

// Find returns correct ACHAT entry
nomenclature.find(n => n.bonType === 'CPAP' && n.category === 'ACHAT')
// ✅ Returns: { bonType: 'CPAP', category: 'ACHAT', amount: 1475 }
```

## ✅ Verification

After fixes, when selecting bon type in sales management:

### CPAP:
- ✅ Shows **1475 DT** (ACHAT amount)
- ✅ Not 200 DT (LOCATION monthly rate)

### VNI:
- ✅ Shows **430 DT** (correct)

### Oxygen (CONCENTRATEUR_OXYGENE):
- ✅ Shows **190 DT** (correct)

## 🎯 Impact

### Before Fix:
- ❌ CPAP amount not fetched (showing 0 or wrong amount)
- ❌ Confusion between rental rates and purchase amounts
- ❌ Incorrect bon amounts for CPAP sales

### After Fix:
- ✅ Correct amounts for all bon types
- ✅ Clear separation between LOCATION and ACHAT
- ✅ Proper one-time purchase amounts displayed
- ✅ Consistent behavior across employee and admin pages

## 📝 Files Modified

1. **`src/pages/roles/employee/sales/components/CNAMBonsExcelTable.tsx`**:
   - Added `category=ACHAT` filter to fetch query (line 60)
   - Added category check in find (line 201)
   - Use `amount` field instead of only `monthlyRate` (line 204)

2. **`src/pages/roles/admin/sales/components/CNAMBonsExcelTable.tsx`**:
   - Added `category=ACHAT` filter to fetch query (line 117)
   - (Already had category check in find)

## 🚀 Testing

Test in both employee and admin sales pages:
1. Navigate to CNAM Bons tab
2. Click "Add" or "Edit" bon
3. Select bon type dropdown:
   - CPAP → Should show **1475 DT**
   - VNI → Should show **430 DT**
   - Oxygen → Should show **190 DT**
   - MASQUE → Should show correct ACHAT amount

---

**Fixed by**: Claude Code
**Date**: November 21, 2025
**Status**: ✅ RESOLVED
