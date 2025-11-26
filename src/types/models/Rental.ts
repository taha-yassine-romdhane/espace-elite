// ============================================
// Rental Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { RentalStatus, BillingCycle } from '../enums';

export interface RentalPatient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  patientCode?: string | null;
  address?: string | null;
  governorate?: string | null;
  delegation?: string | null;
}

export interface RentalCompany {
  id: string;
  companyName: string;
  telephone: string;
  companyCode?: string | null;
}

export interface RentalDevice {
  id: string;
  name: string;
  type: string;
  deviceCode?: string | null;
  serialNumber?: string | null;
  rentalPrice?: number | string | null;
}

export interface RentalUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Rental {
  id: string;
  rentalCode?: string | null;
  status: RentalStatus | string;
  startDate: Date | string;
  endDate?: Date | string | null;
  actualReturnDate?: Date | string | null;
  billingCycle: BillingCycle | string;
  dailyRate?: number | string | null;
  weeklyRate?: number | string | null;
  monthlyRate?: number | string | null;
  depositAmount?: number | string | null;
  depositPaid: boolean;
  notes?: string | null;
  returnNotes?: string | null;
  returnCondition?: string | null;

  // Device
  medicalDeviceId: string;
  medicalDevice?: RentalDevice;

  // Patient
  patientId: string;
  patient?: RentalPatient;

  // Company (optional)
  companyId?: string | null;
  company?: RentalCompany | null;

  // Assigned technician
  assignedToId?: string | null;
  assignedTo?: RentalUser | null;

  // Created by
  createdById?: string | null;
  createdBy?: RentalUser | null;

  // CNAM
  cnamDossiers?: Array<{
    id: string;
    dossierNumber: string;
    status: string;
  }>;
  cnamBons?: Array<{
    id: string;
    bonNumber?: string | null;
    bonType: string;
    status: string;
    expirationDate?: Date | string | null;
  }>;

  // Payments
  payments?: Array<{
    id: string;
    amount: number | string;
    method: string;
    status: string;
    paymentDate: Date | string;
  }>;

  // Tasks
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    dueDate?: Date | string | null;
  }>;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types
export type RentalBasic = Pick<Rental, 'id' | 'rentalCode' | 'status' | 'startDate' | 'endDate' | 'patientId' | 'medicalDeviceId'>;

export type RentalWithDetails = Rental & {
  patient: RentalPatient;
  medicalDevice: RentalDevice;
};

export type RentalCreateInput = {
  patientId: string;
  medicalDeviceId: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  billingCycle?: BillingCycle | string;
  dailyRate?: number | string | null;
  weeklyRate?: number | string | null;
  monthlyRate?: number | string | null;
  depositAmount?: number | string | null;
  notes?: string | null;
  companyId?: string | null;
  assignedToId?: string | null;
};
