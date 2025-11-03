# Sales System - Complete Documentation

**Last Updated:** 2025-01-30
**System Version:** Espace Elite Medical Equipment Management
**Module:** Sales & Inventory Management

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Structure](#database-structure)
3. [Sales Flow](#sales-flow)
4. [Stock Management](#stock-management)
5. [Role-Based Access](#role-based-access)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Features Implemented](#features-implemented)
9. [User Workflows](#user-workflows)

---

## System Overview

The Sales System manages the complete lifecycle of medical equipment sales, from inventory tracking to final sale and post-sale service tracking.

### Key Capabilities

- ✅ **Multi-type Sales**: Products (consumables) and Medical Devices (unique items)
- ✅ **Stock Management**: Real-time inventory tracking across multiple locations
- ✅ **Role-Based Access**: Admin and Employee workflows with different permissions
- ✅ **Device Configuration**: Track device parameters at time of sale
- ✅ **Post-Sale Tracking**: Know where each device is located for maintenance
- ✅ **Stock Traceability**: Track which stock location items came from

---

## Database Structure

### Core Models

#### **Sale**
```prisma
model Sale {
  id            String          @id @default(cuid())
  saleCode      String?         @unique
  invoiceNumber String?         @unique
  saleDate      DateTime
  totalAmount   Decimal         @db.Decimal(10, 2)
  finalAmount   Decimal         @db.Decimal(10, 2)
  discount      Decimal?        @db.Decimal(10, 2)
  paymentStatus PaymentStatus   @default(PENDING)
  status        SaleStatus      @default(PENDING)

  // Relations
  patientId     String?
  companyId     String?
  assignedToId  String          // Who made the sale (Employee/Admin)
  createdById   String

  items         SaleItem[]
  payments      Payment[]
}
```

#### **SaleItem**
```prisma
model SaleItem {
  id              String             @id @default(cuid())
  saleId          String

  // Item can be either a product OR a medical device
  productId       String?            // For consumables (masks, tubes, etc.)
  medicalDeviceId String?            // For unique devices (CPAP, VNI, etc.)

  quantity        Int
  unitPrice       Decimal            @db.Decimal(10, 2)
  discount        Decimal?           @db.Decimal(10, 2)
  itemTotal       Decimal            @db.Decimal(10, 2)

  serialNumber    String?
  description     String?

  // Relations
  sale            Sale               @relation(fields: [saleId], references: [id])
  product         Product?           @relation(fields: [productId], references: [id])
  medicalDevice   MedicalDevice?     @relation(fields: [medicalDeviceId], references: [id])
  configuration   SaleConfiguration? // Device parameters at time of sale
}
```

#### **Stock**
```prisma
model Stock {
  id         String        @id @default(cuid())
  locationId String        // Which stock location
  productId  String        // Which product
  quantity   Int           // Available quantity
  status     StockStatus   @default(FOR_SALE)

  @@unique([locationId, productId]) // One stock entry per product per location
}
```

#### **MedicalDevice**
```prisma
model MedicalDevice {
  id                  String         @id @default(cuid())
  deviceCode          String?        @unique
  name                String
  serialNumber        String?
  type                String

  // Stock tracking
  stockLocationId     String?        // Current location (null when sold)
  destination         StockStatus    @default(FOR_SALE) // FOR_SALE, SOLD, RENTED, etc.
  status              DeviceStatus   @default(ACTIVE)

  // Pricing
  purchasePrice       Decimal?       @db.Decimal(10, 2)
  sellingPrice        Decimal?       @db.Decimal(10, 2)
  rentalPrice         Decimal?       @db.Decimal(10, 2)
}
```

---

## Sales Flow

### Complete Sale Process

```
┌─────────────────────────────────────────────────────────────────┐
│                        SALES WORKFLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. CREATE SALE
   ├─ Select Client (Patient or Company)
   ├─ Generate Sale Code (SAL-XXXX)
   ├─ Set Sale Date
   └─ Create Sale Record

2. ADD ARTICLES
   ├─ FOR PRODUCTS (Accessories/Spare Parts)
   │  ├─ Select Product
   │  ├─ [ADMIN] Select Stock Location
   │  ├─ [EMPLOYEE] Auto-use Employee's Stock
   │  ├─ Check Stock Availability
   │  ├─ Set Quantity, Price, Discount
   │  └─ Create SaleItem
   │     └─ Stock.quantity -= quantity
   │
   └─ FOR MEDICAL DEVICES
      ├─ Select Device
      ├─ Check Not Already Sold
      ├─ Configure Device Parameters (optional)
      ├─ Set Price, Discount
      └─ Create SaleItem
         └─ MedicalDevice:
            ├─ destination = SOLD
            └─ stockLocationId = null

3. PAYMENT
   ├─ Multiple Payment Types Supported
   ├─ Partial Payments Allowed
   └─ Track Payment Status

4. FINALIZE
   ├─ Generate Invoice Number
   ├─ Update Sale Status
   └─ Print/Export Documents
```

---

## Stock Management

### How Stock is Tracked

#### **For Products (Consumables)**

Products have **quantities** across multiple stock locations:

```typescript
// Example: Masks in different locations
Stock {
  locationId: "bureau-location-id"
  productId: "mask-product-id"
  quantity: 50  // 50 masks available at Bureau
}

Stock {
  locationId: "employee1-location-id"
  productId: "mask-product-id"
  quantity: 20  // 20 masks with Employee 1
}
```

**When Selling:**
1. Admin selects which stock location to use
2. Employee automatically uses their stock
3. System checks: `Stock.quantity >= requested quantity`
4. On success: `Stock.quantity -= sold quantity`

#### **For Medical Devices (Unique Items)**

Each device is a **unique item** with serial number:

```typescript
MedicalDevice {
  deviceCode: "APP0019"
  serialNumber: "22112009902"
  stockLocationId: "bureau-location-id"  // Currently at Bureau
  destination: "FOR_SALE"                 // Available for sale
}
```

**When Selling:**
1. Check device is not already sold: `destination !== "SOLD"`
2. Create sale item
3. Update device:
   ```typescript
   MedicalDevice.update({
     destination: "SOLD",
     stockLocationId: null  // No longer in our inventory
   })
   ```

### Stock Location Display

**When viewing sold articles:**

| Article Type | Stock Column Display |
|--------------|---------------------|
| Product | `Sortie de: Bureau` |
| Medical Device | `Sortie de: Stock Technicien` |

Shows which stock location the item came from (based on who sold it).

---

## Role-Based Access

### ADMIN

**Capabilities:**
- ✅ View all sales (all employees)
- ✅ Create sales from any stock location
- ✅ Select stock location when adding products
- ✅ See stock availability across all locations
- ✅ Manage all inventory

**Stock Selection:**
```
When adding a product:
┌──────────────────────────────────┐
│ Stock: [Bureau ▼]                │ ← Admin can select
│        ├ Bureau (default)        │
│        ├ Entrepôt                │
│        └ Stock Technicien        │
│                                  │
│ Disponible: 15                   │
└──────────────────────────────────┘
```

### EMPLOYEE

**Capabilities:**
- ✅ View only their own sales
- ✅ Create sales using their stock location only
- ✅ See their stock availability
- ❌ Cannot select different stock locations

**Stock Selection:**
```
When adding a product:
Stock location is automatic (employee's assigned location)
No selector shown
```

---

## API Endpoints

### Sale Items Management

#### **GET /api/sale-items**
Fetch all sale items with full details.

**Response:**
```json
{
  "items": [
    {
      "id": "item-id",
      "saleId": "sale-id",
      "productId": "product-id",
      "quantity": 5,
      "unitPrice": 20.00,
      "discount": 0,
      "itemTotal": 100.00,
      "sale": {
        "saleCode": "SAL-0001",
        "invoiceNumber": "FACTURE-2025-0001",
        "assignedTo": {
          "firstName": "Mohamed",
          "lastName": "Ali",
          "stockLocation": {
            "name": "Bureau"
          }
        }
      },
      "product": {
        "name": "Masque nasal",
        "productCode": "ACC-003"
      }
    }
  ]
}
```

#### **POST /api/sale-items**
Create a new sale item.

**Request Body:**
```json
{
  "saleId": "sale-id",
  "productId": "product-id",        // OR medicalDeviceId
  "medicalDeviceId": null,
  "quantity": 5,
  "unitPrice": 20.00,
  "discount": 0,
  "itemTotal": 100.00,
  "description": "Optional note",
  "stockLocationId": "location-id", // For admin, optional for employee
  "parameters": {                    // For medical devices only
    "pression": "10",
    "epr": "3"
  }
}
```

**Backend Logic:**
1. Get user info to determine role and stock location
2. Validate stock availability (for products)
3. Check device not already sold (for devices)
4. Create sale item
5. Update stock quantity (products) OR device status (devices)
6. Update sale total

**Response:**
```json
{
  "message": "Article créé avec succès",
  "item": { /* created item */ }
}
```

#### **PUT /api/sale-items/[id]**
Update an existing sale item.

**Supports:**
- Changing quantity, price, discount
- Changing product/device selection
- Changing client (via sale change)
- Updating device configuration

#### **DELETE /api/sale-items/[id]**
Delete a sale item and restore stock.

**Backend Logic:**
1. Get item details before deletion
2. Restore product stock (increment quantity)
3. Restore device to FOR_SALE status
4. Update sale total
5. Delete item

---

## Frontend Components

### ArticlesExcelTable Component

**Location:** `src/pages/roles/admin/sales/components/ArticlesExcelTable.tsx`

**Features:**
- ✅ Excel-style table display
- ✅ Inline editing
- ✅ Real-time stock availability
- ✅ Role-based UI (admin vs employee)
- ✅ Article selection dialog
- ✅ Device parameter configuration
- ✅ Stock location tracking

**Table Columns:**
```
Code Vente | Facture | Client | Type | Article | N° Série | Description | Stock | Config | Qté | Prix U. | Remise | Total | Actions
```

**Stock Column Display:**

**For New Articles (Admin adding product):**
```jsx
<Select value={stockLocationId}>
  <SelectTrigger>Stock Location</SelectTrigger>
  <SelectContent>
    {stockLocations.map(loc => (
      <SelectItem value={loc.id}>{loc.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
<div>Disponible: {availableStock}</div>
```

**For Existing Articles:**
```jsx
<div>
  <span>Sortie de:</span>
  <span>{article.sale.assignedTo.stockLocation.name}</span>
</div>
```

---

## Features Implemented

### ✅ Article Management
- [x] Add articles to sales (products and devices)
- [x] Edit article details (quantity, price, discount, description)
- [x] Change article selection (product/device)
- [x] Change client/sale assignment
- [x] Delete articles (with stock restoration)
- [x] Device code badges display
- [x] Real-time total calculation

### ✅ Stock Management
- [x] Role-based stock location selection
- [x] Admin can select any stock location
- [x] Employee uses their stock automatically
- [x] Real-time stock availability display
- [x] Stock validation before selling
- [x] Automatic stock decrease on sale
- [x] Automatic stock restore on deletion
- [x] Stock traceability (shows source location)

### ✅ Device Management
- [x] Check device not already sold
- [x] Update device status on sale (SOLD)
- [x] Remove device from stock location when sold
- [x] Keep device ACTIVE for maintenance tracking
- [x] Device parameter configuration
- [x] Parameter display in table

### ✅ User Experience
- [x] Excel-style table interface
- [x] Color-coded badges for types
- [x] Inline editing
- [x] Search and filtering
- [x] Pagination
- [x] Success/error toast notifications
- [x] Loading states

---

## User Workflows

### Admin Workflow: Add Product to Sale

```
1. Navigate to /roles/admin/sales
2. Click "Articles" tab
3. Click "+ Ajouter Article"
4. Select Client → Select Sale
5. Click "Sélectionner Article"
6. Choose a Product (e.g., ACC-003 - Masque)
7. Stock dropdown appears (default: Admin's location)
8. Change stock location if needed
9. See available quantity: "Disponible: 15"
10. Enter quantity (5), price (20 DT), discount
11. Add description if needed
12. Click Save
13. ✅ Article added, stock decreased
```

### Admin Workflow: Add Medical Device to Sale

```
1-5. Same as above
6. Choose a Medical Device (e.g., APP0019 - VNI)
7. Stock column shows "-" (not needed)
8. Click "Config" button to set parameters
9. Set IPAP, EPAP, Mode, etc.
10. Click Save in parameter dialog
11. Enter price, discount
12. Click Save
13. ✅ Device sold, marked as SOLD, removed from inventory
```

### Employee Workflow: Add Product to Sale

```
1. Navigate to /roles/employee/sales
2-6. Same selection process
7. Stock is automatically employee's location (no selector)
8. See available quantity from employee's stock
9-13. Same as admin
```

### Viewing Sales History

**Admin:**
- See all sales from all employees
- Stock column shows: "Sortie de: [Employee's Stock Location]"
- Example: "Sortie de: Bureau" or "Sortie de: Stock Technicien"

**Employee:**
- See only their own sales
- Stock column shows: "Sortie de: [Their Stock Location]"

---

## Technical Notes

### Stock Restoration on Delete

When deleting a sale item:
```typescript
// For products
await prisma.stock.upsert({
  where: { locationId_productId: {...} },
  update: { quantity: { increment: deletedQuantity } },
  create: { quantity: deletedQuantity, ... }
})

// For devices
await prisma.medicalDevice.update({
  where: { id: deviceId },
  data: {
    destination: 'FOR_SALE',
    stockLocationId: userStockLocationId
  }
})
```

### Device Tracking After Sale

Even after sold, devices remain in system for:
- ✅ Maintenance scheduling
- ✅ Spare parts sales (know what patient needs)
- ✅ Service history
- ✅ Future business opportunities

Query patient's devices:
```typescript
const patientDevices = await prisma.saleItem.findMany({
  where: {
    sale: { patientId: "patient-id" },
    medicalDeviceId: { not: null }
  },
  include: { medicalDevice: true }
})
```

---

## Future Enhancements

### Planned Features
- [ ] Bulk import from Excel
- [ ] Stock transfer between locations
- [ ] Low stock alerts
- [ ] Sales analytics dashboard
- [ ] Return/exchange management
- [ ] Warranty tracking
- [ ] Service call integration

---

## Troubleshooting

### Common Issues

**Issue:** Stock shows 0 but items exist
**Solution:** Check if stock is at correct location for the user

**Issue:** Cannot add medical device
**Solution:** Ensure device destination is FOR_SALE, not SOLD or RENTED

**Issue:** Stock not decreasing
**Solution:** Verify stockLocationId is being sent in request

**Issue:** Admin cannot see employee sales
**Solution:** Check sale.assignedToId is set correctly

---

## API Error Codes

| Code | Message | Cause |
|------|---------|-------|
| 400 | Stock insuffisant | Not enough quantity in selected location |
| 400 | Cet appareil a déjà été vendu | Device already has destination=SOLD |
| 400 | Emplacement de stock non trouvé | User has no assigned stock location |
| 401 | Non autorisé | Not authenticated |
| 404 | Article non trouvé | Sale item doesn't exist |
| 500 | Erreur serveur | Database or server error |

---

**End of Documentation**

*For questions or issues, contact the development team.*
