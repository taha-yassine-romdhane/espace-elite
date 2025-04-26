import { DeviceStatus } from '../enums';
import { StockLocation } from './StockLocation';
import { Patient } from './Patient';
import { Company } from './Company';
import { Diagnostic } from './Diagnostic';
import { Rental } from './Rental';
import { RepairLog } from './RepairLog';
import { DiagnosticParameter } from './DiagnosticParameter';
import { ParameterValue } from './ParameterValue';

export interface MedicalDevice {
  id: string;
  name: string;
  type: string; // CPAP, DIAGNOSTIC_DEVICE, etc.
  brand?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  technicalSpecs?: string;
  configuration?: string;
  warranty?: string;
  maintenanceInterval?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  rentalPrice?: number;
  stockLocationId?: string;
  stockLocation?: StockLocation;
  stockQuantity: number;
  status: DeviceStatus;
  availableForRent: boolean;
  requiresMaintenance: boolean;
  installationDate?: Date;
  reservedUntil?: Date;
  location?: string;
  parameters?: DiagnosticParameter[];
  parameterValues?: ParameterValue[];
  patientId?: string;
  patient?: Patient;
  companyId?: string;
  company?: Company;
  diagnostics?: Diagnostic[];
  rentals?: Rental[];
  repairLogs?: RepairLog[];
  createdAt: Date;
  updatedAt: Date;
}
