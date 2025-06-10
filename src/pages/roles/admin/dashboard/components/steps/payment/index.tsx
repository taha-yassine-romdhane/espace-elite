/**
 * Payment module index file
 * This file exports all payment-related components, hooks, and configurations
 */

// Export context and hooks
export { 
  PaymentProvider, 
  usePayment 
} from './context/PaymentContext';
export type { 
  PaymentData, 
  PaymentContextType, 
  PaymentProviderProps 
} from './context/PaymentContext';

// Export components
export { default as PaymentDialog } from './components/PaymentDialog';
export { default as PaymentSummary } from './components/PaymentSummary';
export { default as PaymentTypeCard } from './components/PaymentTypeCard';
export { default as CNAMStepTracker } from './components/CNAMStepTracker';

// Export payment types configuration
export { PAYMENT_TYPES } from './config/paymentTypes';
export type { PaymentType } from './config/paymentTypes';

// For backward compatibility, re-export the main module
import PaymentDialog from './components/PaymentDialog';
import { PaymentProvider, usePayment } from './context/PaymentContext';
import PaymentTypeCard from './components/PaymentTypeCard';
import PaymentSummary from './components/PaymentSummary';
import CNAMStepTracker from './components/CNAMStepTracker';
import { PAYMENT_TYPES } from './config/paymentTypes';

/**
 * Default export for backward compatibility
 */
export default {
  PaymentDialog,
  PaymentProvider,
  usePayment,
  PaymentTypeCard,
  PaymentSummary,
  CNAMStepTracker,
  PAYMENT_TYPES
};
