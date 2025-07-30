import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Building2, User, Calendar, CreditCard, Package, MapPin, Phone, Check, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ClientDetails {
  id: string;
  firstName?: string;
  lastName?: string;
  nomComplet?: string;
  telephone?: string;
  address?: string;
  cin?: string;
  cnamId?: string;
  // For company
  nomSociete?: string;
  matriculeFiscale?: string;
  type: "patient" | "societe";
}

interface Step {
  id: number;
  name: string;
  description: string;
}

interface RentStepperSidebarProps {
  steps: ReadonlyArray<Step> | readonly {
    id: number;
    name: string;
    description: string;
  }[];
  currentStep: number;
  clientDetails: ClientDetails | null;
  selectedProducts: any[];
  totalPrice?: number;
  rentalDetails?: any;
  paymentData?: any;
}

export function RentStepperSidebar({ 
  steps = [], 
  currentStep, 
  clientDetails,
  selectedProducts = [],
  totalPrice = 0,
  rentalDetails,
  paymentData
}: RentStepperSidebarProps) {
  // Calculate rental duration and total
  const calculateRentalTotal = () => {
    if (!rentalDetails || selectedProducts.length === 0) {
      return {
        dailyTotal: totalPrice || 0,
        duration: 0,
        rentalTotal: 0,
        isOpenEnded: false
      };
    }

    const dailyTotal = selectedProducts.reduce((sum, product) => {
      const dailyPrice = typeof product.rentalPrice === 'number' 
        ? product.rentalPrice 
        : parseFloat(product.rentalPrice) || 0;
      const quantity = product.quantity || 1;
      return sum + (dailyPrice * quantity);
    }, 0);

    // Check if it's an open-ended rental
    const isOpenEnded = rentalDetails.isOpenEnded || !rentalDetails.endDate;
    
    // Calculate duration if not open-ended
    let duration = 0;
    let rentalTotal = 0;
    
    if (!isOpenEnded && rentalDetails.startDate && rentalDetails.endDate) {
      const startDate = new Date(rentalDetails.startDate);
      const endDate = new Date(rentalDetails.endDate);
      duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      rentalTotal = dailyTotal * duration;
    } else if (rentalDetails.duration) {
      // Use explicit duration if provided
      duration = rentalDetails.duration;
      rentalTotal = dailyTotal * duration;
    } else if (isOpenEnded) {
      // For open-ended, show daily rate
      duration = 1;
      rentalTotal = dailyTotal;
    }

    return {
      dailyTotal,
      duration,
      rentalTotal,
      isOpenEnded
    };
  };

  const rentalCalculation = calculateRentalTotal();

  return (
    <div className="w-96 border-r flex-shrink-0 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 pb-4">
        <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Nouvelle Location
        </h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Step Progress */}
        <div className="space-y-2 mb-6">
          {steps?.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : isActive ? (
                    <div className="h-5 w-5 rounded-full border-2 border-blue-600 bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-medium">
                      {step.id}
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                  )}>
                    {step.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Récapitulatif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client Summary */}
          {clientDetails && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="font-medium text-blue-800 mb-1">Patient:</div>
              <div className="text-sm font-medium text-gray-900">
                {clientDetails.nomComplet || `${clientDetails.firstName} ${clientDetails.lastName}`}
              </div>
              {clientDetails.telephone && (
                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <Phone className="h-3 w-3" />
                  {clientDetails.telephone}
                </div>
              )}
              {clientDetails.type === "patient" && clientDetails.cin && (
                <div className="text-sm text-gray-600 mt-1">
                  CIN: {clientDetails.cin}
                </div>
              )}
              {clientDetails.cnamId && (
                <Badge className="mt-2" variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  CNAM: {clientDetails.cnamId}
                </Badge>
              )}
            </div>
          )}

          {/* Equipment Summary */}
          {selectedProducts.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Équipements ({selectedProducts.length})
                </div>
                <div className="space-y-2">
                  {selectedProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-start text-sm p-2 bg-gray-50 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.name}</div>
                        <div className="text-gray-500 text-xs">
                          {product.type === "MEDICAL_DEVICE" ? "Appareil médical" : "Accessoire"}
                          {product.quantity > 1 && ` × ${product.quantity}`}
                        </div>
                      </div>
                      <div className="font-medium text-blue-600 ml-2">
                        {((typeof product.rentalPrice === 'number' ? product.rentalPrice : parseFloat(product.rentalPrice) || 0) * (product.quantity || 1)).toFixed(2)} DT/jour
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Rental Details */}
          {rentalDetails && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Période de location
                </div>
                <div className="text-sm space-y-1">
                  {rentalDetails.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Début:</span>
                      <span className="font-medium">{format(new Date(rentalDetails.startDate), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {rentalDetails.endDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="font-medium">{format(new Date(rentalDetails.endDate), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {rentalCalculation.isOpenEnded ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-orange-600">Location ouverte</span>
                    </div>
                  ) : rentalCalculation.duration > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durée:</span>
                      <span className="font-medium">{rentalCalculation.duration} jour{rentalCalculation.duration > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                {rentalDetails.urgentRental && (
                  <Badge className="mt-2" variant="destructive">
                    <Clock className="h-3 w-3 mr-1" />
                    Location urgente
                  </Badge>
                )}
              </div>
            </>
          )}

          {/* Payment Summary */}
          {paymentData && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Paiement
                </div>
                <div className="text-sm space-y-2">
                  {/* Patient Payment */}
                  {paymentData.depositAmount > 0 && (
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-xs font-medium text-blue-800 mb-1">Payé par patient:</div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caution ({paymentData.depositMethod}):</span>
                        <span className="font-medium">{paymentData.depositAmount} DT</span>
                      </div>
                    </div>
                  )}
                  
                  {/* CNAM Payment */}
                  {paymentData.cnamBonds && paymentData.cnamBonds.length > 0 && (
                    <div className="p-2 bg-green-50 rounded">
                      <div className="text-xs font-medium text-green-800 mb-1">Payé par CNAM:</div>
                      {paymentData.cnamBonds.map((bond: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>{bond.bondType} ({bond.coveredMonths} mois)</span>
                          <span className="font-medium">{bond.totalAmount} DT</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Gap Warning */}
                  {paymentData.paymentPeriods && paymentData.paymentPeriods.some((p: any) => p.isGapPeriod) && (
                    <div className="p-2 bg-orange-50 rounded">
                      <div className="text-xs font-medium text-orange-800 mb-1">Gap (non payé):</div>
                      <div className="flex justify-between text-xs">
                        <span>En attente CNAM</span>
                        <span className="font-medium text-orange-600">
                          {paymentData.paymentPeriods
                            .filter((p: any) => p.isGapPeriod)
                            .reduce((sum: number, p: any) => sum + p.amount, 0)
                            .toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Total Summary */}
          <Separator />
          <div className="space-y-2">
            {/* Daily Rate */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tarif journalier:</span>
              <span className="font-medium">{rentalCalculation.dailyTotal.toFixed(2)} DT/jour</span>
            </div>
            
            {/* Duration and calculation */}
            {rentalCalculation.isOpenEnded ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type location:</span>
                <span className="font-medium text-orange-600">Location ouverte</span>
              </div>
            ) : rentalCalculation.duration > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Durée:</span>
                  <span className="font-medium">{rentalCalculation.duration} jour{rentalCalculation.duration > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total location:</span>
                  <span className="font-medium">{rentalCalculation.rentalTotal.toFixed(2)} DT</span>
                </div>
              </>
            )}
            
            {/* Open-ended rental note */}
            {rentalCalculation.isOpenEnded && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <span className="font-medium">Note:</span> Tarification au jour, facturation selon utilisation réelle
              </div>
            )}
            
            {/* Deposit */}
            {paymentData?.depositAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Caution:</span>
                <span className="font-medium">+{paymentData.depositAmount} DT</span>
              </div>
            )}
            
            <Separator />
            
            {/* Final Total - Patient Payment Only */}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">
                Total payé par patient:
              </span>
              <span className="text-xl font-bold text-blue-600">
                {(paymentData?.depositAmount || 0).toFixed(2)} DT
              </span>
            </div>
            
            {/* CNAM Total */}
            {paymentData?.cnamBonds && paymentData.cnamBonds.length > 0 && (
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>+ CNAM (payé directement):</span>
                  <span className="font-medium text-green-600">
                    {paymentData.cnamBonds.reduce((sum: number, bond: any) => sum + bond.totalAmount, 0).toFixed(2)} DT
                  </span>
                </div>
              </div>
            )}
            
            {/* Gap Warning */}
            {paymentData?.paymentPeriods && paymentData.paymentPeriods.some((p: any) => p.isGapPeriod) && (
              <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                <span className="font-medium">Attention:</span> {
                  paymentData.paymentPeriods
                    .filter((p: any) => p.isGapPeriod)
                    .reduce((sum: number, p: any) => sum + p.amount, 0)
                    .toFixed(2)
                } DT en attente d'approbation CNAM
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RentStepperSidebar;