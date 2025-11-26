// ============================================
// ENUMS - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

// User & Auth
export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  DOCTOR = "DOCTOR"
}

// Client Types
export enum ClientType {
  PATIENT = "PATIENT",
  COMPANY = "COMPANY"
}

// Payment Related
export enum PaymentMethod {
  CNAM = "CNAM",
  CHEQUE = "CHEQUE",
  CASH = "CASH",
  TRAITE = "TRAITE",
  MANDAT = "MANDAT",
  VIREMENT = "VIREMENT",
  BANK_TRANSFER = "BANK_TRANSFER"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  GUARANTEE = "GUARANTEE",
  PARTIAL = "PARTIAL",
  CANCELLED = "CANCELLED"
}

export enum PaymentType {
  DEPOSIT = "DEPOSIT",
  RENTAL = "RENTAL",
  REFUND = "REFUND",
  PENALTY = "PENALTY",
  ADJUSTMENT = "ADJUSTMENT"
}

export enum PaymentSource {
  SALE = "SALE",
  RENTAL = "RENTAL",
  DIAGNOSTIC = "DIAGNOSTIC",
  AUTRE = "AUTRE"
}

// Patient Related
export enum BeneficiaryType {
  ASSURE_SOCIAL = "ASSURE_SOCIAL",
  CONJOINT = "CONJOINT",
  ENFANT = "ENFANT",
  ASSANDANT = "ASSANDANT"
}

export enum Affiliation {
  CNSS = "CNSS",
  CNRPS = "CNRPS"
}

// Product & Device Related
export enum ProductType {
  ACCESSORY = "ACCESSORY",
  SPARE_PART = "SPARE_PART",
  DIAGNOSTIC_DEVICE = "DIAGNOSTIC_DEVICE",
  MEDICAL_DEVICE = "MEDICAL_DEVICE"
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  RETIRED = "RETIRED",
  SOLD = "SOLD"
}

export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  MAINTENANCE = "MAINTENANCE",
  RETIRED = "RETIRED",
  RESERVED = "RESERVED",
  SOLD = "SOLD"
}

// Stock Related
export enum StockStatus {
  FOR_RENT = "FOR_RENT",
  FOR_SALE = "FOR_SALE",
  IN_REPAIR = "IN_REPAIR",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
  SOLD = "SOLD"
}

export enum StockLocationType {
  PHYSICAL = "PHYSICAL",
  VIRTUAL = "VIRTUAL",
  ARCHIVE = "ARCHIVE"
}

export enum StockMovementType {
  ENTREE = "ENTREE",
  SORTIE = "SORTIE",
  TRANSFERT = "TRANSFERT"
}

// Transfer Request Related
export enum TransferRequestUrgency {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum TransferRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED"
}

// Task Related
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export enum ManualTaskStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// Action History
export enum ActionType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  DIAGNOSTIC = "DIAGNOSTIC",
  RENTAL = "RENTAL",
  PAYMENT = "PAYMENT",
  MAINTENANCE = "MAINTENANCE",
  APPOINTMENT = "APPOINTMENT",
  TASK_CREATION = "TASK_CREATION",
  TASK_UPDATE = "TASK_UPDATE",
  TASK_DELETION = "TASK_DELETION",
  SALE = "SALE",
  TRANSFER = "TRANSFER"
}

// Sale Related
export enum SaleStatus {
  PENDING = "PENDING",
  ON_PROGRESS = "ON_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
  PARTIALLY_RETURNED = "PARTIALLY_RETURNED"
}

// Rental Related
export enum RentalStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED"
}

export enum BillingCycle {
  DAILY = "DAILY",
  MONTHLY = "MONTHLY",
  WEEKLY = "WEEKLY"
}

// Diagnostic Related
export enum DiagnosticStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// CNAM Related
export enum CNAMStatus {
  EN_ATTENTE_APPROBATION = "EN_ATTENTE_APPROBATION",
  APPROUVE = "APPROUVE",
  EN_COURS = "EN_COURS",
  TERMINE = "TERMINE",
  REFUSE = "REFUSE"
}

export enum CNAMBonType {
  MASQUE = "MASQUE",
  CPAP = "CPAP",
  AUTRE = "AUTRE",
  VNI = "VNI",
  CONCENTRATEUR_OXYGENE = "CONCENTRATEUR_OXYGENE"
}

export enum CNAMBonCategory {
  LOCATION = "LOCATION",
  ACHAT = "ACHAT"
}

// Notification Related
export enum NotificationType {
  FOLLOW_UP = "FOLLOW_UP",
  MAINTENANCE = "MAINTENANCE",
  APPOINTMENT = "APPOINTMENT",
  PAYMENT_DUE = "PAYMENT_DUE",
  RENTAL_EXPIRING = "RENTAL_EXPIRING",
  RENTAL_RETURN = "RENTAL_RETURN",
  SALE_COMPLETED = "SALE_COMPLETED",
  TASK_ASSIGNED = "TASK_ASSIGNED",
  TASK_COMPLETED = "TASK_COMPLETED",
  STOCK_LOW = "STOCK_LOW",
  TRANSFER = "TRANSFER",
  TRANSFER_APPROVED = "TRANSFER_APPROVED",
  TRANSFER_REJECTED = "TRANSFER_REJECTED",
  CNAM_RENEWAL = "CNAM_RENEWAL",
  DIAGNOSTIC_PENDING = "DIAGNOSTIC_PENDING",
  OTHER = "OTHER"
}

export enum NotificationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  DISMISSED = "DISMISSED",
  READ = "READ"
}

// Appointment Related
export enum AppointmentType {
  POLYGRAPHIE = "POLYGRAPHIE",
  CONSULTATION = "CONSULTATION",
  LOCATION = "LOCATION",
  VENTE = "VENTE",
  MAINTENANCE = "MAINTENANCE",
  RECUPERATION = "RECUPERATION"
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RESCHEDULED = "RESCHEDULED"
}

export enum AppointmentPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

// Message Related
export enum MessageType {
  DIRECT = "DIRECT",
  BROADCAST = "BROADCAST",
  GROUP = "GROUP",
  SYSTEM = "SYSTEM"
}

// File Related
export enum FileCategory {
  TITRATION = "TITRATION",
  POLYGRAPHIE = "POLYGRAPHIE",
  VENTE = "VENTE",
  LOCATION = "LOCATION",
  OTHER = "OTHER"
}
