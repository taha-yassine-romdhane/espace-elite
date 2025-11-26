// ============================================
// Sale Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { SaleStatus } from '../enums';

// Forward declarations
export interface SaleUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface SalePatient {
  id: string;
  firstName: string;
  lastName: string;
  telephone: string;
  patientCode?: string | null;
}

export interface SaleCompany {
  id: string;
  companyName: string;
  telephone: string;
  companyCode?: string | null;
}

export interface SaleItemProduct {
  id: string;
  name: string;
  type: string;
  productCode?: string | null;
}

export interface SaleItemDevice {
  id: string;
  name: string;
  type: string;
  deviceCode?: string | null;
  serialNumber?: string | null;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId?: string | null;
  product?: SaleItemProduct | null;
  medicalDeviceId?: string | null;
  medicalDevice?: SaleItemDevice | null;
  stockLocationId?: string | null;
  quantity: number;
  unitPrice: number | string;
  discount?: number | string | null;
  itemTotal: number | string;
  serialNumber?: string | null;
  warranty?: string | null;
  description?: string | null;
  configuration?: SaleConfiguration | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SaleConfiguration {
  id: string;
  saleItemId: string;
  // CPAP parameters
  pression?: string | null;
  pressionRampe?: string | null;
  dureeRampe?: number | null;
  epr?: string | null;
  auto1?: boolean | null;
  auto2?: boolean | null;
  pressionTraitement?: number | null;
  // VNI parameters
  ipap?: string | null;
  epap?: string | null;
  aid?: string | null;
  mode?: string | null;
  frequenceRespiratoire?: string | null;
  volumeCourant?: string | null;
  // Oxygen concentrator
  debit?: string | null;
  // Generic
  additionalParams?: Record<string, unknown> | null;
}

export interface Sale {
  id: string;
  saleCode?: string | null;
  invoiceNumber?: string | null;
  saleDate: Date | string;
  totalAmount: number | string;
  discount?: number | string | null;
  finalAmount: number | string;
  status: SaleStatus | string;
  notes?: string | null;

  // Who processed the sale
  processedById: string;
  processedBy?: SaleUser;

  // Who is assigned to manage this sale
  assignedToId?: string | null;
  assignedTo?: SaleUser | null;

  // Customer (either patient or company)
  patientId?: string | null;
  patient?: SalePatient | null;
  companyId?: string | null;
  company?: SaleCompany | null;

  // Line items
  items?: SaleItem[];

  // Payments
  payments?: Array<{
    id: string;
    amount: number | string;
    method: string;
    status: string;
    paymentDate: Date | string;
  }>;

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
  }>;

  // Files
  files?: Array<{
    id: string;
    url: string;
    type: string;
    fileName?: string | null;
  }>;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types
export type SaleBasic = Pick<Sale, 'id' | 'saleCode' | 'saleDate' | 'totalAmount' | 'finalAmount' | 'status'>;

export type SaleWithItems = Sale & {
  items: SaleItem[];
};

export type SaleCreateInput = Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'saleCode' | 'processedBy' | 'assignedTo' | 'patient' | 'company' | 'items' | 'payments' | 'cnamDossiers' | 'cnamBons' | 'files'>;
