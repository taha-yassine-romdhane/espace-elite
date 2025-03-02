import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/Card";
import { useState } from "react";
import { StepperDialog } from "./components/StepperDialog";

export default function DashboardPage() {
  const [selectedAction, setSelectedAction] = useState<"location" | "vente" | "diagnostique" | null>(null);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <p className="text-gray-600 mb-4">Gérer les locations d'équipements médicaux</p>
            <Button 
              className="w-full"
              onClick={() => setSelectedAction("location")}
            >
              Commencer une Location
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Vente</h2>
            <p className="text-gray-600 mb-4">Gérer les ventes d'équipements médicaux</p>
            <Button 
              className="w-full"
              onClick={() => setSelectedAction("vente")}
            >
              Commencer une Vente
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic</h2>
            <p className="text-gray-600 mb-4">Gérer les services de diagnostic</p>
            <Button 
              className="w-full"
              onClick={() => setSelectedAction("diagnostique")}
            >
              Commencer un Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>

      <StepperDialog
        isOpen={!!selectedAction}
        onClose={() => setSelectedAction(null)}
        action={selectedAction}
      />
    </div>
  );
}