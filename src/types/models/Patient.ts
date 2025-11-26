// ============================================
// Patient Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { Affiliation, BeneficiaryType } from '../enums';

// Forward declarations to avoid circular imports
export interface PatientDoctor {
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface PatientUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
}

export interface Patient {
  id: string;
  patientCode?: string | null;
  firstName: string;
  lastName: string;
  telephone: string;
  telephoneTwo?: string | null;
  generalNote?: string | null;
  affiliation?: Affiliation | null;
  antecedant?: string | null;
  beneficiaryType?: BeneficiaryType | null;
  dateOfBirth?: Date | string | null;
  cin?: string | null;
  cnamId?: string | null;
  weight?: number | null;
  height?: number | null;
  imc?: number | null;
  medicalHistory?: string | null;

  // Location fields
  governorate?: string | null;
  delegation?: string | null;
  detailedAddress?: string | null;
  addressCoordinates?: { lat: number; lng: number } | null;

  // Relations
  doctorId?: string | null;
  doctor?: PatientDoctor | null;
  technicianId?: string | null;
  technician?: PatientUser | null;
  userId: string;
  assignedTo?: PatientUser;
  supervisorId?: string | null;
  supervisor?: PatientUser | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types for different use cases
export type PatientBasic = Pick<Patient, 'id' | 'firstName' | 'lastName' | 'telephone' | 'patientCode'>;

export type PatientWithDetails = Patient & {
  appointments?: Array<{ id: string; scheduledDate: Date | string; status: string }>;
  diagnostics?: Array<{ id: string; diagnosticDate: Date | string; status: string }>;
  rentals?: Array<{ id: string; startDate: Date | string; status: string }>;
  sales?: Array<{ id: string; saleDate: Date | string; status: string }>;
  files?: Array<{ id: string; url: string; type: string; fileName?: string }>;
};

export type PatientFormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'assignedTo' | 'doctor' | 'technician' | 'supervisor'>;

export type PatientCreateInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'patientCode' | 'assignedTo' | 'doctor' | 'technician' | 'supervisor'>;
