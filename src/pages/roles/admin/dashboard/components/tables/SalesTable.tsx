import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarIcon,
  Building2,
  User,
  FileText,
  Receipt,
  Package,
  Banknote,
  ShoppingCart,
  Trash2,
  Loader2,
  Search,
  CreditCard,
  Euro,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SalesTableProps {
  onViewDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function SalesTable({ onViewDetails, onEdit }: SalesTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Enhanced filtering states
  const [filteredSales, setFilteredSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [amountRangeFilter, setAmountRangeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch sales data with enhanced query
  const { data: salesOperations, isLoading } = useQuery({
    queryKey: ["sales-operations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/sales");
        if (!response.ok) {
          throw new Error("Failed to fetch sales");
        }
        const data = await response.json();
        console.log("Sales data:", data);
        console.log("First sale processedBy:", data.sales?.[0]?.processedBy);
        return data.sales || [];
      } catch (error) {
        console.error("Error fetching sales:", error);
        return [];
      }
    },
  });

  // Initialize filtered sales when data loads
  useEffect(() => {
    if (salesOperations) {
      setFilteredSales(salesOperations);
    }
  }, [salesOperations]);

  // Helper functions to get unique values for filters
  const getUniqueValues = (key: string): string[] => {
    if (!salesOperations) return [];
    const values: (string | null)[] = salesOperations.map((sale: any) => {
      switch (key) {
        case 'status':
          return sale.status;
        case 'paymentStatus':
          return sale.payment?.status || null;
        case 'processedBy':
          return sale.processedBy ? `${sale.processedBy.firstName} ${sale.processedBy.lastName}`.trim() : null;
        default:
          return null;
      }
    });
    const filteredValues = values.filter((value: string | null): value is string => Boolean(value) && typeof value === 'string');
    return [...new Set(filteredValues)];
  };

  const uniqueStatuses = getUniqueValues('status');
  const uniquePaymentStatuses = getUniqueValues('paymentStatus');
  const uniqueProcessedBy = getUniqueValues('processedBy');

  // Delete sale mutation
  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete sale');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["sales-operations"] });
      setSaleToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting sale:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  // Handle delete button click
  const handleDeleteClick = (id: string) => {
    setSaleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (saleToDelete) {
      deleteSale.mutate(saleToDelete);
    }
    setIsDeleteDialogOpen(false);
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setSaleToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: fr });
  };

  // Format date function for simple display
  const formatSimpleDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount) || 0);
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
      case "PARTIAL":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
            Partiel
          </Badge>
        );
      case "GUARANTEE":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Garantie
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

  // Get sales statistics
  const getSalesStats = () => {
    const stats = { 
      total: filteredSales.length,
      completed: 0, 
      pending: 0, 
      cancelled: 0,
      totalAmount: 0,
      averageAmount: 0
    };
    
    filteredSales.forEach((sale: any) => {
      switch (sale.status) {
        case 'COMPLETED':
          stats.completed++;
          break;
        case 'PENDING':
        case 'ON_PROGRESS':
          stats.pending++;
          break;
        case 'CANCELLED':
          stats.cancelled++;
          break;
      }
      stats.totalAmount += Number(sale.finalAmount) || 0;
    });
    
    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;
    
    return stats;
  };

  // Filter and search sales
  useEffect(() => {
    if (!salesOperations) return;
    
    let filtered = salesOperations;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter((sale: any) => {
        const clientName = sale.patient 
          ? `${sale.patient.firstName} ${sale.patient.lastName}`
          : sale.company?.companyName || "";
        
        return (
          clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.patient?.telephone?.includes(searchTerm) ||
          sale.patient?.cin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.company?.fiscalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.id.toString().includes(searchTerm)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((sale: any) => sale.status === statusFilter);
    }

    // Apply client type filter
    if (clientTypeFilter !== "all") {
      if (clientTypeFilter === "patient") {
        filtered = filtered.filter((sale: any) => sale.patient);
      } else if (clientTypeFilter === "company") {
        filtered = filtered.filter((sale: any) => sale.company);
      }
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((sale: any) => sale.payment?.status === paymentStatusFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter((sale: any) => {
            const saleDate = new Date(sale.saleDate);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate.getTime() === filterDate.getTime();
          });
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter((sale: any) => new Date(sale.saleDate) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter((sale: any) => new Date(sale.saleDate) >= filterDate);
          break;
        case "year":
          filterDate.setFullYear(today.getFullYear() - 1);
          filtered = filtered.filter((sale: any) => new Date(sale.saleDate) >= filterDate);
          break;
      }
    }

    // Apply amount range filter
    if (amountRangeFilter !== "all") {
      filtered = filtered.filter((sale: any) => {
        const amount = Number(sale.finalAmount) || 0;
        switch (amountRangeFilter) {
          case "0-100":
            return amount >= 0 && amount <= 100;
          case "100-500":
            return amount > 100 && amount <= 500;
          case "500-1000":
            return amount > 500 && amount <= 1000;
          case "1000+":
            return amount > 1000;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "client":
          aValue = a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : a.company?.companyName || "";
          bValue = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : b.company?.companyName || "";
          break;
        case "amount":
          aValue = Number(a.finalAmount) || 0;
          bValue = Number(b.finalAmount) || 0;
          break;
        case "date":
          aValue = new Date(a.saleDate).getTime();
          bValue = new Date(b.saleDate).getTime();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    });

    setFilteredSales(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [salesOperations, searchTerm, statusFilter, clientTypeFilter, paymentStatusFilter, dateFilter, amountRangeFilter, sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const salesStats = getSalesStats();

  // Pagination
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#1e3a8a] to-blue-900 px-6 py-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Gestion des Ventes</h3>
          <div className="text-blue-100 text-sm">
            {filteredSales.length} vente(s) trouvée(s)
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par client, facture, téléphone, CIN, ID..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] bg-white text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="all">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="ON_PROGRESS">En cours</option>
              <option value="COMPLETED">Complétée</option>
              <option value="CANCELLED">Annulée</option>
              <option value="RETURNED">Retournée</option>
            </select>

            {/* Client Type Filter */}
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] bg-white text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="all">Tous les clients</option>
              <option value="patient">Patients</option>
              <option value="company">Entreprises</option>
            </select>

            {/* Payment Status Filter */}
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] bg-white text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="all">Tous les paiements</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payé</option>
              <option value="PARTIAL">Partiel</option>
              <option value="GUARANTEE">Garantie</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] bg-white text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="all">Toutes les dates</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>

            {/* Amount Range Filter */}
            <select
              value={amountRangeFilter}
              onChange={(e) => setAmountRangeFilter(e.target.value)}
              className="px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-[#1e3a8a] bg-white text-sm shadow-sm hover:shadow-md transition-all duration-200"
            >
              <option value="all">Tous les montants</option>
              <option value="0-100">0 - 100 DT</option>
              <option value="100-500">100 - 500 DT</option>
              <option value="500-1000">500 - 1000 DT</option>
              <option value="1000+">1000+ DT</option>
            </select>
          </div>
        </div>

        {/* Sales Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Complétées: {salesStats.completed}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-slate-600">En attente: {salesStats.pending}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Annulées: {salesStats.cancelled}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Total: {formatCurrency(salesStats.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
          </div>
        ) : currentSales && currentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("client")}
                  >
                    <div className="flex items-center">
                      Client
                      {sortBy === "client" && (
                        sortOrder === "asc" ? 
                          <SortAsc className="ml-1 h-4 w-4" /> : 
                          <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Facture</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center">
                      Date
                      {sortBy === "date" && (
                        sortOrder === "asc" ? 
                          <SortAsc className="ml-1 h-4 w-4" /> : 
                          <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      Montant
                      {sortBy === "amount" && (
                        sortOrder === "asc" ? 
                          <SortAsc className="ml-1 h-4 w-4" /> : 
                          <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Statut
                      {sortBy === "status" && (
                        sortOrder === "asc" ? 
                          <SortAsc className="ml-1 h-4 w-4" /> : 
                          <SortDesc className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Traité par</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSales.map((sale: any, index: number) => {
                  const clientName = sale.patient 
                    ? `${sale.patient.firstName} ${sale.patient.lastName}`
                    : sale.company
                      ? sale.company.companyName
                      : "Client inconnu";
                      
                  const clientType = sale.patient ? "patient" : "company";
                  
                  return (
                    <TableRow key={sale.id} className={`hover:bg-slate-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {clientType === "patient" ? (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                                {clientName.charAt(0)?.toUpperCase() || 'N'}
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-semibold text-sm">
                                {clientName.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{clientName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              {clientType === "patient" ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Building2 className="h-3 w-3" />
                              )}
                              {clientType === "patient" ? "Patient" : "Entreprise"}
                              {sale.patient?.telephone && ` • ${sale.patient.telephone}`}
                              {sale.company?.telephone && ` • ${sale.company.telephone}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium">{sale.invoiceNumber || "-"}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm">{formatSimpleDate(sale.saleDate)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center cursor-help">
                                <Package className="h-4 w-4 text-emerald-600 mr-1" />
                                <span className="text-sm">{sale.items?.length || 0} article{sale.items?.length !== 1 ? 's' : ''}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="w-80 p-0">
                              <div className="bg-white p-3 rounded shadow-lg text-sm">
                                <h4 className="font-semibold mb-2 text-emerald-900">Articles</h4>
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
                          <div className="font-semibold text-emerald-700">
                            {formatCurrency(sale.finalAmount)}
                          </div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-red-500">
                              Remise: {formatCurrency(sale.discount)}
                            </div>
                          )}
                          {sale.totalAmount !== sale.finalAmount && (
                            <div className="text-xs text-slate-500">
                              Total: {formatCurrency(sale.totalAmount)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {sale.payment ? (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-1">
                              <Banknote className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-sm font-medium">{formatCurrency(sale.payment.amount)}</span>
                            </div>
                            <div>
                              {getPaymentStatusBadge(sale.payment.status || "PENDING")}
                            </div>
                            {sale.payment.method && (
                              <div className="text-xs text-slate-500">
                                {sale.payment.method}
                              </div>
                            )}
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
                        <div className="text-sm">
                          {sale.processedBy && (sale.processedBy.firstName || sale.processedBy.lastName || sale.processedBy.name) ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-700 text-xs font-medium">
                                  {(sale.processedBy.firstName?.charAt(0) || sale.processedBy.name?.charAt(0) || 'U').toUpperCase()}
                                </span>
                              </div>
                              <span className="text-slate-700">
                                {sale.processedBy.name || `${sale.processedBy.firstName || ''} ${sale.processedBy.lastName || ''}`.trim() || 'Utilisateur'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Non assigné</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewDetails && onViewDetails(sale.id)}
                            className="flex items-center gap-1 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Détails</span>
                          </Button>
                          
                          {(sale.status === "PENDING" || sale.status === "ON_PROGRESS") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-200 text-blue-800 hover:bg-blue-50 flex items-center gap-1 text-xs"
                              onClick={() => onEdit && onEdit(sale.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Modifier</span>
                            </Button>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteClick(sale.id)}
                            className="flex items-center gap-1 border-red-200 hover:bg-red-50 hover:text-red-600 text-xs"
                            disabled={deleteSale.isPending}
                          >
                            {deleteSale.isPending && saleToDelete === sale.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
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
          <div className="border border-blue-200 rounded-lg p-8 text-center text-gray-500 bg-blue-50">
            <div className="flex flex-col items-center justify-center space-y-3">
              <ShoppingCart className="h-12 w-12 text-blue-400" />
              <h3 className="text-lg font-medium text-gray-900">Aucune vente trouvée</h3>
              <p className="max-w-md text-sm text-gray-600">
                {searchTerm || statusFilter !== 'all' || clientTypeFilter !== 'all' || paymentStatusFilter !== 'all' || dateFilter !== 'all' || amountRangeFilter !== 'all'
                  ? "Aucune vente ne correspond aux critères de recherche. Essayez de modifier les filtres."
                  : "Commencez par créer une nouvelle vente en utilisant le bouton \"Commencer une Vente\" ci-dessus."
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <span>
                Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} sur {totalItems} ventes
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                const page = i + 1;
                const shouldShow = page === 1 || page === totalPages || 
                  (page >= currentPage - 2 && page <= currentPage + 2);
                
                if (!shouldShow && page !== 2 && page !== totalPages - 1) {
                  return null;
                }
                
                if ((page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3)) {
                  return <span key={page} className="px-2 text-gray-400">...</span>;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-[#1e3a8a] text-white'
                        : 'text-gray-600 hover:text-[#1e3a8a]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:text-[#1e3a8a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Êtes-vous sûr de vouloir supprimer cette vente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La vente et tous ses éléments associés seront définitivement supprimés.
              Les stocks des produits vendus seront remis à jour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SalesTable;