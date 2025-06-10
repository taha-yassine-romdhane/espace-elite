import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  AlertCircle,
  Stethoscope,
  User,
  ClipboardList,
  Settings,
  FileText,
  Clock,
  FileCheck,
  FilePlus2,
  Calendar,
  Building2,
  Phone,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DiagnosticTableProps {
  onViewDetails?: (id: string) => void;
  onEnterResults?: (id: string) => void;
  onAddDocuments?: (id: string) => void;
}

// Define result type based on the new schema structure
interface DiagnosticResultType {
  id: string;
  iah: number | null;
  idValue: number | null;
  remarque: string | null;
  status: string;
}

export function DiagnosticTable({ onViewDetails, onEnterResults, onAddDocuments }: DiagnosticTableProps) {
  // Fetch diagnostic operations data
  const { data: diagnosticOperations, isLoading } = useQuery({
    queryKey: ["diagnostic-operations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/diagnostics");
        if (!response.ok) {
          throw new Error("Failed to fetch diagnostic operations");
        }
        const data = await response.json();
        console.log("Diagnostic data:", data);

        return data.diagnostics || [];
      } catch (error) {
        console.error("Error fetching diagnostic operations:", error);
        return [];
      }
    },
  });

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: fr });
  };
  
  // Function to format date with time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP 'à' HH:mm", { locale: fr });
  };
  
  // Function to check if a date is overdue
  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date();
    const dueDate = new Date(dateString);
    return isBefore(dueDate, today);
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            En attente
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Complété
          </Badge>
        );
      case "CANCELED":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Annulé
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Opérations de Diagnostic</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : diagnosticOperations && diagnosticOperations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Date des résultats</TableHead>
                  <TableHead>Paramètres</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnosticOperations.map((operation: any) => {
                  return (
                    <TableRow key={operation.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {operation.companyName !== 'N/A' ? (
                            <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                          ) : (
                            <User className="h-5 w-5 text-blue-600 mt-0.5" />
                          )}
                          <div>
                            <div className="font-medium">{operation.patientName}</div>
                            {operation.patient?.telephone && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {operation.patient.telephone}
                              </div>
                            )}
                            {operation.companyName !== 'N/A' && (
                              <div className="text-xs text-purple-600">{operation.companyName}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              {operation.deviceName || "Appareil inconnu"}
                            </div>
                            {operation.medicalDevice?.serialNumber && (
                              <div className="text-xs text-gray-500">
                                N/S: {operation.medicalDevice.serialNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <User className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              {operation.performedBy || "Non assigné"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {operation.followUpDate ? (
                          <div className="flex items-start gap-2">
                            <CalendarIcon className={`h-5 w-5 ${isOverdue(operation.followUpDate) ? 'text-red-600' : 'text-blue-600'} mt-0.5`} />
                            <div>
                              <div className={`font-medium ${isOverdue(operation.followUpDate) ? 'text-red-600' : ''}`}>
                                {formatDate(operation.followUpDate)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {isOverdue(operation.followUpDate) ? 'En retard' : 'À venir'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">Non planifié</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium">{formatDate(operation.date)}</div>
                            <div className="text-xs text-gray-500">{format(new Date(operation.date), "HH:mm", { locale: fr })}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1 cursor-help">
                                <ClipboardList className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">
                                  {operation.result ? (
                                    <span className="text-green-600">Résultats disponibles</span>
                                  ) : (
                                    <span className="text-yellow-600">En attente</span>
                                  )}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="p-2 max-w-xs">
                                <h4 className="font-medium mb-1">Résultats du diagnostic</h4>
                                {operation.result ? (
                                  <div className="space-y-2">
                                    <ul className="space-y-1 text-xs">
                                      <li>
                                        <span className="font-medium">IAH: </span>
                                        <span className="text-gray-600">
                                          {operation.result.iah !== null ? operation.result.iah : "Non renseigné"}
                                        </span>
                                        {operation.result.iah !== null && (
                                          <span className="ml-1 text-xs text-gray-500">(Normal: &lt;5)</span>
                                        )}
                                      </li>
                                      <li>
                                        <span className="font-medium">ID: </span>
                                        <span className="text-gray-600">
                                          {operation.result.idValue !== null ? operation.result.idValue : "Non renseigné"}
                                        </span>
                                        {operation.result.idValue !== null && (
                                          <span className="ml-1 text-xs text-gray-500">(Normal: &lt;10)</span>
                                        )}
                                      </li>
                                      <li>
                                        <span className="font-medium">Remarque: </span>
                                        <span className="text-gray-600">
                                          {operation.result.remarque || "Non renseigné"}
                                        </span>
                                      </li>
                                      <li>
                                        <span className="font-medium">Status: </span>
                                        <span className="text-gray-600">
                                          {operation.result.status === 'COMPLETED' ? 'Complété' : 
                                           operation.result.status === 'PENDING' ? 'En attente' : 
                                           operation.result.status || "Non renseigné"}
                                        </span>
                                      </li>
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">Résultats en attente</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      

                      
                      <TableCell>
                        {!operation.result ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Résultats en attente
                          </Badge>
                        ) : (
                          getStatusBadge(operation.result.status || 'PENDING')
                        )}
                        {operation.followUpRequired && (
                          <div className="mt-1">
                            <Badge variant="outline" className={`text-xs ${isOverdue(operation.followUpDate) ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                              {isOverdue(operation.followUpDate) ? 'Suivi en retard' : 'Suivi requis'}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewDetails && onViewDetails(operation.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Stethoscope className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Aucune opération de diagnostic</h3>
              <p className="max-w-md text-sm text-gray-500">
                Commencez par créer une nouvelle opération de diagnostic en utilisant le bouton &quot;Commencer un Diagnostic&quot; ci-dessus.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiagnosticTable;
