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
  FileText,
  Receipt,
  Package,
  Banknote,
  ShoppingCart,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SalesTableProps {
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function SalesTable({ onViewDetails, onEdit }: SalesTableProps) {
  // Fetch sales data
  const { data: salesOperations, isLoading } = useQuery({
    queryKey: ["sales-operations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/sales");
        if (!response.ok) {
          throw new Error("Failed to fetch sales");
        }
        const data = await response.json();
        return data.sales || [];
      } catch (error) {
        console.error("Error fetching sales:", error);
        return [];
      }
    },
  });

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: fr });
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
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
      case "ON_PROGRESS":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            En cours
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Complétée
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Annulée
          </Badge>
        );
      case "RETURNED":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Retournée
          </Badge>
        );
      case "PARTIALLY_RETURNED":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            Retour partiel
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Ventes</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          </div>
        ) : salesOperations && salesOperations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Facture</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesOperations.map((sale: any) => {
                  const clientName = sale.patient 
                    ? `${sale.patient.firstName} ${sale.patient.lastName}`
                    : sale.company
                      ? sale.company.companyName
                      : "Client inconnu";
                      
                  const clientType = sale.patient ? "patient" : "company";
                  
                  return (
                    <TableRow key={sale.id} className="hover:bg-gray-50">
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
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-blue-600" />
                          <span>{sale.invoiceNumber || "-"}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4 text-blue-600" />
                          <span>{formatDate(sale.saleDate)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center cursor-help">
                                <Package className="h-4 w-4 text-blue-600 mr-1" />
                                <span>{sale.items?.length || 0} article{sale.items?.length !== 1 ? 's' : ''}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-80 p-0">
                              <div className="bg-white p-3 rounded shadow-lg text-sm">
                                <h4 className="font-semibold mb-2 text-blue-900">Articles</h4>
                                {sale.items && sale.items.length > 0 ? (
                                  <ul className="space-y-2">
                                    {sale.items.slice(0, 5).map((item: any) => (
                                      <li key={item.id} className="text-xs">
                                        <div className="flex justify-between">
                                          <span>
                                            {item.product?.name || item.medicalDevice?.name || "Article inconnu"}
                                          </span>
                                          <span className="font-semibold">
                                            {item.quantity}x {formatCurrency(item.unitPrice)}
                                          </span>
                                        </div>
                                      </li>
                                    ))}
                                    {sale.items.length > 5 && (
                                      <li className="text-gray-600">+ {sale.items.length - 5} autres articles</li>
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-500">Aucun article</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {formatCurrency(sale.finalAmount)}
                          </div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-gray-500">
                              Remise: {formatCurrency(sale.discount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {sale.payment ? (
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1">
                              <Banknote className="h-3.5 w-3.5 text-green-600" />
                              <span>{formatCurrency(sale.payment.amount)}</span>
                            </div>
                            <div className="mt-1">
                              {getPaymentStatusBadge(sale.payment.status || "PENDING")}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            Non payé
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(sale.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewDetails && onViewDetails(sale.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </Button>
                          
                          {(sale.status === "PENDING" || sale.status === "ON_PROGRESS") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-800 hover:bg-blue-50 flex items-center gap-1"
                              onClick={() => onEdit && onEdit(sale.id)}
                            >
                              <Receipt className="h-3.5 w-3.5" />
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
              <ShoppingCart className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Aucune vente</h3>
              <p className="max-w-md text-sm text-gray-500">
                Commencez par créer une nouvelle vente en utilisant le bouton &quot;Commencer une Vente&quot; ci-dessus.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesTable;
