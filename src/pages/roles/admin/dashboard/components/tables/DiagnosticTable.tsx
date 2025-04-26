import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DiagnosticTableProps {
  onViewDetails?: (id: string) => void;
  onEnterResults?: (id: string) => void;
}

export function DiagnosticTable({ onViewDetails, onEnterResults }: DiagnosticTableProps) {
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
        console.log("####", data);

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
                          <User className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            <div className="font-medium">
                              {operation.patient?.firstName} {operation.patient?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {operation.patient?.telephone || "-"}
                            </div>
                            {operation.patient?.email && (
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                {operation.patient.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Stethoscope className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            <div className="font-medium">
                              {operation.medicalDevice?.name || "Appareil inconnu"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {operation.medicalDevice?.brand} {operation.medicalDevice?.model}
                            </div>
                            {operation.medicalDevice?.serialNumber && (
                              <div className="text-xs text-gray-500">
                                N° {operation.medicalDevice.serialNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">
                            {operation.performedBy?.name || "Non assigné"}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {formatDate(operation.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className={operation.followUpRequired ? "text-red-600 font-medium" : ""}>
                            {operation.followUpDate ? format(operation.followUpDate, 'PPP', { locale: fr }) : '-'}
                          </span>
                        </div>
                        {operation.followUpRequired && (
                          <div className="flex items-center text-xs text-red-600 mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>En retard</span>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <ClipboardList className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">
                                  {operation.parameters?.length || 0} paramètre(s)
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="p-2 max-w-xs">
                                <h4 className="font-medium mb-1">Paramètres</h4>
                                {operation.parameters && operation.parameters.length > 0 ? (
                                  <ul className="text-xs space-y-1">
                                    {operation.parameters.slice(0, 5).map((param: any, idx: number) => (
                                      <li key={idx} className="flex justify-between">
                                        <span>{param.name}:</span>
                                        <span className="font-medium ml-2">{param.value || "Non renseigné"}</span>
                                      </li>
                                    ))}
                                    {operation.parameters.length > 5 && (
                                      <li className="text-blue-600">+ {operation.parameters.length - 5} autres</li>
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-500">Aucun paramètre</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(operation.status)}
                        {operation.followUpRequired && (
                          <div className="mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-xs">
                              Suivi requis
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
                          
                          {operation.status === 'PENDING' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-800 hover:bg-blue-50 flex items-center gap-1"
                              onClick={() => onEnterResults && onEnterResults(operation.id)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                              <span>Résultats</span>
                            </Button>
                          )}
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
