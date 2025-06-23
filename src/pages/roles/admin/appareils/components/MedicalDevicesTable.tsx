import React, { useState, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, ProductType } from "@/types";
import { History, Sliders, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings } from "lucide-react";

interface MedicalDevicesTableProps {
  products: Product[];
  onViewHistory: (product: Product) => void;
  onViewParameters?: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
  initialItemsPerPage?: number;
}

export function MedicalDevicesTable({ 
  products = [], 
  onViewHistory,
  onViewParameters,
  renderActionButtons,
  initialItemsPerPage = 10
}: MedicalDevicesTableProps) {
  // Filter medical devices from all products
  const allMedicalDevices = products?.filter(p => p?.type === ProductType.MEDICAL_DEVICE) || [];
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDevices, setFilteredDevices] = useState<Product[]>(allMedicalDevices);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [paginatedData, setPaginatedData] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter devices based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDevices(allMedicalDevices);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allMedicalDevices.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.model && item.model.toLowerCase().includes(query)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(query)) ||
        (item.stockLocation && typeof item.stockLocation === 'object' && 
         item.stockLocation.name && item.stockLocation.name.toLowerCase().includes(query))
      );
      setFilteredDevices(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, allMedicalDevices]);
  
  // Update paginated data when filtered data changes or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredDevices.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredDevices.length / itemsPerPage)));
    
    // Reset to page 1 if current page is out of bounds after data change
    if (currentPage > Math.ceil(filteredDevices.length / itemsPerPage) && filteredDevices.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredDevices, currentPage, itemsPerPage]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Pagination navigation functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'MAINTENANCE':
        return 'secondary';
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLocationName = (device: Product) => {
    if (!device?.stockLocation) return "Non assigné";
    return device.stockLocation.name;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (allMedicalDevices.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucun appareil médical trouvé</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Search bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Rechercher par nom, marque, modèle ou emplacement..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Marque/Modèle</TableHead>
              <TableHead>Emplacement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Réservé jusqu'à</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-medium">{device.name}</TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {device.brand && <span>{device.brand}</span>}
                  {device.model && <span> / {device.model}</span>}
                </div>
              </TableCell>
              <TableCell>{getLocationName(device)}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(device.status)}>
                  {device.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {device.reservedUntil ? formatDate(device.reservedUntil) : 'Non réservé'}
              </TableCell>
              <TableCell className="py-1">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onViewHistory(device)}
                    title="Voir l'historique des réparations"
                    className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
                  >
                    <History className="h-5 w-5" />
                  </Button>
                  {onViewParameters && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewParameters(device)}
                      title="Voir les paramètres de l'appareil"
                      className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  )}
                  {renderActionButtons && (
                    <div className="flex items-center gap-2">
                      {renderActionButtons(device)}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {/* Pagination controls */}
    {filteredDevices.length > 0 && (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Affichage de {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredDevices.length)} sur {filteredDevices.length} appareils médicaux
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Lignes par page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={itemsPerPage.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}

export default MedicalDevicesTable;
