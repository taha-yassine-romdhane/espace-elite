import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Building2, ShoppingCart, Stethoscope, Calendar, ListTodo, FileText } from "lucide-react";
import { useRouter } from "next/router";
import EmployeeLayout from '../EmployeeLayout';
import { TabSwitcher } from "./components/TabSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import RentalStatistics from '../location/components/RentalStatistics';

// Import new Excel table components
import AppointmentsExcelTable from "./components/tables/AppointmentsExcelTable";
import DiagnosticsExcelTable from "../diagnostics/DiagnosticsExcelTable";
import CNAMRappelsTable from "../sales/components/CNAMRappelsTable";
import EmployeeManualTasksTable from "../manual-tasks/index";

// Import dialogs
import { CreateAppointmentDialog } from "@/components/appointments/CreateAppointmentDialog";
import { CreateDiagnosticDialog } from "@/components/diagnostics/CreateDiagnosticDialog";
import { CompleteDiagnosticDialog } from "@/components/diagnostics/CompleteDiagnosticDialog";
import { CreateSaleDialog } from "@/components/sales/CreateSaleDialog";
import { RentalCreationDialog } from "@/components/dialogs/RentalCreationDialog";

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"appointments" | "diagnostics" | "sales" | "rentals" | "manual-tasks">("manual-tasks");
  const router = useRouter();

  // Dialog states
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);
  const [completeDiagnosticDialogOpen, setCompleteDiagnosticDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);

  return (
    <div className="py-4 px-3">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-green-900">Tableau de Bord</h1>

      {/* Action Buttons Row - Hidden on mobile (quick actions available in sidebar menu) */}
      <div className="hidden md:block mb-8">
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 items-center">
          <Button
            className="w-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
            onClick={() => router.push("/roles/employee/manual-tasks")}
          >
            <ListTodo className="h-5 w-5" />
            <span>Mes Tâches</span>
          </Button>

          <Button
            className="w-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
            onClick={() => setAppointmentDialogOpen(true)}
          >
            <Calendar className="h-5 w-5" />
            <span>Nouveau Rendez-vous</span>
          </Button>

          {/* Diagnostic buttons grouped in a frame */}
          <div className="lg:col-span-2 border-2 border-blue-300 rounded-lg p-1 bg-blue-50/30">
            <div className="grid grid-cols-2 gap-2">
              <Button
                className="w-full h-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                onClick={() => setDiagnosticDialogOpen(true)}
              >
                <Stethoscope className="h-5 w-5" />
                <span>Commencer Diagnostic</span>
              </Button>

              <Button
                className="w-full h-full bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                onClick={() => setCompleteDiagnosticDialogOpen(true)}
              >
                <FileText className="h-5 w-5" />
                <span>Compléter Résultats</span>
              </Button>
            </div>
          </div>

          <Button
            className="w-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
            onClick={() => setSaleDialogOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Commencer une Vente</span>
          </Button>

          <Button
            className="w-full bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
            onClick={() => setRentalDialogOpen(true)}
          >
            <Building2 className="h-5 w-5" />
            <span>Commencer une Location</span>
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <TabSwitcher activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />

      {/* Tables */}
      {activeTab === "appointments" && (
        <Card>
          <CardContent className="pt-6">
            <AppointmentsExcelTable />
          </CardContent>
        </Card>
      )}

      {activeTab === "diagnostics" && (
        <Card>
          <CardContent className="pt-6">
            <DiagnosticsExcelTable />
          </CardContent>
        </Card>
      )}

      {activeTab === "sales" && (
        <Card>
          <CardContent className="pt-6">
            <CNAMRappelsTable showActions={false} />
          </CardContent>
        </Card>
      )}

      {activeTab === "rentals" && (
        <RentalStatistics />
      )}

      {activeTab === "manual-tasks" && (
        <Card>
          <CardContent className="pt-6">
            <EmployeeManualTasksTable />
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateAppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
      />
      <CreateDiagnosticDialog
        open={diagnosticDialogOpen}
        onOpenChange={setDiagnosticDialogOpen}
      />
      <CompleteDiagnosticDialog
        open={completeDiagnosticDialogOpen}
        onOpenChange={setCompleteDiagnosticDialogOpen}
      />
      <CreateSaleDialog
        open={saleDialogOpen}
        onOpenChange={setSaleDialogOpen}
      />
      <RentalCreationDialog
        open={rentalDialogOpen}
        onOpenChange={setRentalDialogOpen}
        onSuccess={(rentalId) => {
          // Optional: redirect to location page or show success message
          console.log('Rental created:', rentalId);
        }}
      />
    </div>
  );
}

// Add layout wrapper
DashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <EmployeeLayout>{page}</EmployeeLayout>;
};

export default DashboardPage;
