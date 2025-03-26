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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-all duration-300 border-blue-100 hover:border-blue-200 bg-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Location</h2>
              </div>
              <p className="text-gray-600 mb-6 min-h-[48px]">
                Gérer les locations d'équipements médicaux et suivre leur disponibilité
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setSelectedAction("location")}
              >
                Commencer une Location
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-blue-100 hover:border-blue-200 bg-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Vente</h2>
              </div>
              <p className="text-gray-600 mb-6 min-h-[48px]">
                Gérer les ventes d'équipements médicaux et suivre l'inventaire
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setSelectedAction("vente")}
              >
                Commencer une Vente
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-blue-100 hover:border-blue-200 bg-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-full bg-blue-100 mr-4">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900">Diagnostic</h2>
              </div>
              <p className="text-gray-600 mb-6 min-h-[48px]">
                Gérer les services de diagnostic et suivre les examens médicaux
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setSelectedAction("diagnostique")}
              >
                Commencer un Diagnostic
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Use the regular stepper for location and vente */}
        {selectedAction && selectedAction !== "diagnostique" && (
          <NewStepperDialog
            isOpen={!!selectedAction}
            onClose={() => setSelectedAction(null)}
            action={selectedAction}
          />
        )}

        {/* Use the specialized diagnostic stepper for diagnostique */}
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