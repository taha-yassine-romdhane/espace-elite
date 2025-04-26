import { DiagnosticParameter } from './DiagnosticParameter';
import { MedicalDevice } from './MedicalDevice';
import { Diagnostic } from './Diagnostic';

export interface ParameterValue {
  id: string;
  value: string;
  parameter: DiagnosticParameter; // DiagnosticParameter
  parameterId: string;
  medicalDevice: MedicalDevice; // MedicalDevice
  medicalDeviceId: string;
  diagnostic?: Diagnostic; // Diagnostic
  diagnosticId?: string;
  createdAt: Date;
  updatedAt: Date;
}
