export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  DOCTOR = "DOCTOR"
}
export enum PaymentMethod {
  CNAM = "CNAM",
  CHEQUE = "CHEQUE",
  CASH = "CASH",
}
export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  GUARANTEE = "GUARANTEE",
  PARTIAL = "PARTIAL",
}

export enum BeneficiaryType {
  ASSURE_SOCIAL = "ASSURE_SOCIAL",
  CONJOINT_ENFANT = "CONJOINT_ENFANT",
  ASSANDANT = "ASSANDANT",
}

export enum Affiliation {
  CNSS = "CNSS",
  CNRPS = "CNRPS",
}

export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
}
export enum ProductType {
  ACCESSORY = "ACCESSORY",
  SPARE_PART = "SPARE_PART",
  DIAGNOSTIC_DEVICE = "DIAGNOSTIC_DEVICE",
  MEDICAL_DEVICE = "MEDICAL_DEVICE",
}

export enum ProductStatus {
  FONCTIONNEL = "FONCTIONNEL",
  REPARATION = "REPARATION",
  NON_FONCTIONNEL = "NON_FONCTIONNEL",
}

export enum StockStatus {
  EN_VENTE = "EN_VENTE",
  EN_LOCATION = "EN_LOCATION",
  EN_REPARATION = "EN_REPARATION",
  HORS_SERVICE = "HORS_SERVICE",
}

export enum ClientType {
  PATIENT = "PATIENT",
  COMPANY = "COMPANY",
}

export enum StockLocationType {
  VENTE = 'VENTE',
  LOCATION = 'LOCATION',
  HORS_SERVICE = 'HORS_SERVICE'
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  telephone?: string;
  speciality?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  doctor?: Doctor;
  technician?: Technician[];
  assignedPatients?: Patient[];
  assignedCompanies?: Company[];
  technicianPatients?: Patient[];
  technicianCompanies?: Company[];
  tasks?: Task[];
  stockLocation?: StockLocation;
  stockTransfers?: StockTransfer[];
  sentTransfers?: StockTransfer[];
  receivedTransfers?: StockTransfer[];
}

export interface StockLocation {
  id: string;
  name: string;
  userId?: string;
  user?: User;
  description?: string;
  isActive: boolean;
  stocks?: Stock[];
  outgoingTransfers?: StockTransfer[];
  incomingTransfers?: StockTransfer[];
  medicalDevices?: MedicalDevice[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransfer {
  id: string;
  fromLocationId: string;
  fromLocation: StockLocation;
  toLocationId: string;
  toLocation: StockLocation;
  productId: string;
  product: Product;
  quantity: number;
  newStatus?: StockStatus;
  transferredBy: string;
  user: User;
  sentBy?: User;
  receivedBy?: User;
  notes?: string;
  transferDate: Date;
  updatedAt: Date;
}
export interface Stock {
  id: string;
  locationId: string;
  location: StockLocation;
  productId: string;
  product: Product;
  quantity: number;
  status: StockStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  user: User;
  speciality: string;
  patient: Patient[];
  appointment: Appointment[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  telephoneTwo?: string;
  descriptionNumOne?: string;
  descriptionNumTwo?: string;
  affiliation?: Affiliation;
  antecedant?: string;
  beneficiaryType?: BeneficiaryType | string;
  address?: string;
  dateOfBirth?: Date;
  cin?: string;
  cnamId?: string;
  weight?: number;
  height?: number;
  imc?: number;
  medicalHistory?: string;
  doctorId?: string;
  doctor?: Doctor;
  technicianId?: string;
  technician?: User;
  assignedTo: User;
  userId: string;
  files?: File[];
  medicalDevices?: MedicalDevice[];
  payments?: Payment[];
  diagnostics?: Diagnostic[];
  appointments?: Appointment[];
  rentals?: Rental[];
  createdAt: Date;
  updatedAt: Date;
}
export interface Company {
  id: string;
  companyName: string;
  telephone: string;
  telephoneSecondaire?: string;
  address?: string;
  taxId?: string;
  nameDescription?: string;
  phoneDescription?: string;
  addressDescription?: string;
  technicianId?: string;
  technician?: User;
  assignedTo: User;
  userId: string;
  files?: File[];
  medicalDevices?: MedicalDevice[];
  payments?: Payment[];
  diagnostics?: Diagnostic[];
  appointments?: Appointment[];
  rentals?: Rental[];
  createdAt: Date;
  updatedAt: Date;
}
export interface RepairLog {
  id: string;
  productId: string;
  product: Product;
  repairCost: number;
  locationId: string;
  location: Location;
  repairDate: Date;
  notes?: string;
  technicianId?: string;
  technician?: Technician;
  createdAt: Date;
  updatedAt: Date;
}
export interface Location {
  id: string;
  name: string;
  address?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  repairs?: RepairLog[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: Date;
  status: string; // SCHEDULED, COMPLETED, CANCELLED
  notes?: string;
  patient: Patient;
  doctor: Doctor;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patient: Patient;
  diagnosis: string[];
  treatments: string[];
  notes?: string;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Technician {
  id: string;
  userId: string;
  user: User;
  repairs?: RepairLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Rental {
  id: string;
  medicalDeviceId: string;
  medicalDevice: MedicalDevice;
  patientId: string;
  patient: Patient;
  startDate: Date;
  endDate: Date;
  notes?: string;
  paymentId?: string;
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
  Company?: Company;
  companyId?: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctor: Doctor;
  patientId: string;
  patient: Patient;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  Company?: Company;
  companyId?: string;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  chequeNumber?: string;
  bankName?: string;
  guaranteeAmount?: number;
  companyId?: string;
  company?: Company;
  patientId?: string;
  patient?: Patient;
  rentalId?: string;
  rental?: Rental;
  createdAt: Date;
  updatedAt: Date;
}
export interface File {
  id: string;
  url: string;
  type: string;
  patientId?: string;
  patient?: Patient;
  companyId?: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}
export interface MedicalDevice {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  installationDate?: Date;
  configuration?: string;
  patientId?: string;
  patient?: Patient;
  companyId?: string;
  company?: Company;
  diagnostics?: Diagnostic[];
  stockLocation: StockLocation;
  stockQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  stockLocationId: string;
  Rental?: Rental[];
}

export interface Diagnostic {
  id: string;
  medicalDeviceId: string;
  medicalDevice: MedicalDevice;
  patientId: string;
  patient: Patient;
  result: string;
  notes?: string;
  diagnosticDate: Date;
  createdAt: Date;
  updatedAt: Date;
  Company?: Company;
  companyId?: string;
}
export interface Doctor {
  id: string;
  userId: string;
  user: User;
  patients?: Patient[];
  appointments?: Appointment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  brand?: string;
  serialNumber?: string;
  purchasePrice?: number;
  totalCost?: number;
  minStock?: number;
  maxStock?: number;
  alertThreshold?: number;
  stocks?: Stock[];
  transfers?: StockTransfer[];
  repairs?: RepairLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}