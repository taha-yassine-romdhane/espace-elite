# Project Usage Tracking

This document tracks components, APIs, and pages that are actively used in the project.
It will help identify unused code that can be removed.

---

## Admin Dashboard (`/roles/admin/dashboard`)

### Main Page: `index.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/card` - Card, CardContent
- `@/components/employee/CreateManualTaskDialog`
- `@/components/appointments/CreateAppointmentDialog`
- `@/components/diagnostics/CreateDiagnosticDialogAdmin`
- `@/components/diagnostics/CompleteDiagnosticDialogAdmin`
- `@/components/sales/CreateSaleDialogAdmin`
- `@/components/dialogs/RentalCreationDialogAdmin`

#### Admin Page Components Used:
- `../AdminLayout`
- `../appointments/AppointmentsExcelTable`
- `../diagnostics/DiagnosticsExcelTable`
- `../sales/components/CNAMRappelsTable`
- `../location/components/RentalStatistics`
- `../manual-tasks/index`
- `../rentals/ActiveRentalDevicesWidget`
- `./components/TabSwitcher`

#### APIs Used: None directly (child components use APIs)

---

### Component: `TabSwitcher.tsx`

#### External Components Used:
- `@/components/ui/button` - Button

#### APIs Used: None

---

### Component: `DiagnosticStepperDialog.tsx`

#### External Components Used:
- `@/components/ui/dialog` - Dialog, DialogContent, DialogHeader, DialogTitle
- `@/components/ui/button` - Button
- `@/components/ui/alert` - Alert, AlertDescription
- `@/components/tasks/AddTaskButton`
- `@/components/tasks/TaskFormDialog`
- `@/components/ui/use-toast`
- `@/components/forms/components/FileUpload`

#### Local Components Used:
- `./DiagnosticStepperSidebar`
- `./steps/ClientSelectionStep`
- `./steps/diagnostic/NewDiagnosticProductStep`

#### APIs Used:
- `GET /api/renseignements/patients/{id}` - Fetch single patient
- `GET /api/renseignements/patients` - Fetch all patients
- `POST /api/diagnostics` - Create diagnostic
- `POST /api/tasks` - Create task

---

### Component: `DiagnosticStepperSidebar.tsx`

#### External Components Used:
- `@/lib/utils` - cn

#### APIs Used: None

---

### Component: `SaleStepperDialog.tsx`

#### External Components Used:
- `@/components/ui/dialog` - Dialog, DialogContent, DialogHeader, DialogTitle
- `@/components/steps/PaymentStep`
- `@/components/appareils/forms/MedicalDeviceForm`
- `@/components/appareils/forms/AccessoryForm`
- `@/components/appareils/forms/SparePartForm`
- `@/components/appareils/forms/DiagnosticDeviceForm`
- `@/components/ui/use-toast` - toast
- `@/components/steps/RecapitulationStep`
- `@/components/ui/label` - Label
- `@/components/ui/textarea` - Textarea

#### Local Components Used:
- `./SaleStepperSidebar`
- `./steps/ClientSelectionStep`
- `./steps/ProductSelectionStep`

#### APIs Used:
- `GET /api/stock-locations` - Fetch stock locations
- `GET /api/{endpoint}/{id}` - Fetch patient or company
- `POST /api/sales` - Create sale

---

### Component: `SaleStepperSidebar.tsx`

#### External Components Used:
- `@/lib/utils` - cn
- `@/utils/priceUtils` - toNumber, formatPrice, formatCurrency, calculatePaymentsTotal, calculateRemainingAmount, isFullyPaid
- `@/components/StepperErrorBoundary`

#### APIs Used: None

---

### Component: `dialogs/ProductDialog.tsx`

#### External Components Used:
- `@/components/ui/dialog` - Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- `@/components/ui/select` - Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- `@/components/ui/input` - Input
- `@/components/ui/card` - Card
- `@/components/ui/badge` - Badge
- `@/components/ui/label` - Label
- `@/components/ui/button` - Button
- `@/components/ui/checkbox` - Checkbox
- `@/components/ui/use-toast` - toast
- `@/lib/utils` - cn
- `@/utils/statusUtils` - getDeviceStatusInfo

#### APIs Used:
- `GET /api/stock-locations` - Fetch stock locations
- `GET /api/medical-devices?type=MEDICAL_DEVICE` - Fetch medical devices
- `GET /api/medical-devices?type=DIAGNOSTIC_DEVICE` - Fetch diagnostic devices
- `GET /api/products?type=ACCESSORY` - Fetch accessories
- `GET /api/products?type=SPARE_PART` - Fetch spare parts

---

### Component: `steps/ClientSelectionStep.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/label` - Label
- `@/components/ui/radio-group` - RadioGroup, RadioGroupItem
- `@/components/ui/select` - Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- `@/components/ui/dialog` - Dialog, DialogContent, DialogHeader, DialogTitle
- `@/components/ui/input` - Input
- `@/components/ui/checkbox` - Checkbox
- `@/components/ui/popover` - Popover, PopoverContent, PopoverTrigger
- `@/components/ui/calendar` - Calendar
- `@/components/ui/use-toast`
- `@/components/forms/PatientForm`
- `@/components/forms/CompanyForm`

#### APIs Used:
- `GET /api/renseignements/patients` - Fetch patients
- `GET /api/renseignements/companies` - Fetch companies
- `POST /api/renseignements/patients` - Create patient
- `POST /api/renseignements/companies` - Create company

---

### Component: `steps/ProductSelectionStep.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/card` - Card
- `@/components/ui/badge` - Badge
- `@/components/ui/input` - Input
- `@/components/ui/select` - Select components
- `@/components/ui/dialog` - Dialog components
- `@/components/ui/label` - Label
- `@/components/ui/use-toast`
- `@/lib/utils` - cn
- `@/utils/priceUtils`
- `@/utils/statusUtils`

#### Local Components Used:
- `./product/ProductParameterDialog`

#### APIs Used:
- `GET /api/medical-devices` - Fetch medical devices
- `GET /api/products` - Fetch products (accessories, spare parts)
- `GET /api/stock-locations` - Fetch stock locations

---

### Component: `steps/AppointmentClientSelectionStep.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/input` - Input
- `@/components/ui/label` - Label
- `@/components/ui/select` - Select components
- `@/components/ui/dialog` - Dialog components
- `@/components/ui/use-toast`
- `@/components/forms/PatientForm`

#### APIs Used:
- `GET /api/renseignements/patients` - Fetch patients
- `POST /api/renseignements/patients` - Create patient

---

### Component: `steps/diagnostic/NewDiagnosticProductStep.tsx`

#### External Components Used:
- Various UI components

#### APIs Used:
- `GET /api/medical-devices` - Fetch diagnostic devices

---

### Component: `steps/diagnostic/DiagnosticProductDialog.tsx`

#### External Components Used:
- Dialog, Select, Input components

#### APIs Used:
- `GET /api/medical-devices?type=DIAGNOSTIC_DEVICE`

---

### Component: `steps/diagnostic/ParameterConfigurationDialog.tsx`

#### External Components Used:
- Dialog, Input, Label components

#### APIs Used: None (receives data via props)

---

### Component: `steps/product/PatientProductSelection.tsx`

#### External Components Used:
- Various UI components

#### APIs Used:
- `GET /api/medical-devices`
- `GET /api/products`

---

### Component: `steps/product/CompanyProductSelection.tsx`

#### External Components Used:
- Various UI components

#### APIs Used:
- `GET /api/medical-devices`
- `GET /api/products`

---

### Component: `steps/product/ProductParameterDialog.tsx`

#### External Components Used:
- Dialog, Input, Label components

#### APIs Used: None

---

### Component: `steps/ProductCard.tsx`

#### External Components Used:
- Card, Badge, Button components

#### APIs Used: None

---

### Component: `tables/SalesTable.tsx`

#### External Components Used:
- Various UI components
- `@tanstack/react-table`

#### APIs Used:
- `GET /api/sales` - Fetch sales
- `DELETE /api/sales/{id}` - Delete sale

---

### Component: `tables/AppointmentsTable.tsx`

#### External Components Used:
- Various UI components
- `@tanstack/react-table`

#### APIs Used:
- `GET /api/appointments` - Fetch appointments

---

### Component: `tables/DiagnosticTable.tsx`

#### External Components Used:
- Various UI components

#### APIs Used:
- `GET /api/diagnostics` - Fetch diagnostics

---

### Component: `tables/SalesTablesWrapper.tsx`

#### Local Components Used:
- `./SalesTable`

#### APIs Used: None directly

---

### Component: `sales/CNAMDossierSection.tsx`

#### External Components Used:
- `@/components/ui/card` - Card, CardContent, CardHeader, CardTitle
- `@/components/ui/badge` - Badge
- `@/components/ui/alert` - Alert, AlertDescription, AlertTitle
- `@/components/ui/button` - Button
- `@/hooks/useCNAMDossiers`
- `@/components/payment/components/CNAMDossierList`
- `@/components/payment/context/PaymentContext` - PaymentData

#### APIs Used: Via useCNAMDossiers hook

---

### Component: `sales/SaleDetailsCNAMTab.tsx`

#### External Components Used:
- `@/components/ui/alert` - Alert, AlertDescription, AlertTitle
- `@/hooks/useCNAMDossiers`
- `@/components/ui/tabs` - Tabs, TabsContent, TabsList, TabsTrigger
- `@/components/ui/badge` - Badge
- `@/components/payment/components/CNAMDossierManager`
- `@/components/ui/button` - Button

#### APIs Used: Via useCNAMDossiers hook

---

### Component: `sales/SaleDetailsTabsWithCNAM.tsx`

#### External Components Used:
- `@/components/ui/tabs` - Tabs, TabsContent, TabsList, TabsTrigger
- `@/components/ui/badge` - Badge
- `@/hooks/useCNAMDossiers`
- `@/components/sales/SaleInvoice`

#### Local Components Used:
- `./SaleDetailsCNAMTab`

#### APIs Used: Via useCNAMDossiers hook

---

### Component: `PatientInfoCard.tsx`

#### External Components Used:
- Card components

#### APIs Used: None (receives data via props)

---

### Component: `ProductFormPatient.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/card` - Card
- `@/components/ui/input` - Input
- `@/components/ui/label` - Label
- `@/components/ui/badge` - Badge

#### APIs Used: None (form component)

---

### Component: `ProductFormCompany.tsx`

#### External Components Used:
- `@/components/ui/button` - Button
- `@/components/ui/card` - Card
- `@/components/ui/input` - Input

#### APIs Used: None (form component)

---

## Summary of APIs Used by Dashboard

| API Endpoint | Method | Used By |
|-------------|--------|---------|
| `/api/renseignements/patients` | GET | DiagnosticStepperDialog, ClientSelectionStep, AppointmentClientSelectionStep |
| `/api/renseignements/patients/{id}` | GET | DiagnosticStepperDialog |
| `/api/renseignements/patients` | POST | ClientSelectionStep, AppointmentClientSelectionStep |
| `/api/renseignements/companies` | GET | ClientSelectionStep |
| `/api/renseignements/companies` | POST | ClientSelectionStep |
| `/api/diagnostics` | GET | DiagnosticTable |
| `/api/diagnostics` | POST | DiagnosticStepperDialog |
| `/api/tasks` | POST | DiagnosticStepperDialog |
| `/api/sales` | GET | SalesTable |
| `/api/sales` | POST | SaleStepperDialog |
| `/api/sales/{id}` | DELETE | SalesTable |
| `/api/stock-locations` | GET | SaleStepperDialog, ProductDialog, ProductSelectionStep |
| `/api/medical-devices` | GET | ProductDialog, ProductSelectionStep, NewDiagnosticProductStep |
| `/api/products` | GET | ProductDialog, ProductSelectionStep |
| `/api/appointments` | GET | AppointmentsTable |

---

## Potentially Unused Components in Dashboard

These components exist but may not be imported anywhere:
- TBD (will be filled as we analyze more)

---

## Notes

- Last updated: 2025-01-25
- Status: In progress - fixing lint errors
