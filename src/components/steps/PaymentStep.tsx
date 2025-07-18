import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Printer, Save, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

// Import the new payment system
import { PaymentData } from "@/components/payment/paymentForms";
import { transformPaymentData, validatePaymentData } from "@/lib/payment-utils";
// Import PaymentDialog dynamically to prevent SSR issues
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled to prevent rendering during build
const PaymentDialog = dynamic(
  () => import("@/components/payment/components/PaymentDialog"),
  { ssr: false }
);

interface PaymentStepProps {
  onBack: () => void;
  onComplete: (paymentData: any) => void;
  selectedClient: any;
  selectedProducts: any[];
  calculateTotal: () => number;
  isRental?: boolean;
}

export function PaymentStep({
  onBack,
  onComplete,
  selectedClient,
  selectedProducts,
  calculateTotal,
  isRental = false
}: PaymentStepProps) {
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [savedPayments, setSavedPayments] = useState<PaymentData[]>([]);
  const { toast } = useToast();

  // Check if selected client is a patient
  const isPatient = selectedClient?.type === "patient";

  // Calculate payment totals
  const totalAmount = calculateTotal();
  const paidAmount = savedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const isComplete = paidAmount >= totalAmount;

  // Group payments by method
  const groupedPayments = savedPayments.reduce((acc, payment) => {
    if (!acc[payment.type]) {
      acc[payment.type] = [];
    }
    acc[payment.type].push(payment);
    return acc;
  }, {} as Record<string, PaymentData[]>);

  // Get payment method label
  const getMethodLabel = (methodId: string) => {
    const methodLabels: Record<string, string> = {
      especes: "Espèces",
      cheque: "Chèque",
      virement: "Virement",
      mondat: "Mandat",
      cnam: "CNAM",
      traite: "Traite"
    };
    return methodLabels[methodId] || methodId.charAt(0).toUpperCase() + methodId.slice(1);
  };

  // Handle payment completion
  const handlePaymentComplete = async (payments: PaymentData[]) => {
    try {
      // Validate payment data
      const validation = validatePaymentData(payments);
      if (!validation.isValid) {
        toast({
          title: "Erreur de validation",
          description: validation.errors.join(", "),
          variant: "destructive"
        });
        return;
      }

      // Add timestamp to payments if they don't have one
      const paymentsWithTimestamp = payments.map(payment => ({
        ...payment,
        timestamp: payment.timestamp || new Date().toISOString()
      }));
      
      // Transform payment data to API format
      const apiPayload = transformPaymentData(
        paymentsWithTimestamp,
        isPatient ? selectedClient?.id : undefined,
        !isPatient ? selectedClient?.id : undefined,
        undefined, // saleId - will be set by parent component
        isRental ? "temp-rental-id" : undefined, // rentalId - will be set by parent component
        undefined // diagnosticId
      );

      // Save to database
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde du paiement');
      }

      const result = await response.json();
      
      // Save the payments locally for UI display
      setSavedPayments(paymentsWithTimestamp);
      
      // Check if we have any CNAM payments with pending status
      const hasPendingCNAM = paymentsWithTimestamp.some(
        payment => payment.type === 'cnam' && payment.isPending
      );
      
      // Calculate if payment is financially complete (even if CNAM is pending)
      const newPaidAmount = paymentsWithTimestamp.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const isFinanciallyComplete = newPaidAmount >= totalAmount;
      
      // Show success message
      toast({
        title: "Paiement enregistré avec succès",
        description: `Montant: ${newPaidAmount.toFixed(2)} DT`
      });

      // If we have a complete payment, finalize it
      if (isFinanciallyComplete) {
        // Prepare the payment data to be sent to the parent component
        const paymentData = {
          payments: paymentsWithTimestamp,
          paymentRecord: result.data, // Include the database record
          totalAmount: calculateTotal(),
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, totalAmount - newPaidAmount),
          status: hasPendingCNAM ? 'COMPLETED_WITH_PENDING_CNAM' : 'COMPLETED',
          client: selectedClient,
          products: selectedProducts,
          hasPendingCNAM,
          pendingCNAMDetails: hasPendingCNAM ? 
            paymentsWithTimestamp.filter(p => p.type === 'cnam' && p.isPending) : 
            []
        };
        
        // Call the onComplete callback with the payment data
        onComplete(paymentData);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
      toast({
        title: "Erreur lors de la sauvegarde",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle print receipt
  const handlePrintReceipt = () => {
    // In a real app, this would generate a receipt and print it
    console.log('Printing receipt for payments:', savedPayments);
    // For now, we'll just open a print dialog
    window.print();
  };

  // Handle save partial payment
  const handleSavePartial = async () => {
    try {
      if (savedPayments.length === 0) {
        toast({
          title: "Aucun paiement à sauvegarder",
          variant: "destructive"
        });
        return;
      }

      // Transform and save partial payment
      const apiPayload = transformPaymentData(
        savedPayments,
        isPatient ? selectedClient?.id : undefined,
        !isPatient ? selectedClient?.id : undefined,
        undefined,
        isRental ? "temp-rental-id" : undefined,
        undefined
      );

      // Update status to indicate partial payment
      apiPayload.status = 'PENDING';
      apiPayload.notes = JSON.stringify({
        ...JSON.parse(apiPayload.notes || '{}'),
        isPartialPayment: true,
        savedAt: new Date().toISOString()
      });

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      toast({
        title: "Paiement partiel sauvegardé",
        description: "Vous pouvez continuer plus tard"
      });

      const paymentData = {
        payments: savedPayments,
        totalAmount,
        paidAmount,
        remainingAmount,
        status: 'PARTIAL',
        client: selectedClient,
        products: selectedProducts,
        isPartialSave: true
      };
      
      onComplete(paymentData);
    } catch (error) {
      console.error('Error saving partial payment:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite";
      toast({
        title: "Erreur lors de la sauvegarde",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" /> Retour
        </Button>
        <h2 className="text-2xl font-bold text-center">Paiement</h2>
        <div className="w-[100px]"></div> {/* Spacer for alignment */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium">Détails du Paiement</h3>
          
          {/* Payment status indicator */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full", 
              isComplete ? "bg-green-500" : "bg-amber-500"
            )}></div>
            <span className={cn(
              "text-sm", 
              isComplete ? "text-green-700" : "text-amber-700"
            )}>
              {isComplete ? 'Paiement complet' : `Reste à payer: ${remainingAmount.toFixed(2)} DT`}
            </span>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-gray-500">Montant total: {totalAmount.toFixed(2)} DT</p>
        </div>

        {savedPayments.length > 0 ? (
          <div className="space-y-6">
            {/* Payment methods recapitulative */}
            <div className="mt-6 bg-white rounded-lg border p-4">
              <h4 className="font-medium mb-3">Récapitulatif des Paiements</h4>
              
              <div className="space-y-4">
                {Object.entries(groupedPayments).map(([method, methodPayments]) => {
                  const methodTotal = methodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                  
                  return (
                    <div key={method} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{getMethodLabel(method)}</h5>
                        <span className="font-bold text-blue-700">
                          {methodTotal.toFixed(2)} DT
                        </span>
                      </div>
                      
                      {/* List individual payments within this method */}
                      <div className="space-y-1 pl-4">
                        {methodPayments.map((payment, idx) => {
                          // Get payment details based on type
                          let details = '';
                          if (payment.type === 'cheque' && payment.chequeNumber) {
                            details = ` - N° ${payment.chequeNumber}`;
                          } else if (payment.type === 'virement' && payment.reference) {
                            details = ` - Réf: ${payment.reference}`;
                          } else if (payment.type === 'traite' && payment.echeance) {
                            details = ` - Échéance: ${payment.echeance}`;
                          }
                          
                          return (
                            <div key={idx} className="flex justify-between text-sm group">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-600">
                                  {payment.classification === 'principale' ? 'Principal' : 
                                  payment.classification === 'garantie' ? 'Garantie' : 'Complément'}
                                  {details}
                                </span>
                                {payment.timestamp && (
                                  <span className="text-xs text-gray-400 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(payment.timestamp).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <span>{payment.amount?.toFixed(2)} DT</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t">
                <div className="flex justify-between font-medium">
                  <span>Total des paiements:</span>
                  <span className="text-blue-700">{paidAmount.toFixed(2)} DT</span>
                </div>
                
                <div className="flex justify-between mt-1">
                  <span>Montant Total:</span>
                  <span className="font-medium">{totalAmount.toFixed(2)} DT</span>
                </div>
                
                {remainingAmount > 0 && (
                  <div className="flex justify-between mt-1 text-amber-600">
                    <span>Reste à Payer:</span>
                    <span className="font-medium">{remainingAmount.toFixed(2)} DT</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handlePrintReceipt}
              >
                <Printer className="h-4 w-4" />
                Aperçu du reçu
              </Button>
              
              {!isComplete && (
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleSavePartial}
                >
                  <Save className="h-4 w-4" />
                  Enregistrer et continuer plus tard
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun paiement n'a été ajouté.</p>
            <p className="text-sm mt-1">Cliquez sur le bouton ci-dessous pour ajouter un paiement.</p>
          </div>
        )}

        <div className="mt-6">
          <Button 
            onClick={() => setPaymentDetailsOpen(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {savedPayments.length > 0 ? 'Modifier les Paiements' : 'Ajouter un Paiement'}
          </Button>
        </div>

        {savedPayments.length > 0 && isComplete && (
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={() => onComplete({ 
                payments: savedPayments,
                totalAmount,
                paidAmount,
                remainingAmount,
                status: 'COMPLETED'
              })}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Terminer le Paiement
            </Button>
          </div>
        )}
      </div>

      {/* New Payment Dialog */}
      <PaymentDialog 
        open={paymentDetailsOpen}
        onOpenChange={setPaymentDetailsOpen}
        totalAmount={calculateTotal()}
        onComplete={handlePaymentComplete}
        selectedProducts={selectedProducts}
        isRental={isRental}
        isCompany={!isPatient}
      />
    </div>
  );
}

export default PaymentStep;