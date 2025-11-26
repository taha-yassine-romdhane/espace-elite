// ============================================
// Diagnostic Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { DiagnosticStatus } from '../enums';

// Forward declarations
export interface DiagnosticUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface DiagnosticPatient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  patientCode?: string | null;
}

export interface DiagnosticCompany {
  id: string;
  companyName: string;
  telephone: string;
  companyCode?: string | null;
}

export interface DiagnosticDevice {
  id: string;
  name: string;
  type: string;
  deviceCode?: string | null;
  serialNumber?: string | null;
}

export interface DiagnosticResult {
  id: string;
  diagnosticId: string;
  iah?: number | null;
  iahCentral?: number | null;
  iahObstructif?: number | null;
  iahMixte?: number | null;
  oxygenSaturation?: number | null;
  minOxygen?: number | null;
  maxOxygen?: number | null;
  sleepEfficiency?: number | null;
  totalSleepTime?: number | null;
  arousalIndex?: number | null;
  rdiIndex?: number | null;
  notes?: string | null;
  interpretation?: string | null;
  recommendations?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Diagnostic {
  id: string;
  diagnosticCode?: string | null;
  diagnosticDate: Date | string;
  resultDueDate?: Date | string | null;
  status: DiagnosticStatus | string;
  result?: string | null;
  notes?: string | null;
  followUpRequired: boolean;
  followUpDate?: Date | string | null;

  // Medical device used
  medicalDeviceId: string;
  medicalDevice?: DiagnosticDevice;

  // Who performed the diagnostic
  performedById?: string | null;
  performedBy?: DiagnosticUser | null;

  // Patient (required)
  patientId: string;
  patient?: DiagnosticPatient;

  // Company (optional)
  companyId?: string | null;
  company?: DiagnosticCompany | null;

  // Detailed results
  diagnosticResults?: DiagnosticResult[];

  // Files (reports, charts, etc.)
  files?: Array<{
    id: string;
    url: string;
    type: string;
    fileName?: string | null;
    category?: string | null;
  }>;

  // Tasks associated with this diagnostic
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
export type DiagnosticBasic = Pick<Diagnostic, 'id' | 'diagnosticCode' | 'diagnosticDate' | 'status' | 'patientId'>;

export type DiagnosticWithDetails = Diagnostic & {
  medicalDevice: DiagnosticDevice;
  patient: DiagnosticPatient;
  diagnosticResults?: DiagnosticResult[];
};

export type DiagnosticCreateInput = {
  patientId: string;
  medicalDeviceId: string;
  diagnosticDate?: Date | string;
  resultDueDate?: Date | string | null;
  notes?: string | null;
  followUpRequired?: boolean;
  followUpDate?: Date | string | null;
  companyId?: string | null;
  performedById?: string | null;
};
