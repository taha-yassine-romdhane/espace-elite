import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Building2, ShoppingCart, Stethoscope, Calendar, ListTodo, FileText } from "lucide-react";
import { CreateAppointmentDialog } from "@/components/appointments/CreateAppointmentDialog";
import { CreateDiagnosticDialog } from "@/components/diagnostics/CreateDiagnosticDialog";
import { CompleteDiagnosticDialog } from "@/components/diagnostics/CompleteDiagnosticDialog";
import { CreateSaleDialog } from "@/components/sales/CreateSaleDialog";
import { RentalCreationDialog } from "@/components/dialogs/RentalCreationDialog";

const EmployeeQuickActionsBar: React.FC = () => {
  const router = useRouter();

  // Check if we're on the dashboard page - hide the bar if we are
  const isDashboard = router.pathname === '/roles/employee/dashboard';

  // Dialog states
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [diagnosticDialogOpen, setDiagnosticDialogOpen] = useState(false);
  const [completeDiagnosticDialogOpen, setCompleteDiagnosticDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [rentalDialogOpen, setRentalDialogOpen] = useState(false);

  // Don't render if on dashboard
  if (isDashboard) {
    return null;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex gap-3 items-center">
            <Button
              size="sm"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
              onClick={() => router.push("/roles/employee/manual-tasks")}
            >
              <ListTodo className="h-4 w-4" />
              <span className="text-sm">Mes Tâches</span>
            </Button>

            <Button
              size="sm"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
              onClick={() => setAppointmentDialogOpen(true)}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Nouveau Rendez-vous</span>
            </Button>

            {/* Diagnostic buttons - grouped together as one */}
            <div className="flex-1 flex">
              <Button
                size="sm"
                className="flex-1 bg-green-700 hover:bg-green-600 text-white flex items-center justify-center gap-2 rounded-r-none"
                onClick={() => setDiagnosticDialogOpen(true)}
              >
                <Stethoscope className="h-4 w-4" />
                <span className="text-sm">Commencer Diagnostic</span>
              </Button>

              <Button
                size="sm"
                className="flex-1 bg-blue-700 hover:bg-blue-600 text-white flex items-center justify-center gap-2 rounded-l-none"
                onClick={() => setCompleteDiagnosticDialogOpen(true)}
              >
                <FileText className="h-4 w-4" />
                <span className="text-sm">Compléter Résultats</span>
              </Button>
            </div>

            <Button
              size="sm"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
              onClick={() => setSaleDialogOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm">Commencer une Vente</span>
            </Button>

            <Button
              size="sm"
              className="flex-1 bg-green-700 hover:bg-green-600 text-white flex items-center justify-start gap-2"
              onClick={() => setRentalDialogOpen(true)}
            >
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Commencer une Location</span>
            </Button>
          </div>
        </div>
      </div>

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
      />
    </>
  );
};

export default EmployeeQuickActionsBar;
