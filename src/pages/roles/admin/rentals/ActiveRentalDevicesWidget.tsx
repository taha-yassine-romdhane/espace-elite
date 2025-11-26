import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Stethoscope, User, UserCog, Calendar, AlertCircle, Package, Search, X, Filter } from "lucide-react";

interface ActiveRentalDevice {
  id: string;
  rentalId: string;
  rentalCode: string;
  deviceName: string;
  deviceCode: string;
  serialNumber: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  employeeName: string;
  startDate: string;
  endDate: string | null;
  rentalRate: number;
  billingCycle: string;
}

export default function ActiveRentalDevicesWidget() {
  const router = useRouter();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch active rentals with device and patient info
  const { data: rentalsData, isLoading, error } = useQuery({
    queryKey: ['active-rental-devices'],
    queryFn: async () => {
      const response = await fetch('/api/rentals/comprehensive?status=ACTIVE');
      if (!response.ok) throw new Error('Failed to fetch active rentals');
      const data = await response.json();

      // Transform the data to extract device information
      const devices: ActiveRentalDevice[] = [];

      if (Array.isArray(data)) {
        data.forEach((rental: any) => {
          if (rental.medicalDevice && rental.status === 'ACTIVE') {
            // Get employee name - try multiple possible fields
            let employeeName = 'N/A';
            if (rental.assignedTo) {
              employeeName = rental.assignedTo.name ||
                            (rental.assignedTo.firstName && rental.assignedTo.lastName
                              ? `${rental.assignedTo.firstName} ${rental.assignedTo.lastName}`.trim()
                              : 'N/A');
            } else if (rental.createdBy) {
              employeeName = rental.createdBy.name ||
                            (rental.createdBy.firstName && rental.createdBy.lastName
                              ? `${rental.createdBy.firstName} ${rental.createdBy.lastName}`.trim()
                              : 'N/A');
            }

            devices.push({
              id: rental.medicalDevice.id,
              rentalId: rental.id,
              rentalCode: rental.rentalCode || 'N/A',
              deviceName: rental.medicalDevice.name || 'Appareil sans nom',
              deviceCode: rental.medicalDevice.deviceCode || 'N/A',
              serialNumber: rental.medicalDevice.serialNumber || 'N/A',
              patientId: rental.patient?.id || '',
              patientName: rental.patient
                ? `${rental.patient.firstName || ''} ${rental.patient.lastName || ''}`.trim()
                : 'N/A',
              patientCode: rental.patient?.patientCode || 'N/A',
              employeeName: employeeName,
              startDate: rental.startDate,
              endDate: rental.endDate,
              rentalRate: rental.rentalRate || 0,
              billingCycle: rental.billingCycle || 'MONTHLY'
            });
          }
        });
      }

      return devices;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const devices = rentalsData || [];

  // Get unique employees and billing cycles for filters
  const uniqueEmployees = useMemo(() => {
    const employees = new Set(devices.map(d => d.employeeName).filter(name => name !== 'N/A'));
    return Array.from(employees).sort();
  }, [devices]);

  const uniqueBillingCycles = useMemo(() => {
    const cycles = new Set(devices.map(d => d.billingCycle));
    return Array.from(cycles);
  }, [devices]);

  // Filter and search devices
  const filteredDevices = useMemo(() => {
    let filtered = devices;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device =>
        device.deviceName.toLowerCase().includes(query) ||
        device.deviceCode.toLowerCase().includes(query) ||
        device.serialNumber.toLowerCase().includes(query) ||
        device.patientName.toLowerCase().includes(query) ||
        device.patientCode.toLowerCase().includes(query) ||
        device.rentalCode.toLowerCase().includes(query) ||
        device.employeeName.toLowerCase().includes(query)
      );
    }

    // Apply employee filter
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(device => device.employeeName === selectedEmployee);
    }

    // Apply billing cycle filter
    if (selectedBillingCycle !== 'all') {
      filtered = filtered.filter(device => device.billingCycle === selectedBillingCycle);
    }

    return filtered;
  }, [devices, searchQuery, selectedEmployee, selectedBillingCycle]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedEmployee('all');
    setSelectedBillingCycle('all');
  };

  const hasActiveFilters = searchQuery || selectedEmployee !== 'all' || selectedBillingCycle !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des appareils en location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">Erreur lors du chargement</p>
          <p className="text-sm text-gray-500 mt-1">
            {error instanceof Error ? error.message : 'Une erreur est survenue'}
          </p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Aucun appareil en location active</p>
          <p className="text-sm text-gray-400 mt-2">
            Les appareils actuellement loués apparaîtront ici
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Appareils en Location Active</h2>
          <p className="text-xs text-gray-500">
            {filteredDevices.length} sur {devices.length} appareil{devices.length > 1 ? 's' : ''}
          </p>
        </div>
        <Badge className="bg-green-600 text-white px-3 py-1">
          {filteredDevices.length} / {devices.length}
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par appareil, patient, code, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <Badge className="ml-1 bg-blue-600 text-white">!</Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="border-2 border-blue-100 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Géré par
                  </label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les employés" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les employés</SelectItem>
                      {uniqueEmployees.map((employee) => (
                        <SelectItem key={employee} value={employee}>
                          {employee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Cycle Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cycle de facturation
                  </label>
                  <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les cycles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les cycles</SelectItem>
                      {uniqueBillingCycles.map((cycle) => (
                        <SelectItem key={cycle} value={cycle}>
                          {cycle === 'DAILY' ? 'Par jour' :
                           cycle === 'WEEKLY' ? 'Par semaine' : 'Par mois'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Devices Grid - 3 Line Layout */}
      <ScrollArea className="h-[calc(100vh-400px)]">
        {filteredDevices.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium text-lg">
                {hasActiveFilters ? 'Aucun résultat trouvé' : 'Aucun appareil en location'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {hasActiveFilters ? 'Essayez de modifier vos critères de recherche' : 'Les appareils loués apparaîtront ici'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Effacer les filtres
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredDevices.map((device) => (
            <Card
              key={device.id}
              onClick={() => {
                if (device.patientId) {
                  router.push(`/roles/admin/renseignement/patient/${device.patientId}`);
                }
              }}
              className="hover:shadow-lg transition-shadow duration-200 border-2 border-blue-100 hover:border-blue-300 cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <CardContent className="p-4 space-y-3">
                {/* Line 1: Device Name, Code, Serial Number */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 truncate text-sm">
                      {device.deviceName}
                    </p>
                    <span className="text-[10px] text-blue-600 font-medium">
                      Cliquer pour détails →
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-300">
                      {device.deviceCode}
                    </Badge>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs font-mono text-gray-700">
                      SN: {device.serialNumber}
                    </span>
                  </div>
                </div>

                {/* Line 2: Rental Code & Patient */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <Badge variant="outline" className="text-xs font-mono bg-purple-50 text-purple-700 border-purple-300">
                      {device.rentalCode}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs text-gray-500 mb-1">Patient</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {device.patientName}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {device.patientCode}
                    </Badge>
                  </div>
                </div>

                {/* Line 3: Assigned To, Tarif, Date, Status */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Géré par</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {device.employeeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Tarif</p>
                      <p className="text-sm font-bold text-green-700">
                        {device.rentalRate.toFixed(2)} DT
                        <span className="text-xs font-normal text-gray-500">
                          /{device.billingCycle === 'DAILY' ? 'jour' :
                            device.billingCycle === 'WEEKLY' ? 'sem' : 'mois'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-500">
                        {new Date(device.startDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                      {device.endDate && (
                        <>
                          <span className="text-gray-400 mx-1">→</span>
                          <span className="text-gray-500">
                            {new Date(device.endDate).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </>
                      )}
                      {!device.endDate && (
                        <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                          Indéterminée
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-green-600 text-white text-xs">
                      Actif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
