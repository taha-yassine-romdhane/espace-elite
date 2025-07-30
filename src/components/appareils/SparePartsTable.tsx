import React, { useState, useEffect, useMemo } from 'react';
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
import { Sliders, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info } from "lucide-react";
import Link from 'next/link';

interface SparePartsTableProps {
  products: Product[];
  onViewHistory: (product: Product) => void;
  onViewParameters?: (product: Product) => void;
  renderActionButtons: (product: Product) => React.ReactNode;
  initialItemsPerPage?: number;
}

export function SparePartsTable({ 
  products = [], 
  onViewHistory,
  onViewParameters,
  renderActionButtons,
  initialItemsPerPage = 10
}: SparePartsTableProps) {
  // Memoize the filtering of spare parts to prevent re-renders
  const allSpareParts = useMemo(() => 
    products?.filter(p => p?.type === ProductType.SPARE_PART) || []
  , [products]);
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParts, setFilteredParts] = useState<Product[]>(allSpareParts);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [paginatedData, setPaginatedData] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter parts based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredParts(allSpareParts);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = allSpareParts.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.brand && item.brand.toLowerCase().includes(query)) ||
        (item.model && item.model.toLowerCase().includes(query)) ||
        (item.stockLocation && typeof item.stockLocation === 'object' && 
         item.stockLocation.name && item.stockLocation.name.toLowerCase().includes(query))
      );
      setFilteredParts(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, allSpareParts]);
  
  // Update paginated data when filtered data changes or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredParts.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredParts.length / itemsPerPage)));
    
    // Reset to page 1 if current page is out of bounds after data change
    if (currentPage > Math.ceil(filteredParts.length / itemsPerPage) && filteredParts.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredParts, currentPage, itemsPerPage]);
  
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

  const getLocationName = (part: Product) => {
    // Prefer the name from the primary stockLocation object if it exists
    if (part.stockLocation && part.stockLocation.name) {
      return part.stockLocation.name;
    }
    // Fallback to the location name from the first entry in the stocks array
    if (part.stocks && part.stocks.length > 0 && part.stocks[0].location && part.stocks[0].location.name) {
      return part.stocks[0].location.name;
    }
    // If no location can be determined, return "Non assigné"
    return "Non assigné";
  };

  if (allSpareParts.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500">Aucune pièce détachée trouvée</p>
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
            placeholder="Rechercher par nom, marque ou modèle..."
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
              <TableHead className="py-1">Lieu de stockage</TableHead>
              <TableHead className="py-1">Quantité en Stock</TableHead>
              <TableHead className="py-1">Statut</TableHead>
              <TableHead className="py-1">Prix d&apos;achat</TableHead>
              <TableHead className="py-1">Prix de vente</TableHead>
              <TableHead className="py-1 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((part) => (
            <TableRow key={part.id} className="h-8">
              <TableCell className="py-1">{part.name}</TableCell>
              <TableCell className="py-1">{part.brand || '-'}</TableCell>
              <TableCell className="py-1">{part.model || '-'}</TableCell>
              <TableCell>{getLocationName(part)}</TableCell>
              <TableCell className="py-1">{part.stocks ? part.stocks.reduce((acc, stock) => acc + stock.quantity, 0) : 0}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(part.status)}>
                  {getStatusLabel(part.status)}
                </Badge>
              </TableCell>
              <TableCell className="py-1">{part.purchasePrice ? `${part.purchasePrice} DT` : '-'}</TableCell>
              <TableCell className="py-1">{part.sellingPrice ? `${part.sellingPrice} DT` : '-'}</TableCell>
              <TableCell className="py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/roles/admin/appareils/spare-part/${part.id}`} passHref>
                    <Button
                      variant="outline"
                      size="icon"
                      title="Voir les détails"
                      className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
                    >
                      <Info className="h-5 w-5" />
                    </Button>
                  </Link>
                  {onViewParameters && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onViewParameters(part)}
                      title="Voir les paramètres"
                      className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center"
                    >
                      <Sliders className="h-5 w-5" />
                    </Button>
                  )}
                  {renderActionButtons && (
                    <div className="flex items-center gap-2">
                      {renderActionButtons(part)}
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
    {filteredParts.length > 0 && (
      <div className="flex items-center justify-between px-2 py-4 border-t">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Affichage de {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredParts.length)} sur {filteredParts.length} pièces détachées
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

export default SparePartsTable;