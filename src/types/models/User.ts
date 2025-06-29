import { Role } from '../enums';
import { Doctor } from './Doctor';
import { Patient } from './Patient';
import { Company } from './Company';
import { Task } from './Task';
import { StockLocation } from './StockLocation';
import { StockTransfer } from './StockTransfer';
import { Technician } from './Technician';
import { PatientHistory } from './PatientHistory';
import { UserActionHistory } from './UserActionHistory';
import { Diagnostic } from './Diagnostic';

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  telephone?: string;
  address?: string;
  speciality?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  doctor?: Doctor;
  technician?: Technician[];
  assignedPatients?: Patient[];
  assignedCompanies?: Company[];
  technicianPatients?: Patient[];
  technicianCompanies?: Company[];
  tasks?: Task[];
  stockLocation?: StockLocation;
  stockTransfers?: StockTransfer[];
  sentTransfers?: StockTransfer[];
  receivedTransfers?: StockTransfer[];
  patientHistories?: PatientHistory[];
  userActions?: UserActionHistory[];
  performedDiagnostics?: Diagnostic[];
  verifiedTransfers?: StockTransfer[];
}
