import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Building2, User } from "lucide-react";

interface ClientDetails {
  id: string;
  firstName?: string;
  lastName?: string;
  nomComplet?: string;
  telephone?: string;
  address?: string;
  cin?: string;
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
}

export function RentStepperSidebar({ 
  steps = [], 
  currentStep, 
  clientDetails,
  selectedProducts = [],
  totalPrice = 0
}: RentStepperSidebarProps) {
  return (
    <div className="w-80 border-r flex-shrink-0 flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <div className="p-4 border-b bg-blue-50 sticky top-0">
        <h3 className="font-semibold text-green-800 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Nouvelle Location
        </h3>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Client Info Card - Show when a client is selected */}
        {clientDetails && (
          <div className="mb-6 overflow-hidden rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm">
            {/* Header with client name */}
            <div className="bg-green-600 p-3 text-white">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-lg">
                    {clientDetails.nomComplet || `${clientDetails.firstName} ${clientDetails.lastName}`}
                  </h4>
                  <p className="text-xs text-blue-100">
                    {clientDetails.type === "patient"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Client details */}
            <div className="p-3 text-sm space-y-2">
              {clientDetails.telephone && (
                <div className="flex items-center gap-2 text-green-800">
                  <span className="font-medium">Téléphone:</span> 
                  <span>{clientDetails.telephone}</span>
                </div>
              )}
              {clientDetails.type === "patient" && clientDetails.cin && (
                <div className="flex items-center gap-2 text-green-800">
                  <span className="font-medium">CIN:</span> 
                  <span>{clientDetails.cin}</span>
                </div>
              )}
              {clientDetails.address && (
                <div className="flex items-center gap-2 text-green-800">
                  <span className="font-medium">Adresse:</span> 
                  <span className="truncate">{clientDetails.address}</span>
                </div>
              )}
            </div>
            
            {/* Status badge */}
            <div className="px-3 pb-3">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                En cours de location
              </span>
            </div>
          </div>
        )}
        
        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
            <div className="bg-green-600 p-3 text-white">
              <h4 className="font-medium">Appareils Sélectionnés</h4>
            </div>
            <div className="p-3 space-y-3">
              {selectedProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-gray-500 text-xs">
                      {product.type === "MEDICAL_DEVICE" ? "Appareil" :
                       product.type === "ACCESSORY" ? "Accessoire" : "Autre"}
                    </div>
                  </div>
                  <div className="font-medium">{typeof product.rentalPrice === 'number' ? product.rentalPrice.toFixed(2) : (parseFloat(product.rentalPrice) || 0).toFixed(2)} DT</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stepper */}
        <div className="relative space-y-6 mt-2">
          {steps?.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative">
                {/* Connecting line to previous step */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-0 left-5 w-0.5",
                      "h-6 -translate-y-6", // Fixed height and position
                      isCompleted ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
                <div className="flex gap-4 relative">
                  <div
                    className={cn(
                      "flex-shrink-0 mt-0.5",
                      isActive && "animate-pulse"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-10 w-10 text-green-600 fill-green-100" />
                    ) : isActive ? (
                      <div className="h-10 w-10 rounded-full border-2 border-green-600 bg-green-50 flex items-center justify-center text-green-600 font-medium">
                        {step.id}
                      </div>
                    ) : (
                      <Circle className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3
                      className={cn(
                        "font-medium",
                        isActive
                          ? "text-green-600"
                          : isCompleted
                          ? "text-green-700"
                          : "text-gray-400"
                      )}
                    >
                      {step.name}
                    </h3>
                    <p
                      className={cn(
                        "text-sm",
                        isActive || isCompleted
                          ? "text-gray-600"
                          : "text-gray-400"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Price - Fixed at bottom */}
      <div className="p-4 border-t bg-gradient-to-r from-green-50 to-indigo-50 sticky bottom-0">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm text-gray-600">Montant Total</span>
            <div className="text-xl font-bold text-green-700">
              {totalPrice > 0 ? `${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00'} DT` : "À calculer"}
            </div>
          </div>
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
            En cours
          </div>
        </div>
      </div>
    </div>
  );
}

export default RentStepperSidebar;