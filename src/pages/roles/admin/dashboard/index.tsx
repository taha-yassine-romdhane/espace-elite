import { Button } from "@/components/ui/button";
import { useState } from "react";
import { SaleStepperDialog } from "./components/SaleStepperDialog";
import { DiagnosticStepperDialog } from "./components/DiagnosticStepperDialog";
import { RentStepperDialog } from "./components/RentStepperDialog";
import { Building2, ShoppingCart, Stethoscope } from "lucide-react";
import { useRouter } from "next/router";

// Import table components
import { DiagnosticTable } from "./components/tables/DiagnosticTable";
import { RentalTable } from "./components/tables/RentalTable";
import { SalesTable } from "./components/tables/SalesTable";
import { TabSwitcher } from "./components/TabSwitcher";

export default function DashboardPage() {
  const [selectedAction, setSelectedAction] = useState<"location" | "vente" | "diagnostique" | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnostics" | "rentals" | "sales">("diagnostics");
  const router = useRouter();

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

        {/* Tab Switcher */}
        <TabSwitcher activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
        
        {/* Tables */}
        {activeTab === "diagnostics" && (
          <DiagnosticTable 
            onViewDetails={(id) => router.push(`/roles/admin/diagnostics/${id}`)} 
            onEnterResults={(id) => router.push(`/roles/admin/diagnostics/${id}/results`)}
          />
        )}
        
        {activeTab === "rentals" && (
          <RentalTable 
            onViewDetails={(id) => router.push(`/roles/admin/rentals/${id}`)}
            onEdit={(id) => router.push(`/roles/admin/rentals/${id}/edit`)}
          />
        )}
        
        {activeTab === "sales" && (
          <SalesTable 
            onViewDetails={(id) => router.push(`/roles/admin/sales/${id}`)}
            onEdit={(id) => router.push(`/roles/admin/sales/${id}/edit`)}
          />
        )}

        {/* Stepper Dialogs */}
        {selectedAction === "vente" && (
          <SaleStepperDialog
            isOpen={true}
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
        
        {selectedAction === "location" && (
          <RentStepperDialog
            isOpen={true}
            onClose={() => setSelectedAction(null)}
          />
        )}
      </div>
    </div>
  );
}