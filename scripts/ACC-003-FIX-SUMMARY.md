# ACC-003 Stock Status Bug - Investigation & Fix Summary

## 🐛 The Problem

When selling an accessory (ACC-003), after the sale the product was not visible in the employee's stock location inventory, even after adjusting the quantity from the admin panel.

## 🔍 Investigation Results

### Product Information:
- **Product Code**: ACC-003
- **Name**: Masque Nasal Test
- **Type**: ACCESSORY
- **Stock Location**: Stock Karim (Employee)
- **Quantity**: 19 units (after admin adjustment)
- **Status**: ❌ **SOLD** (This was the problem!)

### Sales History:
- Only **1 unit** was sold (Sale Code: SAL-1169)
- Customer: NOUREDDINE ABBES
- Date: Fri Nov 21 2025 22:06:57

### Timeline:
1. **Product created** at 21:31:29 with initial quantity
2. **Sale made** at 22:06:57 → 1 unit sold
3. **Admin adjusted** quantity to 19 at 22:22:24
4. **Problem**: Status remained "SOLD" even though quantity > 0

## 🎯 Root Cause

**The stock status was set to "SOLD" and wasn't automatically updated to "FOR_SALE" when the admin adjusted the quantity.**

### Why wasn't it visible?

When employees fetch their inventory, the API filters products by:
- ✅ Stock location matches employee's location
- ✅ Quantity > 0
- ❌ **Status = 'FOR_SALE'** (ACC-003 had status 'SOLD')

The filtering logic in `/api/products?type=ACCESSORY&inStock=true&assignedToMe=true` excludes products with status "SOLD" or "OUT_OF_STOCK".

## 🔧 Fixes Applied

### 1. Immediate Fix (Manual)
**Script**: `scripts/fix-acc-003-status.js`

```javascript
// Updated the stock status from SOLD → FOR_SALE
await prisma.stock.update({
  where: { id: 'cmi9bfjsi0001xi6gvcwt5xv3' },
  data: {
    status: 'FOR_SALE' // Changed from SOLD
  }
});
```

**Result**: ✅ ACC-003 is now visible in Karim's inventory

### 2. Permanent Fix (Code)
**File**: `src/pages/api/stocks/[id].ts` (Lines 50-63)

**Added automatic status update based on quantity:**

```javascript
if (quantity !== undefined) {
  const newQuantity = parseInt(quantity.toString());
  updateData.quantity = newQuantity;

  // Auto-update status based on quantity
  if (!status) { // Only if status not explicitly provided
    if (newQuantity > 0) {
      updateData.status = 'FOR_SALE';
    } else {
      updateData.status = 'OUT_OF_STOCK';
    }
  }
}
```

**Behavior**:
- When admin adjusts quantity to > 0 → Status automatically becomes "FOR_SALE"
- When quantity becomes 0 → Status automatically becomes "OUT_OF_STOCK"
- Admin can still manually override status if needed

## ✅ Verification

After fixes:
```
Stock Entry:
  Quantity: 19
  Status: FOR_SALE ✅
  Location: Stock Karim
  Visible to Employee: YES ✅
```

## 📊 Impact

### Before Fix:
- ❌ Sold accessories with adjusted quantities were invisible
- ❌ Admin had to manually update both quantity AND status
- ❌ Employees couldn't see available stock

### After Fix:
- ✅ Sold accessories become visible when quantity > 0
- ✅ Status updates automatically with quantity
- ✅ Employees see correct inventory

## 🚀 Prevention

The sales API already handles status correctly:
```javascript
// In /api/sales/index.ts line 749
status: newQuantity === 0 ? 'SOLD' : stockRecord.status
```

This only sets status to SOLD when quantity reaches exactly 0.

The bug was specifically in the **admin stock adjustment** flow, which is now fixed.

## 📝 Scripts Created

1. **investigate-accessory.js** - Full product investigation script
   - Shows product info, stock, sales history, movements
   - Useful for debugging stock issues

2. **fix-acc-003-status.js** - One-time fix script
   - Fixed the specific ACC-003 issue
   - Can be adapted for other products if needed

## 🎯 Conclusion

✅ **ACC-003 is now visible** in the employee inventory
✅ **Future stock adjustments** will automatically update status
✅ **No more invisible products** after sales with quantity adjustments

---

**Fixed by**: Claude Code
**Date**: November 21, 2025
**Status**: ✅ RESOLVED
