import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { NewStepperDialog } from "./components/NewStepperDialog";
import { DiagnosticStepperDialog } from "./components/DiagnosticStepperDialog";
import { Building2, ShoppingCart, Stethoscope } from "lucide-react";

export default function DashboardPage() {
  const [selectedAction, setSelectedAction] = useState<"location" | "vente" | "diagnostique" | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-blue-900">Tableau de Bord</h1>
        
        {/* Action Buttons Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button 
            className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
            onClick={() => setSelectedAction("location")}
          >
            <Building2 className="h-5 w-5" />
            <span>Commencer une Location</span>
          </Button>
          
          <Button 
            className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
            onClick={() => setSelectedAction("vente")}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Commencer une Vente</span>
          </Button>
          
          <Button 
            className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
            onClick={() => setSelectedAction("diagnostique")}
          >
            <Stethoscope className="h-5 w-5" />
            <span>Commencer un Diagnostic</span>
          </Button>
        </div>

        {/* Table Section - Add your table component here */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mt-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tableau Global</h2>
            {/* Replace this with your actual table component */}
            <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
              Tableau devien ici
            </div>
          </div>
        </div>

        {/* Stepper Dialogs */}
        {selectedAction && selectedAction !== "diagnostique" && (
          <NewStepperDialog
            isOpen={!!selectedAction}
            onClose={() => setSelectedAction(null)}
            action={selectedAction}
          />
        )}

        {selectedAction === "diagnostique" && (
          <DiagnosticStepperDialog
            isOpen={true}
            onClose={() => setSelectedAction(null)}
          />
        )}
      </div>
    </div>
  );
}