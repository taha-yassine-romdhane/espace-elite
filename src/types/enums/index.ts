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
  CONJOINT = "CONJOINT",
  ENFANT = "ENFANT",
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
  RESERVED = "RESERVED",
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

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum ActionType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  DIAGNOSTIC = "DIAGNOSTIC",
  RENTAL = "RENTAL",
  PAYMENT = "PAYMENT",
  MAINTENANCE = "MAINTENANCE",
  APPOINTMENT = "APPOINTMENT",
  TASK = "TASK",
}

export enum NotificationType {
  FOLLOW_UP = "FOLLOW_UP",
  MAINTENANCE = "MAINTENANCE",
  APPOINTMENT = "APPOINTMENT",
  PAYMENT_DUE = "PAYMENT_DUE",
  OTHER = "OTHER",
}

export enum NotificationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  DISMISSED = "DISMISSED",
}
