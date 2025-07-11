# SaleStepperDialog – Sales Flow (Elite Santé)

---

## 📝 Quick Reference
- **Purpose:** Multi-step modal for managing sales (not diagnostics/rentals)
- **Location:** `src/pages/roles/admin/dashboard/components/SaleStepperDialog.tsx`
- **Core Steps:**
  1. Client Selection
  2. Product Selection/Creation
  3. Payment Configuration
- **Key Dialog:** `ProductDialog` (select from inventory)

---

## 🧭 Stepper Structure

| Step | Name                   | Component              | Key State/Dialogs                                     |
|------|------------------------|------------------------|-------------------------------------------------------|
| 1    | Type de Renseignement  | ClientSelectionStep    | `clientType`, `selectedClient`, `clients`, `isLoading`|
| 2    | Ajout Produits         | ProductSelectionStep   | `selectedProducts`, `productDialogOpen`, `isCreateFormOpen`, `currentProductType`<br>**Dialogs:** ProductDialog, MedicalDeviceForm, AccessoryForm, SparePartForm, DiagnosticDeviceForm |
| 3    | Ajout Paiement         | PaymentStep            | Uses `selectedClient`, `selectedProducts`, `calculateTotalPrice` |

---

## ⚙️ State Management
- `currentStep`: Active step (1–3)
- `clientType`: 'patient' or 'societe'
- `selectedClient`: ID of selected client
- `clientDetails`: Full client data
- `clients`: List of available clients
- `selectedProducts`: List of products in the sale
- `productDialogOpen`: Show/hide product selection dialog
- `isCreateFormOpen`: Show/hide product creation form
- `currentProductType`: Type for selection/creation ("medical-device", "accessory", "spare-part", "diagnostic")
- `isLoading`, `error`: For async fetches

---

## 🔗 Navigation & Handlers
- `handleNext` / `handleBack`: Step navigation
- `handleOpenProductDialog`: Open select dialog for given type
- `handleOpenCreateForm`: Open creation form for given type
- `handleProductSelect`: Add product to sale (from dialog/form)
- `handleRemoveProduct`: Remove product from sale
- `handleUpdateProduct`: Edit product details
- `handlePaymentComplete`: Finalize payment and close dialog

---

## 🗂️ Key Components
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`: Modal wrappers
- `SaleStepperSidebar`: Step navigation/summary
- `ClientSelectionStep`: Client choice
- `ProductSelectionStep`: Product choice/creation
- `PaymentStep`: Payment details
- `ProductDialog`: **Inventory selection modal** (see below)
- `MedicalDeviceForm`, `AccessoryForm`, `SparePartForm`, `DiagnosticDeviceForm`: Creation forms
- `toast`: Notifications/errors

---

## 📦 ProductDialog – Deep Dive

**Purpose:**
- Modal for browsing, filtering, and selecting products from inventory for sales
- Handles: `"medical-device"`, `"accessory"`, `"spare-part"`, `"diagnostic"`

**Features:**
- Fetches stock locations (filter)
- Fetches products by type:
  - `"medical-device"`/`"diagnostic"`: `/api/medical-devices`
  - `"accessory"`/`"spare-part"`: `/api/products`
- Filter by stock location and search
- Product cards show: name, brand, model, serial, location, price, stock, status (badges)
- `onSelect(product)`: Sends selection to parent

**Props:**
```ts
interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "medical-device" | "accessory" | "spare-part" | "diagnostic";
  onSelect: (product: any) => void;
}
```

**Fetch Example:**
```ts
if (type === "medical-device") fetch("/api/medical-devices?type=MEDICAL_DEVICE")
else if (type === "diagnostic") fetch("/api/medical-devices?type=DIAGNOSTIC_DEVICE")
else if (type === "accessory") fetch("/api/products?type=ACCESSORY")
else if (type === "spare-part") fetch("/api/products?type=SPARE_PART")
```

---

## 🏁 Notes
- **Sales only**: Diagnostics/rentals use different dialogs
- All API calls have error handling/toasts
- Highly interactive: step, dialog, and form visibility all managed by state

## Key Components Used
- **Dialog/DialogContent/DialogHeader/DialogTitle**: UI wrappers for modal display
- **SaleStepperSidebar**: Sidebar navigation for steps and summary
- **ClientSelectionStep**: Handles client type and client selection
- **ProductSelectionStep**: Handles product selection and creation dialogs
- **PaymentStep**: Handles payment details and completion
- **ProductDialog**: Modal for selecting products from stock (see deep-dive below)
- **MedicalDeviceForm**, **AccessoryForm**, **SparePartForm**, **DiagnosticDeviceForm**: Modals for creating new products
- **toast**: For user notifications/errors

---

## State Management
- **currentStep**: Tracks the current step (1-3)
- **clientType**: 'patient' or 'societe' (company)
- **selectedClient**: ID of the selected client
- **clientDetails**: Full client data
- **clients**: List of available clients
- **selectedProducts**: List of products selected/created in the stepper
- **productDialogOpen**: Controls visibility of the product selection dialog
- **isCreateFormOpen**: Controls visibility of the product creation dialog
- **currentProductType**: Type of product being created/selected ("medical-device", "accessory", "spare-part", "diagnostic")
- **isLoading/error**: For client data fetching

---

## Data Fetching
- Uses `@tanstack/react-query` to fetch stock locations for product forms
- Fetches client lists dynamically based on client type
- Fetches products by type for ProductDialog (see below)

---

## Step Navigation
- **handleNext/handleBack**: Move between steps
- **handleOpenProductDialog**: Opens the product selection dialog for a given type (sets `currentProductType` and opens `productDialogOpen`)
- **handleOpenCreateForm**: Opens the creation form dialog for a given type
- **handleProductSelect**: Adds a product to the selection (from dialog or creation form)
- **handleRemoveProduct**: Removes a product from the selection
- **handleUpdateProduct**: Updates product details in the selection
- **handlePaymentComplete**: Handles final payment submission and closes the dialog

---

## Dialogs and Forms
- The component can open two types of dialogs in the product step:
  - **ProductDialog**: For picking from existing inventory (deep-dive below)
  - **Create Form Dialog**: For creating a new product (type-dependent form)

---

## Extensibility
- The stepper is easily extensible for new product types or additional steps
- All forms and dialogs are modular and can be swapped or extended as needed

---

## Summary Table
| Step | Name                 | Component              | Dialogs/Forms Involved                  |
|------|----------------------|------------------------|-----------------------------------------|
| 1    | Type de Renseignement| ClientSelectionStep    | -                                       |
| 2    | Ajout Produits       | ProductSelectionStep   | ProductDialog, MedicalDeviceForm, etc.  |
| 3    | Ajout Paiement       | PaymentStep            | -                                       |

---

## File Location
`src/pages/roles/admin/dashboard/components/SaleStepperDialog.tsx`

---

## Related Components/Files
- `steps/ClientSelectionStep.tsx`
- `steps/ProductSelectionStep.tsx`
- `steps/PaymentStep.tsx`
- `dialogs/ProductDialog.tsx`
- `appareils/components/forms/MedicalDeviceForm.tsx`
- `appareils/components/forms/AccessoryForm.tsx`
- `appareils/components/forms/SparePartForm.tsx`
- `appareils/components/forms/DiagnosticDeviceForm.tsx`
- `SaleStepperSidebar.tsx`

---

## ProductDialog Deep Dive

### Purpose
- Modal dialog for browsing, searching, and selecting products from inventory for sales.
- Handles multiple types: `"medical-device"`, `"accessory"`, `"spare-part"`, `"diagnostic"`.

### Key Features
- Fetches stock locations for filtering (via react-query).
- Fetches products by type:
  - `"medical-device"` and `"diagnostic"`: fetched from `/api/medical-devices`
  - `"accessory"` and `"spare-part"`: fetched from `/api/products`
- Filtering: Can filter by stock location and search query.
- UI: Each product shown in a card with:
  - Name, brand, model, serial number
  - Stock location
  - Price
  - Stock quantity
  - Status (Disponible, Réservé, etc.) with colored badges
- Selection: Clicking a product calls `onSelect(product)`, which passes the product back to the parent dialog.

### Props
```ts
interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: "medical-device" | "accessory" | "spare-part" | "diagnostic";
  onSelect: (product: any) => void;
}
```

### Fetch Logic Example
```ts
if (type === "medical-device") {
  fetch("/api/medical-devices?type=MEDICAL_DEVICE")
}
else if (type === "diagnostic") {
  fetch("/api/medical-devices?type=DIAGNOSTIC_DEVICE")
}
else if (type === "accessory") {
  fetch("/api/products?type=ACCESSORY")
}
else if (type === "spare-part") {
  fetch("/api/products?type=SPARE_PART")
}
```

---

