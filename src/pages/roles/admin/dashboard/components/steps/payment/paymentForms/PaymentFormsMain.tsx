/**
 * PaymentFormsMain.tsx
 * 
 * This file is now a simple re-export file that points to the new modular structure.
 * It maintains backward compatibility with existing code that imports from this file.
 */

import {
  PaymentDialog,
  PaymentProvider,
  usePayment,
  PaymentTypeCard,
  PaymentSummary,
  CNAMStepTracker,
  PAYMENT_TYPES,
  PaymentData,
  PaymentContextType,
  PaymentProviderProps,
  PaymentType
} from '../index';

// Re-export types for backward compatibility
export type {
  PaymentData,
  PaymentContextType,
  PaymentProviderProps,
  PaymentType
};

// Re-export components and hooks for backward compatibility
export {
  PaymentProvider,
  usePayment,
  PaymentDialog,
  PaymentTypeCard,
  PaymentSummary,
  CNAMStepTracker,
  PAYMENT_TYPES
};

/**
 * The default export of this module is an object containing all the payment-related components and hooks.
 * This object is used in the PaymentStep component to render the payment step.
 * @typedef {Object} PaymentForms
 * @property {React.ComponentType<PaymentDialogProps>} PaymentDialog - The payment dialog component.
 * @property {React.ComponentType<PaymentProviderProps>} PaymentProvider - The payment provider component.
 * @property {() => PaymentContextType} usePayment - A hook to use the payment context.
 * @property {React.ComponentType<PaymentTypeCardProps>} PaymentTypeCard - A component for the payment type selection card.
 * @property {React.ComponentType<PaymentSummaryProps>} PaymentSummary - A component for the payment summary.
 * @property {React.ComponentType<PaymentStepTrackerProps>} PaymentStepTracker - A component for the payment step tracker.
 * @property {PaymentType[]} PAYMENT_TYPES - An array of payment types.
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
