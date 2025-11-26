// ============================================
// MedicalDevice Model - Synchronized with Prisma Schema
// Last sync: 2025-01-25
// ============================================

import { ProductType, DeviceStatus } from '../enums';

export interface MedicalDeviceLocation {
  id: string;
  name: string;
  type: string;
}

export interface MedicalDeviceParametre {
  id: string;
  medicalDeviceId: string;
  name: string;
  value?: string | null;
  unit?: string | null;
  description?: string | null;
}

export interface MedicalDevice {
  id: string;
  deviceCode?: string | null;
  name: string;
  type: ProductType | string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  technicalSpecs?: string | null;
  configuration?: string | null;
  warranty?: string | null;
  warrantyExpiry?: Date | string | null;
  maintenanceInterval?: string | null;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | string | null;
  sellingPrice?: number | string | null;
  rentalPrice?: number | string | null;
  imageUrl?: string | null;

  // Stock
  stockLocationId?: string | null;
  stockLocation?: MedicalDeviceLocation | null;
  stockQuantity: number;

  // Status
  status: DeviceStatus | string;
  availableForRent: boolean;
  requiresMaintenance: boolean;
  installationDate?: Date | string | null;
  reservedUntil?: Date | string | null;
  location?: string | null;

  // Parameters
  deviceParameters?: MedicalDeviceParametre[];

  // Current assignment
  patientId?: string | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    telephone: string;
  } | null;
  companyId?: string | null;
  company?: {
    id: string;
    companyName: string;
  } | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility types
export type MedicalDeviceBasic = Pick<MedicalDevice, 'id' | 'deviceCode' | 'name' | 'type' | 'status' | 'serialNumber' | 'sellingPrice' | 'rentalPrice'>;

export type MedicalDeviceForSale = MedicalDevice & {
  sellingPrice: number | string;
};

export type MedicalDeviceForRent = MedicalDevice & {
  rentalPrice: number | string;
};

export type MedicalDeviceCreateInput = Omit<MedicalDevice, 'id' | 'createdAt' | 'updatedAt' | 'deviceCode' | 'stockLocation' | 'patient' | 'company' | 'deviceParameters'>;
