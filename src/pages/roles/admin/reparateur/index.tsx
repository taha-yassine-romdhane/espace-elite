import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Building, Plus, Pencil, Trash2, MapPin, Search, Filter, Download, BarChart3, AlertTriangle, CheckCircle, Wrench, Package, Hospital, Settings, Phone, Mail, User, Calendar, Loader2, ClipboardList, DollarSign, Check, X } from 'lucide-react';
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
import AdminLayout from '../AdminLayout';

type Location = {
  id: string;
  name: string;
  address?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  repairs?: {
    id: string;
  }[];
  _count?: {
    repairs: number;
  };
};

type RepairLog = {
  id: string;
  repairCode?: string;
  repairCost: number;
  locationId: string;
  repairDate: Date;
  notes?: string;
  technicianId?: string;
  medicalDeviceId: string;
  createdAt: Date;
  location: {
    name: string;
    type: string;
  };
  medicalDevice: {
    deviceCode?: string;
    name: string;
    type: string;
  };
  technician?: {
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  spareParts: {
    id: string;
    quantity: number;
    product: {
      productCode?: string;
      name: string;
      sellingPrice?: number;
    };
  }[];
};

function RepairLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [repairLogs, setRepairLogs] = useState<RepairLog[]>([]);
  const [medicalDevices, setMedicalDevices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [repairSearchTerm, setRepairSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilterForRepairs, setLocationFilterForRepairs] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRepairs, setIsLoadingRepairs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('locations');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Atelier',
  });

  // Repair form state
  const [isAddingRepair, setIsAddingRepair] = useState(false);
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [selectedSpareParts, setSelectedSpareParts] = useState<{ id: string; name: string; quantity: number; purchasePrice: number }[]>([]);
  const [repairFormData, setRepairFormData] = useState({
    medicalDeviceId: '',
    locationId: '',
    technicianId: '',
    repairDate: new Date().toISOString().split('T')[0],
    repairCost: 0,
    additionalCost: 0,
    notes: ''
  });

  const locationTypes = ['Atelier', 'Fournisseur', 'Centre de Service', 'Autre'];

  useEffect(() => {
    fetchLocations();
    fetchRepairLogs();
    fetchMedicalDevices();
    fetchEmployees();
    fetchSpareParts();
  }, []);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/repair-locations');
      if (!response.ok) throw new Error('Failed to fetch repair locations');
      const data = await response.json();
      setLocations(data);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les réparateurs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRepairLogs = async () => {
    setIsLoadingRepairs(true);
    try {
      const response = await fetch('/api/repair-logs');
      if (!response.ok) throw new Error('Failed to fetch repair logs');
      const data = await response.json();
      setRepairLogs(data);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique des réparations',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRepairs(false);
    }
  };

  const fetchMedicalDevices = async () => {
    try {
      const response = await fetch('/api/medical-devices');
      if (!response.ok) throw new Error('Failed to fetch medical devices');
      const data = await response.json();
      setMedicalDevices(data);
    } catch (error) {
      console.error('Error fetching medical devices:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/users/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSpareParts = async () => {
    try {
      const response = await fetch('/api/products?type=SPARE_PART');
      if (!response.ok) throw new Error('Failed to fetch spare parts');
      const data = await response.json();
      setSpareParts(data);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      type: 'Atelier',
    });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/repair-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add location');

      const newLocation = await response.json();
      setLocations([...locations, newLocation]);
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Succès',
        description: `Réparateur "${formData.name}" ajouté avec succès`,
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Échec de l\'ajout du réparateur',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    try {
      const response = await fetch('/api/repair-locations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedLocation.id,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update location');

      const updatedLocation = await response.json();
      setLocations(locations.map(loc => 
        loc.id === updatedLocation.id ? updatedLocation : loc
      ));
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: 'Succès',
        description: 'Réparateur modifié avec succès',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Échec de la modification du réparateur',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;

    try {
      const response = await fetch(`/api/repair-locations?id=${selectedLocation.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete location');

      setLocations(locations.filter(loc => loc.id !== selectedLocation.id));
      setIsDeleteDialogOpen(false);
      setSelectedLocation(null);
      toast({
        title: 'Succès',
        description: 'Réparateur supprimé avec succès',
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression du réparateur',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      type: location.type,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteDialogOpen(true);
  };

  // Filter and search logic for locations
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Filter and search logic for repair logs
  const filteredRepairLogs = repairLogs.filter(repair => {
    const matchesSearch = repair.repairCode?.toLowerCase().includes(repairSearchTerm.toLowerCase()) ||
                         repair.medicalDevice.name.toLowerCase().includes(repairSearchTerm.toLowerCase()) ||
                         repair.medicalDevice.deviceCode?.toLowerCase().includes(repairSearchTerm.toLowerCase()) ||
                         repair.notes?.toLowerCase().includes(repairSearchTerm.toLowerCase());
    const matchesLocation = locationFilterForRepairs === 'all' || repair.locationId === locationFilterForRepairs;
    return matchesSearch && matchesLocation;
  });

  // Statistics
  const stats = {
    total: locations.length,
    byType: locationTypes.reduce((acc, type) => {
      acc[type] = locations.filter(loc => loc.type === type).length;
      return acc;
    }, {} as Record<string, number>),
    totalRepairs: repairLogs.length,
    totalRepairCost: repairLogs.reduce((acc, repair) => acc + Number(repair.repairCost), 0)
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Atelier':
        return <Wrench className="h-4 w-4" />;
      case 'Fournisseur':
        return <Package className="h-4 w-4" />;
      case 'Centre de Service':
        return <Hospital className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };


  const handleDialogClose = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Atelier':
        return 'bg-blue-100 text-blue-800';
      case 'Fournisseur':
        return 'bg-green-100 text-green-800';
      case 'Centre de Service':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            Gestion des Réparateurs
          </h1>
          <p className="text-gray-600 mt-1">Gérez les lieux de réparation et ateliers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Ajouter un réparateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building className="h-5 w-5 text-blue-600" />
                Ajouter un nouveau réparateur
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Remplissez les informations du réparateur ou atelier
              </p>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nom du réparateur *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Atelier Médical Central"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type" className="text-sm font-medium">
                    Type *
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type)}
                            {type}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Adresse complète
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète avec ville et code postal"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le réparateur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Réparateurs</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Building className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ateliers</p>
                <p className="text-2xl font-bold text-green-600">{stats.byType['Atelier'] || 0}</p>
              </div>
              <Wrench className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fournisseurs</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byType['Fournisseur'] || 0}</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Réparations</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalRepairs}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Locations and Repair History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Réparateurs ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Historique des Réparations ({repairLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-6">
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Recherche et Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom ou adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type-filter">Filtrer par type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {locationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(searchTerm || typeFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                {filteredLocations.length} résultat{filteredLocations.length !== 1 ? 's' : ''} trouvé{filteredLocations.length !== 1 ? 's' : ''}
                {filteredLocations.length !== locations.length && ` sur ${locations.length} total`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le réparateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Adresse</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement le réparateur
              {selectedLocation && ` "${selectedLocation.name}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Liste des réparateurs ({filteredLocations.length})
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des réparateurs...</p>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || typeFilter !== 'all' ? 'Aucun résultat' : 'Aucun réparateur'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || typeFilter !== 'all' 
                  ? 'Aucun réparateur ne correspond à vos critères de recherche.'
                  : 'Commencez par ajouter votre premier lieu de réparation.'
                }
              </p>
              {!(searchTerm || typeFilter !== 'all') && (
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un réparateur
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Réparations</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(location.type)}
                          <span>{location.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {location.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="max-w-xs truncate" title={location.address}>
                              {location.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Aucune adresse</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(location.type)}`}>
                          {location.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {location.repairs && location.repairs.length > 0 ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium text-green-700">
                                {location.repairs.length}
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">0</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(location.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(location)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(location)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="repairs" className="space-y-6">
          {/* Add Repair Button */}
          <div className="flex justify-end">
            <Button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddingRepair(!isAddingRepair)}
            >
              <Plus className="h-4 w-4" />
              {isAddingRepair ? 'Annuler' : 'Ajouter une réparation'}
            </Button>
          </div>

          {/* Repair Logs Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Recherche et Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="repair-search">Rechercher</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="repair-search"
                      placeholder="Code, appareil, notes..."
                      value={repairSearchTerm}
                      onChange={(e) => setRepairSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location-filter">Filtrer par réparateur</Label>
                  <Select value={locationFilterForRepairs} onValueChange={setLocationFilterForRepairs}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les réparateurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les réparateurs</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(repairSearchTerm || locationFilterForRepairs !== 'all') && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {filteredRepairLogs.length} résultat{filteredRepairLogs.length !== 1 ? 's' : ''} trouvé{filteredRepairLogs.length !== 1 ? 's' : ''}
                    {filteredRepairLogs.length !== repairLogs.length && ` sur ${repairLogs.length} total`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRepairSearchTerm('');
                      setLocationFilterForRepairs('all');
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Historique des Réparations ({filteredRepairLogs.length})
                </div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingRepairs ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des réparations...</p>
                </div>
              ) : filteredRepairLogs.length === 0 && !isAddingRepair ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {repairSearchTerm || locationFilterForRepairs !== 'all' ? 'Aucun résultat' : 'Aucune réparation'}
                  </h3>
                  <p className="text-gray-600">
                    {repairSearchTerm || locationFilterForRepairs !== 'all'
                      ? 'Aucune réparation ne correspond à vos critères de recherche.'
                      : 'Aucune réparation enregistrée pour le moment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Appareil</TableHead>
                        <TableHead className="whitespace-nowrap">Réparateur</TableHead>
                        <TableHead className="whitespace-nowrap">Technicien</TableHead>
                        <TableHead className="whitespace-nowrap">Pièces Utilisées</TableHead>
                        <TableHead className="whitespace-nowrap">Coût (DT)</TableHead>
                        <TableHead className="whitespace-nowrap">Notes</TableHead>
                        <TableHead className="whitespace-nowrap w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isAddingRepair && (
                        <TableRow className="bg-blue-50 border-b-2 border-blue-200">
                          <TableCell>
                            <Input
                              type="date"
                              value={repairFormData.repairDate}
                              onChange={(e) => setRepairFormData({ ...repairFormData, repairDate: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={repairFormData.medicalDeviceId}
                              onValueChange={(value) => setRepairFormData({ ...repairFormData, medicalDeviceId: value })}
                            >
                              <SelectTrigger className="h-8 text-xs w-48">
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                {medicalDevices.map((device: any) => (
                                  <SelectItem key={device.id} value={device.id}>
                                    {device.name} ({device.deviceCode || 'N/A'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={repairFormData.locationId}
                              onValueChange={(value) => setRepairFormData({ ...repairFormData, locationId: value })}
                            >
                              <SelectTrigger className="h-8 text-xs w-40">
                                <SelectValue placeholder="Lieu..." />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((location) => (
                                  <SelectItem key={location.id} value={location.id}>
                                    {location.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={repairFormData.technicianId}
                              onValueChange={(value) => setRepairFormData({ ...repairFormData, technicianId: value })}
                            >
                              <SelectTrigger className="h-8 text-xs w-40">
                                <SelectValue placeholder="Technicien..." />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                // TODO: Open spare parts selector dialog
                                toast({
                                  title: 'Info',
                                  description: 'Sélecteur de pièces à implémenter',
                                });
                              }}
                            >
                              + Pièces ({selectedSpareParts.length})
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={repairFormData.repairCost || ''}
                              onChange={(e) => setRepairFormData({ ...repairFormData, repairCost: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-xs w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Textarea
                              placeholder="Notes..."
                              value={repairFormData.notes}
                              onChange={(e) => setRepairFormData({ ...repairFormData, notes: e.target.value })}
                              className="h-8 text-xs min-h-[32px] resize-none"
                              rows={1}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                                onClick={async () => {
                                  // TODO: Implement save
                                  toast({
                                    title: 'Info',
                                    description: 'Fonction de sauvegarde à implémenter',
                                  });
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setIsAddingRepair(false);
                                  setRepairFormData({
                                    medicalDeviceId: '',
                                    locationId: '',
                                    technicianId: '',
                                    repairDate: new Date().toISOString().split('T')[0],
                                    repairCost: 0,
                                    additionalCost: 0,
                                    notes: ''
                                  });
                                  setSelectedSpareParts([]);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredRepairLogs.map((repair) => (
                        <TableRow key={repair.id} className="hover:bg-gray-50">
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(repair.repairDate).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-blue-900">
                                {repair.medicalDevice.name}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {repair.medicalDevice.deviceCode || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(repair.location.type)}
                              <span className="text-sm">{repair.location.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {repair.technician
                              ? `${repair.technician.user.firstName} ${repair.technician.user.lastName}`
                              : <span className="text-gray-400 italic">Non assigné</span>
                            }
                          </TableCell>
                          <TableCell>
                            {repair.spareParts.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {repair.spareParts.map((part) => (
                                  <div key={part.id} className="flex items-center gap-1 text-xs">
                                    <Badge variant="secondary" className="text-xs">
                                      {part.quantity}x
                                    </Badge>
                                    <span className="text-blue-900">{part.product.name}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Aucune</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1 font-medium text-blue-900">
                              <DollarSign className="h-3 w-3" />
                              {Number(repair.repairCost).toFixed(2)} DT
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <span className="text-sm text-gray-600 line-clamp-2">
                              {repair.notes || <span className="italic text-gray-400">Aucune note</span>}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                title="Modifier"
                                onClick={() => {
                                  toast({
                                    title: 'Info',
                                    description: 'Fonction de modification à implémenter',
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                title="Supprimer"
                                onClick={() => {
                                  toast({
                                    title: 'Info',
                                    description: 'Fonction de suppression à implémenter',
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add layout wrapper
RepairLocations.getLayout = function getLayout(page: React.ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default RepairLocations;