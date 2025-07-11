# PaymentStep System Scan & Documentation

## Overview
The `PaymentStep` component is a central step in both the **Sale** and **Rental** steppers, handling all payment-related logic and UI for the Espace Elite application. It integrates with a robust payment API for saving and managing transactions.

- **Location:** `src/components/steps/PaymentStep.tsx`
- **Used in:**
  - SaleStepperDialog (`src/pages/roles/admin/dashboard/components/SaleStepperDialog.tsx`)
  - RentStepperDialog (`src/pages/roles/admin/dashboard/components/RentStepperDialog.tsx`)
  *Note: The diagnostic stepper's final step has been refocused on "Création de Tâches" and no longer uses this PaymentStep directly.*

---

## Main Features
- **Multiple payment types:** Espèces, Chèque, Virement, Mandat, CNAM (insurance), Traite
- **Partial and complete payments** (save & continue later), with robust validation and transformation utilities (`validatePaymentData`, `transformPaymentData`)
- **Handles CNAM (insurance) logic**: pending status, summary, details, including tracking `isFinanciallyComplete` and `hasPendingCNAM` statuses
- **Aggregates payments by method** with icons, timestamps, and details
- **Print receipt** (browser print dialog)
- **Dynamic dialog** for adding/editing payments (SSR-safe)
- **Action buttons:** Print, save partial, add/modify payment, finalize payment

---

## Component Structure
- **PaymentStep**: Main step component, manages payment state and aggregates data
- **PaymentDialog** (dynamically imported): Modal for adding/editing payments
  - **Uses PaymentProvider context** for state management
  - **Tabs:** Payment type selection & summary
  - **PaymentTypeCard:** Card for each payment method
  - **PaymentSummary:** Shows all added payments
  - **CNAMStepTracker:** For insurance-specific flows
  - **Dynamic form rendering** based on selected type
- **Utilities & Types:** Uses `PaymentData` type, `cn` utility, icons from `lucide-react`

---

## Integration Points
- **Props required:**
  - `onBack`, `onComplete`, `selectedClient`, `selectedProducts`, `calculateTotal`, `isRental`
- **Sale Stepper:** PaymentStep is step 3 ("Ajout Paiement")
- **Rental Stepper:** PaymentStep is step 4 ("Ajout Paiement")

---

## Feature Checklist
| Feature                       | Status | Notes                                      |
|-------------------------------|:------:|---------------------------------------------|
| Multiple payment types        |   ✅   | All common types present                    |
| Partial payment support       |   ✅   | Save and continue later                     |
| CNAM (insurance) logic        |   ✅   | Pending status, summary, details            |
| Print receipt                 |   ✅   | Calls `window.print()`                      |
| Add/Edit payment dialog       |   ✅   | Dynamic, SSR-safe, context-managed          |
| Payment summary UI            |   ✅   | Grouped by method, with icons/timestamps    |
| Finalize payment              |   ✅   | Button appears only when complete           |
| Integration with steppers     |   ✅   | Used in both Sale and Rental dialogs        |

---

## Known Issues & Observations
- **No obvious broken logic** in PaymentStep or PaymentDialog
- **CNAM logic, grouping, and dynamic form rendering appear robust**
- **Print logic is basic** (browser print dialog only)
- **All required props are documented and checked**
- **No SSR issues** due to dynamic import
- **No missing imports or undefined variables**
- **No extra context required**; all state is managed via props or internal context

---

## Related Components
- `@/components/payment/components/PaymentDialog`
- `@/components/payment/components/PaymentTypeCard`
- `@/components/payment/components/PaymentSummary`
- `@/components/payment/components/CNAMStepTracker`
- `@/components/payment/paymentForms` (for PaymentData type)

---

## Usage Example (from RentStepperDialog)
```tsx
{currentStep === 4 && (
  <PaymentStep
    onBack={handleBack}
    onComplete={handlePaymentComplete}
    selectedClient={clientDetails}
    selectedProducts={selectedProducts}
    calculateTotal={calculateTotalPrice}
    isRental={true}
  />
)}
```

---

## Stepper Logic and Flow Analysis

This section details the investigation into the payment stepper's behavior, specifically regarding the process after a payment is saved.

### User-Reported Issue

The user observed that after adding any type of payment, the main sales stepper dialog closes entirely, instead of returning to the payment summary screen within the stepper. The expectation was to see a summary of the payment and then manually proceed to a final recap of the entire sale.

### Investigation Findings

The investigation into the codebase, primarily focusing on `PaymentStep.tsx` and `SaleStepperDialog.tsx`, reveals that the observed behavior is consistent with the current implementation. The root cause is the division of responsibilities between the two components and the specific trigger for completing the sale.

#### 1. `PaymentStep.tsx`: Managing Individual Payments

-   **Function**: `handlePaymentComplete(payments: PaymentData[])`
-   **Trigger**: This function is called from the `PaymentDialog` when a user saves a new payment method (e.g., Especes, Cheque, CNAM).
-   **Actions**:
    1.  It validates the submitted payment data.
    2.  It sends the data to the `/api/payments/create` endpoint to save the payment record in the database.
    3.  It updates the local `savedPayments` state within the `PaymentStep` to display the newly added payment in the summary list.
    4.  **Crucially, it does NOT trigger the completion of the sale or the closing of the stepper.** It simply adds a payment to the current session and returns the user to the `PaymentStep`'s main view.

#### 2. `SaleStepperDialog.tsx`: Orchestrating the Sale Completion

-   **Function**: `handlePaymentComplete(paymentData: any)`
-   **Trigger**: This function is passed as the `onComplete` prop to the `PaymentStep` component. It is only invoked when the user clicks the **"Terminer le Paiement"** button inside `PaymentStep`.
-   **Button Visibility**: The "Terminer le Paiement" button only becomes visible when the total `paidAmount` is greater than or equal to the `totalAmount` due.
-   **Actions**:
    1.  It receives the final payment data from `PaymentStep`.
    2.  It assembles a complete `saleData` payload, including the client details, selected products, all payment records, and any notes.
    3.  It makes a `POST` request to the `/api/sales` endpoint, which creates the final sale record in the database.
    4.  Upon a successful API response, it displays a "Vente créée avec succès" toast notification.
    5.  It then calls the `handleClose()` function, which resets the entire stepper's state and closes the `SaleStepperDialog`.

### Conclusion

The system is designed to treat the **"Terminer le Paiement"** button as the final, explicit action that concludes the entire sales process. Adding a payment method via the `PaymentDialog` is considered an intermediate step. The stepper does not automatically advance or close after adding a single payment because the user might need to add multiple forms of payment (e.g., part in cash, part by cheque).

The stepper closes only after the final sale is successfully created in the database, which is the intended final step of the workflow. There is no separate "recapitulative" step after the payment is finalized because the payment step *is* the final step in the data collection process.

---

## PaymentForms Deep Dive & Audit

---

## Database Structure & Current State

### Current Data Storage (Postgres)
- **Payment Table:**
  - Stores high-level info: `id`, `amount`, `method`, `status`, `patientId`, `paymentDate`, etc.
  - Flexible fields for cheque, bank, CNAM, etc. are often null unless relevant.
  - `notes` field often contains a large JSON object with an array of sub-payments (e.g., CNAM + Espèces), including status history, bond type, product/device references, etc.
  - For CNAM payments, `cnamCardNumber` is a summary string, and all dossier details are in the `notes` JSON.
  - `method` always matches the enum (CASH, CNAM, etc.), but actual details are not normalized.

- **PaymentDetail Table:**
  - Now populated and used to store detailed payment method information, including amount, classification, reference, and method-specific metadata.
  - This table is used to normalize payment data, moving away from storing all details in the `notes` JSON of the main Payment record.

### Example Patterns
- **Single payment:** Simple record with method (e.g., CASH), amount, and few fields filled.
- **Composite payment:** `notes` contains a JSON array of individual payment breakdowns, each with its own metadata.
- **No normalization:** Extra details (classification, references, history) are inside `notes` JSON, making queries/reporting harder.

### Remarks & Recommendations
- **Normalization Needed:**
  - Move to using the `PaymentDetail` table for all method/classification/partial info.
  - Store only high-level info in `Payment`, and all breakdowns in `PaymentDetail` (with `metadata` for flexible fields).
  - Avoid storing arrays of payments in the `notes` field.

- **POST Route Design:**
  - Accept a main payment object and an array of details.
  - Backend should create the main Payment, then a PaymentDetail for each detail.
  - Example payload:
    ```json
    {
      "amount": 2421,
      "method": "CNAM",
      "patientId": "...",
      "details": [
        { "method": "cnam", "amount": 1475, "classification": "principale", "metadata": { ... } },
        { "method": "especes", "amount": 946, "classification": "principale", "metadata": { ... } }
      ]
    }
    ```

- **Benefits:**
  - Easier queries, reporting, and auditing by type/classification.
  - Supports future payment types or extra fields without schema changes.
  - Reduces need to parse large JSON blobs in `notes`.

- **Migration:**
  - Consider migrating existing data from `notes` JSON to `PaymentDetail` for consistency.

---

### 1. Espèces (Cash)
- **Classification:** Principale, Garantie, Complément (UI and logic present)
- **Partial Payments:** Supports acompte (down payment) and reste (remaining), creates two entries if needed
- **Validation:** Prevents acompte > total, disables reste input, automatic calculation
- **Context:** Uses requiredAmount from context if not provided
- **Issues:**
  - Good logic for partials, but no explicit validation for negative/zero values except in montantTotal
  - No user feedback if acompte = montantTotal (should be treated as full payment)
- **Recommendation:** Add clearer feedback for edge cases (e.g., acompte = total)

### 2. Chèque (Cheque)
- **Classification:** Principale, Garantie, Complément
- **Partial Payments:** Calculates reste, disables reste input
- **Fields:** Nom, Téléphone, CIN, Numéro de chèque, Banque, Date d'échéance
- **Validation:** Required fields present, disables reste input, prevents acompte > total
- **Issues:**
  - 'Ajouter un autre chèque' button is present but not functional (no logic for multiple cheques)
  - No explicit support for multiple cheques in one operation
- **Recommendation:** Implement logic for multiple cheques if needed or hide the button

### 3. Virement (Bank Transfer)
- **Classification:** Principale, Garantie, Complément
- **Partial Payments:** Supports acompte/reste, disables reste input
- **Fields:** Montant, Acompte, Reste, Référence, Date échéance
- **Validation:** Prevents acompte > total, required fields enforced
- **Issues:**
  - No logic for multiple virements (button not present)
  - No feedback if acompte = montantTotal
- **Recommendation:** Add feedback for edge cases; clarify if multiple virements are supported

### 4. Mandat (Money Order)
- **Classification:** Principale, Garantie, Complément
- **Partial Payments:** Fields for acompte/reste but no calculation logic (user must fill manually)
- **Fields:** Montant, Acompte, Reste, Date Reste, Bénéficiaire, Bureau Emission, Date Emission
- **Validation:** Required fields enforced, but reste is not calculated automatically
- **Issues:**
  - No automatic calculation of reste/acompte as in other forms
- **Recommendation:** Add calculation logic for reste/acompte if desired

### 5. Traite (Bill of Exchange)
- **Classification:** Principale, Garantie, Complément
- **Partial Payments:** No explicit logic for partials (fields present, but no calculation)
- **Fields:** Extensive (Nom Traite, Montant, Dates, Banque, Payee info, etc.)
- **Validation:** Required fields present
- **Issues:**
  - No logic for multiple traites (button present but not functional)
  - No calculation for partials
- **Recommendation:** Implement logic for multiple traites or hide button, add calculation logic if desired

### 6. CNAM (Insurance)
- **Classification:** Only 'principal' supported (no garantie/complement)
- **Partial Payments:** Not applicable (insurance covers principal)
- **Fields:** Extensive, covers bond types, dossier status, history, product matching
- **Validation:** Extensive (status, bond-product match, date fields, amount)
- **Issues:**
  - Status history user is hardcoded ('current_user'), should use actual logged-in user
  - Bond-product match warnings are present but not enforced
  - Complex, but robust overall
- **Recommendation:** Use real user for status history, consider enforcing bond-product match at form level

---

## Conclusion
The PaymentStep system is fully integrated and working in both sale and rental flows. All major features are present and operational. No critical issues or missing dependencies were found during this scan. The system is modular, robust, and ready for further extension if needed.



thoose are the tables were we save the payments 

enum PaymentMethod {
  CNAM
  CHEQUE
  CASH
  TRAITE
  MANDAT
  VIREMENT
}

model Payment {
  id              String          @id @default(cuid())
  amount          Decimal         @db.Decimal(10, 2)
  method          PaymentMethod
  status          PaymentStatus   @default(PENDING)
  chequeNumber    String?
  bankName        String?
  cnamCardNumber  String?
  referenceNumber String?
  rentalId        String?         @unique
  rental          Rental?         @relation(fields: [rentalId], references: [id])
  diagnosticId    String?
  notes           String?
  FileId          String?
  paymentDate     DateTime        @default(now())
  dueDate         DateTime?
  patientId       String?
  patient         Patient?        @relation(fields: [patientId], references: [id])
  companyId       String?
  company         Company?        @relation(fields: [companyId], references: [id])
  saleId          String?
  sale            Sale?           @relation(fields: [saleId], references: [id])
  paymentDetails  PaymentDetail[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

// New model to track detailed payment method information
model PaymentDetail {
  id             String   @id @default(cuid())
  paymentId      String // Parent payment ID
  payment        Payment  @relation(fields: [paymentId], references: [id])
  method         String // Raw payment method from frontend (especes, cheque, etc.)
  amount         Decimal  @db.Decimal(10, 2)
  classification String // principale, garantie, complement
  reference      String? // Reference information
  metadata       Json? // Additional method-specific details
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}