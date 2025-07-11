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
  Building2,
  User,
  Clock,
  FileText,
  Settings,
  Banknote,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RentalTableProps {
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function RentalTable({ onViewDetails, onEdit }: RentalTableProps) {
  // Fetch rental operations data
  const { data: rentalOperations, isLoading } = useQuery({
    queryKey: ["rental-operations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/rentals");
        if (!response.ok) {
          throw new Error("Failed to fetch rental operations");
        }
        const data = await response.json();
        return data.rentals || [];
      } catch (error) {
        console.error("Error fetching rental operations:", error);
        return [];
      }
    },
  });

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: fr });
  };

  // Function to calculate rental duration in days
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInTime = end.getTime() - start.getTime();
    return Math.ceil(differenceInTime / (1000 * 3600 * 24));
  };

  // Function to get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            En attente
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Payé
          </Badge>
        );
      case "GUARANTEE":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Garantie
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            Partiel
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Function to determine if a rental is active, expired, or upcoming
  const getRentalStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) {
      return {
        status: "UPCOMING",
        badge: (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            À venir
          </Badge>
        )
      };
    } else if (now > end) {
      return {
        status: "EXPIRED",
        badge: (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Expiré
          </Badge>
        )
      };
    } else {
      return {
        status: "ACTIVE",
        badge: (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Actif
          </Badge>
        )
      };
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Locations</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : rentalOperations && rentalOperations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentalOperations.map((rental: any) => {
                  const clientName = rental.patient 
                    ? `${rental.patient.firstName} ${rental.patient.lastName}`
                    : rental.company
                      ? rental.company.companyName
                      : "Client inconnu";
                      
                  const clientType = rental.patient ? "patient" : "company";
                  const rentalStatus = getRentalStatus(rental.startDate, rental.endDate);
                  const rentalDuration = calculateDuration(rental.startDate, rental.endDate);
                  
                  return (
                    <TableRow key={rental.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {clientType === "patient" ? (
                            <User className="h-4 w-4 text-blue-600 mt-1" />
                          ) : (
                            <Building2 className="h-4 w-4 text-blue-600 mt-1" />
                          )}
                          <div>
                            <div className="font-medium">{clientName}</div>
                            <div className="text-xs text-gray-500">
                              {clientType === "patient" ? "Patient" : "Entreprise"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Settings className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            <div className="font-medium">{rental.medicalDevice?.name || "Appareil inconnu"}</div>
                            <div className="text-xs text-gray-500">
                              {rental.medicalDevice?.type || "Type inconnu"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-1 text-sm">
                            <CalendarIcon className="h-3.5 w-3.5 text-green-600" />
                            <span>Début: {formatDate(rental.startDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm mt-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-red-600" />
                            <span>Fin: {formatDate(rental.endDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{rentalDuration} jour{rentalDuration > 1 ? 's' : ''}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {rental.payment ? (
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1">
                              <Banknote className="h-3.5 w-3.5 text-green-600" />
                              <span>{rental.payment.amount || 0} TND</span>
                            </div>
                            <div className="mt-1">
                              {getPaymentStatusBadge(rental.payment.status || "PENDING")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            Non payé
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {rentalStatus.badge}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewDetails && onViewDetails(rental.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </Button>
                          
                          {(rentalStatus.status === "UPCOMING" || rentalStatus.status === "ACTIVE") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-800 hover:bg-blue-50 flex items-center gap-1"
                              onClick={() => onEdit && onEdit(rental.id)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                              <span>Modifier</span>
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
              <Building2 className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Aucune location</h3>
              <p className="max-w-md text-sm text-gray-500">
                Commencez par créer une nouvelle location en utilisant le bouton &quot;Commencer une Location&quot; ci-dessus.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RentalTable;
