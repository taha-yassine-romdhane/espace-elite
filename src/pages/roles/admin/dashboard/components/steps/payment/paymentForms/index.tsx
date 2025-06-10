import EspecesForm from './EspecesForm';
import ChequeForm from './ChequeForm';
import MondatForm from './MondatForm';
import VirementForm from './VirementForm';
import CNAMForm from './CNAMForm';
import TraiteForm from './TraiteForm';
import PaymentForms, { PaymentDialog, PaymentProvider, usePayment } from './PaymentFormsMain';
// Using 'export type' for type exports when isolatedModules is enabled
import type { PaymentData } from './PaymentFormsMain';

// Export individual forms for direct use if needed
export {
  EspecesForm,
  ChequeForm,
  MondatForm,
  VirementForm,
  CNAMForm,
  TraiteForm,
  PaymentDialog,
  PaymentProvider,
  usePayment
};

// Export types
export type { PaymentData };

// Export the main PaymentForms component as default
export default PaymentForms;
