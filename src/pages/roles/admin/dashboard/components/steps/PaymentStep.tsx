import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Banknote, 
  CreditCard, 
  Building, 
  ArrowUpRight, 
  Mail, 
  FileCheck
} from "lucide-react";

// Import our smaller components
import PaymentTypeCard from "./payment/PaymentTypeCard";
import PaymentStepProgress, { PaymentStep as ProgressStep } from "./payment/PaymentStepProgress";
import PaymentDetailsForm from "./payment/PaymentDetailsForm";

// Using the PaymentStep interface from PaymentStepProgress component

interface PaymentTypeConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  steps: any[];
  fields: {
    amount: number;
    deposit?: number;
    balance?: number;
    bankName?: string;
    checkNumber?: string;
    owner?: string;
    dueDate?: string;
    transactionId?: string;
    mandateNumber?: string;
    amountCovered?: number;
    depositDate?: string;
  };
}

interface PaymentStepProps {
  onBack: () => void;
  onComplete: (paymentData: any) => void;
  selectedClient: any;
  selectedProducts: any[];
  calculateTotal: () => number;
}

export function PaymentStep({ 
  onBack, 
  onComplete, 
  selectedClient,
  selectedProducts,
  calculateTotal 
}: PaymentStepProps) {
  const [activePaymentType, setActivePaymentType] = useState<string | null>(null);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [currentPaymentConfig, setCurrentPaymentConfig] = useState<PaymentTypeConfig | null>(null);
  const [stepFormData, setStepFormData] = useState<any>({});
  
  // Check if selected client is a patient
  const isPatient = selectedClient?.type === "patient";
  
  // Initialize payment types with their respective steps
  const paymentTypes: PaymentTypeConfig[] = [
    {
      id: "cash",
      title: "Paiement en Espèce",
      description: "Paiement direct en espèces avec option d'acompte",
      icon: Banknote,
      steps: [
        { id: "reception", label: "Réception du Patient", description: "Accueil du patient et explication du processus", completed: false },
        { id: "amount", label: "Détermination du Montant", description: "Calcul du montant total et de l'acompte", completed: false },
        { id: "receipt", label: "Remise du Reçu", description: "Fourniture d'un reçu pour le paiement", completed: false },
        { id: "record", label: "Enregistrement", description: "Saisie des informations dans le système", completed: false },
        { id: "confirmation", label: "Confirmation", description: "Confirmation du paiement et clôture", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        deposit: 0,
        balance: calculateTotal()
      }
    },
    {
      id: "check",
      title: "Paiement par Chèque",
      description: "Paiement par chèque bancaire",
      icon: CreditCard,
      steps: [
        { id: "verification", label: "Vérification du Chèque", description: "Vérification des informations du chèque", completed: false },
        { id: "info", label: "Saisie des Informations", description: "Saisie des détails du chèque", completed: false },
        { id: "deposit", label: "Dépôt du Chèque", description: "Enregistrement du dépôt du chèque", completed: false },
        { id: "follow-up", label: "Suivi", description: "Suivi de l'encaissement du chèque", completed: false },
        { id: "completion", label: "Finalisation", description: "Confirmation de l'encaissement", completed: false },
        { id: "archive", label: "Archivage", description: "Archivage des documents relatifs au paiement", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        bankName: "",
        checkNumber: "",
        owner: "",
        dueDate: ""
      }
    },
    {
      id: "cnam",
      title: "Paiement CNAM",
      description: "Paiement avec assurance CNAM pour CPAP",
      icon: Building,
      steps: [
        { id: "agreement", label: "Accord est avec patient", description: "Confirmation de l'accord avec le patient", completed: false },
        { id: "paperwork", label: "Préparation des Documents", description: "Collecte et préparation des documents nécessaires", completed: false },
        { id: "submission", label: "Soumission à la CNAM", description: "Envoi du dossier à la CNAM", completed: false },
        { id: "approval", label: "Approbation", description: "Suivi de l'approbation par la CNAM", completed: false },
        { id: "reimbursement", label: "Remboursement", description: "Réception du remboursement de la CNAM", completed: false },
        { id: "reconciliation", label: "Rapprochement", description: "Rapprochement des comptes", completed: false },
        { id: "completion", label: "Clôture", description: "Clôture du dossier de paiement CNAM", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        amountCovered: 0,
        depositDate: new Date().toISOString().split('T')[0]
      }
    },
    {
      id: "transfer",
      title: "Virement Bancaire",
      description: "Paiement par virement bancaire",
      icon: ArrowUpRight,
      steps: [
        { id: "reception", label: "Réception des Coordonnées", description: "Collecte des informations bancaires", completed: false },
        { id: "instructions", label: "Instructions de Virement", description: "Fourniture des instructions pour le virement", completed: false },
        { id: "confirmation", label: "Confirmation de Réception", description: "Vérification de la réception du virement", completed: false },
        { id: "recording", label: "Enregistrement", description: "Enregistrement du paiement dans le système", completed: false },
        { id: "receipt", label: "Émission de Reçu", description: "Envoi d'un reçu au client", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        bankName: "",
        transactionId: ""
      }
    },
    {
      id: "mandate",
      title: "Paiement par Mandat",
      description: "Paiement par mandat postal",
      icon: Mail,
      steps: [
        { id: "reception", label: "Réception du Mandat", description: "Réception et vérification du mandat", completed: false },
        { id: "verification", label: "Vérification", description: "Vérification de l'authenticité du mandat", completed: false },
        { id: "deposit", label: "Dépôt", description: "Dépôt du mandat pour encaissement", completed: false },
        { id: "confirmation", label: "Confirmation", description: "Confirmation de l'encaissement", completed: false },
        { id: "recording", label: "Enregistrement", description: "Enregistrement dans le système", completed: false },
        { id: "closure", label: "Clôture", description: "Clôture du dossier de paiement par mandat", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        mandateNumber: ""
      }
    },
    {
      id: "draft",
      title: "Paiement par Traite",
      description: "Paiement par traite bancaire",
      icon: FileCheck,
      steps: [
        { id: "creation", label: "Création de la Traite", description: "Préparation du document de traite", completed: false },
        { id: "signature", label: "Signature", description: "Signature du document par les parties", completed: false },
        { id: "registration", label: "Enregistrement", description: "Enregistrement de la traite dans le système", completed: false },
        { id: "deposit", label: "Dépôt", description: "Dépôt de la traite à la banque", completed: false },
        { id: "follow-up", label: "Suivi", description: "Suivi de l'encaissement de la traite", completed: false },
        { id: "confirmation", label: "Confirmation", description: "Confirmation de l'encaissement", completed: false },
        { id: "archiving", label: "Archivage", description: "Archivage des documents", completed: false }
      ],
      fields: {
        amount: calculateTotal(),
        bankName: "",
        checkNumber: "",
        owner: "",
        dueDate: ""
      }
    }
  ];

  const handlePaymentTypeSelect = (paymentType: PaymentTypeConfig) => {
    setActivePaymentType(paymentType.id);
    setCurrentPaymentConfig(paymentType);
    setStepFormData(paymentType.fields);
    setPaymentDetailsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStepFormData((prev : any) => {
      const newData = { ...prev, [name]: value };
      
      // Calculate balance if deposit is changed for cash payment
      if (name === 'deposit' && currentPaymentConfig?.id === 'cash') {
        const deposit = parseFloat(value) || 0;
        const total = calculateTotal();
        newData.balance = total - deposit;
      }
      
      // Calculate patient contribution if CNAM covered amount is changed
      if (name === 'amountCovered' && currentPaymentConfig?.id === 'cnam') {
        const covered = parseFloat(value) || 0;
        const total = calculateTotal();
        newData.balance = total - covered;
      }
      
      return newData;
    });
  };

  const handleStepCompletion = (stepId: string) => {
    if (!currentPaymentConfig) return;
    
    const updatedSteps = currentPaymentConfig.steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    
    setCurrentPaymentConfig({
      ...currentPaymentConfig,
      steps: updatedSteps
    });
  };

  const handlePaymentComplete = () => {
    if (!currentPaymentConfig) return;
    
    const paymentData = {
      type: currentPaymentConfig.id,
      clientId: selectedClient?.id,
      clientType: selectedClient?.type,
      products: selectedProducts.map(p => ({ id: p.id, quantity: p.quantity || 1 })),
      amount: parseFloat(stepFormData.amount) || calculateTotal(),
      ...stepFormData,
      steps: currentPaymentConfig.steps.map(step => ({
        id: step.id,
        completed: step.completed
      }))
    };
    
    onComplete(paymentData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-blue-900">Sélectionner le Type de Paiement</h3>
      
      {/* Payment Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paymentTypes.map(paymentType => (
          <PaymentTypeCard 
            key={paymentType.id}
            id={paymentType.id}
            title={paymentType.title}
            description={paymentType.description}
            icon={paymentType.icon}
            isActive={activePaymentType === paymentType.id}
            onClick={() => handlePaymentTypeSelect(paymentType)}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          onClick={handlePaymentComplete}
          disabled={!activePaymentType}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          Terminer
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={paymentDetailsOpen} onOpenChange={setPaymentDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-blue-900">
              {currentPaymentConfig && (
                <>
                  <currentPaymentConfig.icon className="h-5 w-5" />
                  {currentPaymentConfig.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {currentPaymentConfig && (
              <div className="flex gap-6">
                {/* Left Side - Steps Progress */}
                <div className="w-1/3 border-r pr-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-4">PROGRESSION</h4>
                  <PaymentStepProgress 
                    steps={currentPaymentConfig.steps} 
                    onStepComplete={handleStepCompletion} 
                  />
                </div>
                
                {/* Right Side - Payment Details Form */}
                <div className="w-2/3">
                  <h4 className="font-medium text-sm text-gray-500 mb-4">DÉTAILS DU PAIEMENT</h4>
                  <PaymentDetailsForm 
                    paymentType={currentPaymentConfig.id}
                    formData={stepFormData}
                    onInputChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 flex justify-end">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setPaymentDetailsOpen(false)}
            >
              Enregistrer et Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentStep;