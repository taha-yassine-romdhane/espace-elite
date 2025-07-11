import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StockViewDialog from './StockViewDialog';
import { LocationForm } from '@/pages/roles/admin/appareils/components/LocationForm';

interface StockLocation {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  _count: {
    stocks: number;
    products: number;
    medicalDevices: number;
  };
  accessoryCount?: number;
  sparePartCount?: number;
  accessoryQuantity?: number;
  sparePartQuantity?: number;
  medicalDeviceCount?: number;
  diagnosticDeviceCount?: number;
  totalDeviceCount?: number;
  createdAt: string;
}

export default function StockLocations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Stock view dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StockLocation | null>(null);
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<StockLocation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedData, setPaginatedData] = useState<StockLocation[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch stock locations
  const { data: locations, isLoading } = useQuery<StockLocation[]>({
    queryKey: ['stockLocations'],
    queryFn: async () => {
      const response = await fetch('/api/stock/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  useEffect(() => {
    if (locations) {
      // Locations now come with pre-calculated counts from the API
      console.log('Locations with counts from API:', locations);
      setFilteredLocations(locations);
    }
  }, [locations]);
  
  // Handle successful location creation
  const handleLocationCreated = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['stockLocations'] });
  };
  
  // Handle opening the stock view dialog
  const handleViewStock = (location: StockLocation) => {
    setSelectedLocation(location);
    setViewDialogOpen(true);
  };

  // Filter locations based on search query
  useEffect(() => {
    if (!locations) {
      setFilteredLocations([]);
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = locations.filter((location) => 
        (location.name && location.name.toLowerCase().includes(query)) ||
        (location.description && location.description.toLowerCase().includes(query)) ||
        (location.user && location.user.firstName && location.user.firstName.toLowerCase().includes(query)) ||
        (location.user && location.user.lastName && location.user.lastName.toLowerCase().includes(query))
      );
      setFilteredLocations(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [searchQuery, locations]);
  
  // Update paginated data when filtered data changes or pagination settings change
  useEffect(() => {
    if (!filteredLocations) {
      setPaginatedData([]);
      setTotalPages(1);
      return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(filteredLocations.slice(startIndex, endIndex));
    setTotalPages(Math.max(1, Math.ceil(filteredLocations.length / itemsPerPage)));
    
    // Reset to page 1 if current page is out of bounds after data change
    if (currentPage > Math.ceil(filteredLocations.length / itemsPerPage) && filteredLocations.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredLocations, currentPage, itemsPerPage]);
  
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
  
  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Emplacements de Stock</h2>
        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher un emplacement..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 w-64"
            />
          </div>
          {/* Add Location Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un emplacement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel emplacement</DialogTitle>
              </DialogHeader>
              <LocationForm onSuccess={handleLocationCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Produits</TableHead>
              <TableHead>Appareils</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData?.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.description || '-'}</TableCell>
                <TableCell>
                  {location.user ? (
                    `${location.user.firstName} ${location.user.lastName}`
                  ) : (
                    <span className="text-gray-500">Non assigné</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {/* Show combined quantity of accessory and spare part products */}
                    {(location.accessoryQuantity || 0) + (location.sparePartQuantity || 0)} produits
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Accessoires: {location.accessoryQuantity || 0} ({location.accessoryCount || 0} types)</div>
                    <div>Pièces: {location.sparePartQuantity || 0} ({location.sparePartCount || 0} types)</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {location.totalDeviceCount || 0} appareils
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    <div>Médicaux: {location.medicalDeviceCount || 0}</div>
                    <div>Diagnostics: {location.diagnosticDeviceCount || 0}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={location.isActive ? "default" : "destructive"}>
                    {location.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewStock(location)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir le stock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!paginatedData?.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Aucun emplacement trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
      {filteredLocations && filteredLocations.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Affichage de {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} à {Math.min(currentPage * itemsPerPage, filteredLocations.length)} sur {filteredLocations.length} emplacements
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
      
      {/* Stock View Dialog */}
      {selectedLocation && (
        <StockViewDialog
          locationId={selectedLocation.id}
          locationName={selectedLocation.name}
          isOpen={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
        />
      )}
    </div>
  );
}