import { MedicalDevice } from './MedicalDevice';
import { ParameterValue } from './ParameterValue';

export interface DiagnosticParameter {
  id: string;
  title: string;
  type: string; // INPUT, CHECKBOX, NUMBER
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  isAutomatic: boolean;
  parameterType: string; // PARAMETER or RESULT
  resultDueDate?: string;
  deviceId: string;
  device: MedicalDevice; // MedicalDevice
  value?: string;
  parameterValues?: ParameterValue[]; // ParameterValue[]
  createdAt: Date;
  updatedAt: Date;
}
