// ============================================
// Payment Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { PaymentMethod, PaymentStatus, PaymentType, PaymentSource } from '../enums';

export interface PaymentPatient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
}

export interface PaymentCompany {
  id: string;
  companyName: string;
  telephone: string;
}

export interface Payment {
  id: string;
  paymentCode?: string | null;
  amount: number | string;
  method: PaymentMethod | string;
  status: PaymentStatus | string;
  type?: PaymentType | string | null;
  source?: PaymentSource | string | null;
  paymentDate: Date | string;
  dueDate?: Date | string | null;
  notes?: string | null;

  // Check details
  chequeNumber?: string | null;
  bankName?: string | null;
  chequeDate?: Date | string | null;

  // Transfer details
  reference?: string | null;
  transferReference?: string | null;

  // Traite details
  traiteNumber?: string | null;
  traiteDate?: Date | string | null;

  // Guarantee
  guaranteeAmount?: number | string | null;
  isGuarantee: boolean;

  // Relations
  patientId?: string | null;
  patient?: PaymentPatient | null;
  companyId?: string | null;
  company?: PaymentCompany | null;

  // Related entities
  saleId?: string | null;
  rentalId?: string | null;
  diagnosticId?: string | null;

  // CNAM
  cnamDossierId?: string | null;
  cnamBonId?: string | null;

  // Product allocations (for tracking which products this payment covers)
  productAllocations?: Record<string, number> | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types
export type PaymentBasic = Pick<Payment, 'id' | 'paymentCode' | 'amount' | 'method' | 'status' | 'paymentDate'>;

export type PaymentWithDetails = Payment & {
  patient?: PaymentPatient | null;
  company?: PaymentCompany | null;
};

export type PaymentCreateInput = {
  amount: number | string;
  method: PaymentMethod | string;
  status?: PaymentStatus | string;
  type?: PaymentType | string | null;
  source?: PaymentSource | string | null;
  paymentDate?: Date | string;
  dueDate?: Date | string | null;
  notes?: string | null;
  chequeNumber?: string | null;
  bankName?: string | null;
  chequeDate?: Date | string | null;
  reference?: string | null;
  traiteNumber?: string | null;
  traiteDate?: Date | string | null;
  guaranteeAmount?: number | string | null;
  isGuarantee?: boolean;
  patientId?: string | null;
  companyId?: string | null;
  saleId?: string | null;
  rentalId?: string | null;
};
