export enum Role {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
  MANAGER = "MANAGER",
  DOCTOR = "DOCTOR"
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  telephone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  doctor?: Doctor;
  technician?: Technician;
  tasks: Task[];
}

export interface Doctor {
  id: string;
  userId: string;
  user: User;
  speciality: string;
  patients: Patient[];
  appointments: Appointment[];
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  doctorId: string;
  doctor: Doctor;
  appointments: Appointment[];
  medicalRecord?: MedicalRecord;
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
  status: string; // TODO, IN_PROGRESS, COMPLETED
  priority: string; // LOW, MEDIUM, HIGH
  assignedTo: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Technician {
  id: string;
  userId: string;
  user: User;
}

export enum ProductStatus {
  FONCTIONNEL = 'FONCTIONNEL',
  REPARATION = 'REPARATION',
  NON_FONCTIONNEL = 'NON_FONCTIONNEL'
}

export enum StockLocation {
  VENTE = 'VENTE',
  LOCATION = 'LOCATION',
  HORS_SERVICE = 'HORS_SERVICE'
}

export interface Product {
  id: string;
  nom: string;
  type: string;
  marque: string;
  stock: StockLocation;
  ns?: string;
  prixAchat?: number;
  status: ProductStatus;
  montantReparation?: number;
  pieceRechange?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}