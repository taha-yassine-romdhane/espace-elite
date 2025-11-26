// ============================================
// Appointment Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { AppointmentType, AppointmentStatus, AppointmentPriority } from '../enums';

export interface AppointmentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AppointmentDoctor {
  id: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AppointmentPatient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  patientCode?: string | null;
  address?: string | null;
  governorate?: string | null;
  delegation?: string | null;
}

export interface AppointmentCompany {
  id: string;
  companyName: string;
  telephone: string;
}

export interface Appointment {
  id: string;
  appointmentCode?: string | null;
  title?: string | null;
  type: AppointmentType | string;
  scheduledDate: Date | string;
  scheduledTime?: string | null;
  duration?: number | null;
  status: AppointmentStatus | string;
  priority: AppointmentPriority | string;
  notes?: string | null;
  location?: string | null;
  reminderSent: boolean;
  confirmedAt?: Date | string | null;
  completedAt?: Date | string | null;
  cancelledAt?: Date | string | null;
  cancellationReason?: string | null;

  // Doctor
  doctorId?: string | null;
  doctor?: AppointmentDoctor | null;

  // Patient
  patientId: string;
  patient?: AppointmentPatient;

  // Company (optional)
  companyId?: string | null;
  company?: AppointmentCompany | null;

  // Created by
  createdById?: string | null;
  createdBy?: AppointmentUser | null;

  // Assigned to
  assignedToId?: string | null;
  assignedTo?: AppointmentUser | null;

  // Related entities
  diagnosticId?: string | null;
  rentalId?: string | null;
  saleId?: string | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types
export type AppointmentBasic = Pick<Appointment, 'id' | 'appointmentCode' | 'title' | 'type' | 'scheduledDate' | 'status' | 'patientId'>;

export type AppointmentWithPatient = Appointment & {
  patient: AppointmentPatient;
};

export type AppointmentCreateInput = {
  patientId: string;
  type: AppointmentType | string;
  scheduledDate: Date | string;
  scheduledTime?: string | null;
  duration?: number | null;
  priority?: AppointmentPriority | string;
  notes?: string | null;
  location?: string | null;
  doctorId?: string | null;
  companyId?: string | null;
  assignedToId?: string | null;
  diagnosticId?: string | null;
  rentalId?: string | null;
  saleId?: string | null;
};
