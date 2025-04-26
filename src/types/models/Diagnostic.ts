import { MedicalDevice } from './MedicalDevice';
import { Patient } from './Patient';
import { Company } from './Company';
import { User } from './User';
import { ParameterValue } from './ParameterValue';

export interface Diagnostic {
  id: string;
  medicalDeviceId: string;
  medicalDevice: MedicalDevice;
  patientId: string;
  patient: Patient;
  result: string;
  notes?: string;
  diagnosticDate: Date;
  performedById?: string;
  performedBy?: User;
  followUpRequired: boolean;
  followUpDate?: Date;
  parameterValues?: ParameterValue[];
  companyId?: string;
  company?: Company;
  createdAt: Date;
  updatedAt: Date;
}
