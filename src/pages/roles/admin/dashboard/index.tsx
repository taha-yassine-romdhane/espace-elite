import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Building2, ShoppingCart, Stethoscope, Calendar, ClipboardCheck, FileText } from "lucide-react";
import AdminLayout from "../AdminLayout";

// Import new table components
import AppointmentsExcelTable from "../appointments/AppointmentsExcelTable";
import DiagnosticsExcelTable from "../diagnostics/DiagnosticsExcelTable";
import CNAMRappelsTable from "../sales/components/CNAMRappelsTable";
import RentalStatistics from "../location/components/RentalStatistics";
import AdminManualTasksTable from "../manual-tasks/index";
import { TabSwitcher } from "./components/TabSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import ActiveRentalDevicesWidget from "../rentals/ActiveRentalDevicesWidget";

// Import dialogs
import { CreateManualTaskDialog } from "@/components/employee/CreateManualTaskDialog";
import { CreateAppointmentDialogAdmin } from "@/components/appointments/CreateAppointmentDialogAdmin";
import { CreateDiagnosticDialogAdmin } from "@/components/diagnostics/CreateDiagnosticDialogAdmin";
import { CompleteDiagnosticDialogAdmin } from "@/components/diagnostics/CompleteDiagnosticDialogAdmin";
import { CreateSaleDialogAdmin } from "@/components/sales/CreateSaleDialogAdmin";
import { RentalCreationDialogAdmin } from "@/components/dialogs/RentalCreationDialogAdmin";

type TabType = "appointments" | "diagnostics" | "sales" | "rentals" | "manual-tasks" | "active-rentals";

function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("manual-tasks");

  // Dialog states
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);
  const [completeDiagnosticDialogOpen, setCompleteDiagnosticDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);


  return (
    <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-8 text-blue-900">Tableau de Bord</h1>
        
        {/* Action Buttons Row - 6 buttons in same line */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            <Button
              className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
              onClick={() => setCreateTaskDialogOpen(true)}
            >
              <ClipboardCheck className="h-5 w-5" />
              <span>Créer une Tâche</span>
            </Button>

            <Button
              className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
              onClick={() => setAppointmentDialogOpen(true)}
            >
              <Calendar className="h-5 w-5" />
              <span>Nouveau Rendez-vous</span>
            </Button>

            {/* Diagnostic buttons grouped in a frame */}
            <div className="lg:col-span-2 border-2 border-blue-300 rounded-lg p-1 bg-blue-50/30">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="w-full h-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
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
              className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
              onClick={() => setSaleDialogOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Commencer une Vente</span>
            </Button>

            <Button
              className="w-full bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-start gap-2"
              onClick={() => setRentalDialogOpen(true)}
            >
              <Building2 className="h-5 w-5" />
              <span>Commencer une Location</span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <TabSwitcher activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabType)} />

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
              <CNAMRappelsTable />
            </CardContent>
          </Card>
        )}

        {activeTab === "rentals" && (
          <RentalStatistics />
        )}

        {activeTab === "active-rentals" && (
          <Card>
            <CardContent className="pt-6">
              <ActiveRentalDevicesWidget />
            </CardContent>
          </Card>
        )}

        {activeTab === "manual-tasks" && (
          <Card>
            <CardContent className="pt-6">
              <AdminManualTasksTable />
            </CardContent>
          </Card>
        )}

        {/* Dialogs */}
        <CreateManualTaskDialog
          open={createTaskDialogOpen}
          onOpenChange={setCreateTaskDialogOpen}
        />
        <CreateAppointmentDialogAdmin
          open={appointmentDialogOpen}
          onOpenChange={setAppointmentDialogOpen}
        />
        <CreateDiagnosticDialogAdmin
          open={diagnosticDialogOpen}
          onOpenChange={setDiagnosticDialogOpen}
        />
        <CompleteDiagnosticDialogAdmin
          open={completeDiagnosticDialogOpen}
          onOpenChange={setCompleteDiagnosticDialogOpen}
        />
        <CreateSaleDialogAdmin
          open={saleDialogOpen}
          onOpenChange={setSaleDialogOpen}
        />
        <RentalCreationDialogAdmin
          open={rentalDialogOpen}
          onOpenChange={setRentalDialogOpen}
        />
    </div>
  );
}

// Add layout wrapper
DashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default DashboardPage;