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
import { History, Sliders, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface AccessoriesTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewHistory: (product: Product) => void;
  onViewParameters?: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
  initialItemsPerPage?: number;
}

export function AccessoriesTable({ 
  products = [], 
  onViewHistory,
  onViewParameters,
  renderActionButtons,
  initialItemsPerPage = 10
}: AccessoriesTableProps) {
  // Filter accessories from all products
  const allAccessories = products?.filter(p => p?.type === ProductType.ACCESSORY) || [];
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAccessories, setFilteredAccessories] = useState<Product[]>(allAccessories);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [paginatedData, setPaginatedData] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter accessories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAccessories(allAccessories);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allAccessories.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.model && item.model.toLowerCase().includes(query)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(query))
      );
      setFilteredAccessories(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, allAccessories]);
  
  // Update paginated data when filtered data changes or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredAccessories.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredAccessories.length / itemsPerPage)));
    
    // Reset to page 1 if current page is out of bounds after data change
    if (currentPage > Math.ceil(filteredAccessories.length / itemsPerPage) && filteredAccessories.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredAccessories, currentPage, itemsPerPage]);
  
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
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'default';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'secondary';
      case 'VENDU':
      case 'RETIRED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_VENTE':
      case 'ACTIVE':
        return 'EN VENTE';
      case 'EN_REPARATION':
      case 'MAINTENANCE':
        return 'EN RÉPARATION';
      case 'VENDU':
      case 'RETIRED':
        return 'VENDU';
      case 'EN_LOCATION':
        return 'EN LOCATION';
      default:
        return status;
    }
  };

  const getLocationName = (device: Product) => {
    if (!device?.stockLocation) return "Non assigné";
    return typeof device.stockLocation === 'string' 
      ? device.stockLocation 
      : device.stockLocation.name || "Non assigné";
  };

  if (allAccessories.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucun accessoire trouvé</p>
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
            placeholder="Rechercher par nom, marque, modèle ou numéro de série..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="h-8">
              <TableHead className="py-1">Nom</TableHead>
              <TableHead className="py-1">Marque</TableHead>
              <TableHead className="py-1">Modèle</TableHead>
              <TableHead className="py-1">N° Série</TableHead>
              <TableHead className="py-1">Emplacement</TableHead>
              <TableHead className="py-1">État</TableHead>
              <TableHead className="py-1">Prix d&apos;achat</TableHead>
              <TableHead className="py-1">Prix de vente</TableHead>
              <TableHead className="py-1 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((device) => (
            <TableRow key={device.id} className="h-8">
              <TableCell className="py-1">{device.name}</TableCell>
              <TableCell className="py-1">{device.brand || '-'}</TableCell>
              <TableCell className="py-1">{device.model || '-'}</TableCell>
              <TableCell className="py-1">{device.serialNumber || '-'}</TableCell>
              <TableCell className="py-1">{getLocationName(device)}</TableCell>
              <TableCell className="py-1">
                <Badge variant={getStatusBadgeVariant(device.status)}>
                  {getStatusLabel(device.status)}
                </Badge>
              </TableCell>
              <TableCell className="py-1">{device.purchasePrice ? `${device.purchasePrice} DT` : '-'}</TableCell>
              <TableCell className="py-1">{device.sellingPrice ? `${device.sellingPrice} DT` : '-'}</TableCell>
              <TableCell className="py-1 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewHistory(device)}
                  title="Voir l'historique des réparations"
                  className="h-6 w-6"
                >
                  <History className="h-3 w-3" />
                </Button>
                {onViewParameters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewParameters(device)}
                    title="Voir les paramètres"
                    className="h-6 w-6"
                  >
                    <Sliders className="h-3 w-3" />
                  </Button>
                )}
                {renderActionButtons(device)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    
    {/* Pagination controls */}
    {filteredAccessories.length > 0 && (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Affichage de {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredAccessories.length)} sur {filteredAccessories.length} accessoires
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

export default AccessoriesTable;
