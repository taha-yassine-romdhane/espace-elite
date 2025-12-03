import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, Filter, Search, Building2, Activity, Package, Key, ShoppingCart, Stethoscope, Calendar, ClipboardList } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-sm text-slate-600">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

interface Device {
  id: string;
  name: string;
  serialNumber?: string | null;
  status: 'RENTED' | 'SOLD' | 'ASSIGNED';
  startDate?: string;
  endDate?: string | null;
}

interface DiagnosticDevice {
  id: string;
  deviceName: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  diagnosticDate: string;
  followUpDate?: string | null;
}

interface Patient {
  id: string;
  name: string;
  delegation: string;
  region: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  phoneTwo?: string | null;
  cin?: string | null;
  age?: number | null;
  createdAt?: string;
  lastVisit?: string | null;
  technician?: string | null;
  hasDevices?: boolean;
  hasDiagnostics?: boolean;
  hasRentals?: boolean;
  hasSales?: boolean;
  hasAppointments?: boolean;
  hasManualTasks?: boolean;
  devices?: Device[];
  diagnostics?: DiagnosticDevice[];
  appointments?: Array<{ id: string }>;
  manualTasks?: Array<{ id: string }>;
}

type ActivityFilter = 'all' | 'rentals' | 'sales' | 'diagnostics_only' | 'appointments' | 'manual_tasks';

const tunisiaRegions = {
  'Tunis': { lat: 36.8065, lng: 10.1815 },
  'Ariana': { lat: 36.8625, lng: 10.1956 },
  'Ben Arous': { lat: 36.7545, lng: 10.2487 },
  'Manouba': { lat: 36.8101, lng: 10.0956 },
  'Nabeul': { lat: 36.4561, lng: 10.7376 },
  'Zaghouan': { lat: 36.4019, lng: 10.1430 },
  'Bizerte': { lat: 37.2746, lng: 9.8739 },
  'Béja': { lat: 36.7255, lng: 9.1817 },
  'Jendouba': { lat: 36.5011, lng: 8.7808 },
  'Le Kef': { lat: 36.1826, lng: 8.7148 },
  'Siliana': { lat: 36.0850, lng: 9.3708 },
  'Sousse': { lat: 35.8288, lng: 10.6405 },
  'Monastir': { lat: 35.7643, lng: 10.8113 },
  'Mahdia': { lat: 35.5047, lng: 11.0622 },
  'Sfax': { lat: 34.7406, lng: 10.7603 },
  'Kairouan': { lat: 35.6781, lng: 10.0963 },
  'Kasserine': { lat: 35.1674, lng: 8.8365 },
  'Sidi Bouzid': { lat: 35.0381, lng: 9.4858 },
  'Gabès': { lat: 33.8815, lng: 10.0982 },
  'Médenine': { lat: 33.3540, lng: 10.5053 },
  'Tataouine': { lat: 32.9297, lng: 10.4518 },
  'Gafsa': { lat: 34.4250, lng: 8.7842 },
  'Tozeur': { lat: 33.9197, lng: 8.1337 },
  'Kébili': { lat: 33.7048, lng: 8.9699 }
};

const MapPreview: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ['general-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/general');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients/locations');
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Error fetching patient locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(patient => patient.region === selectedRegion);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(term) ||
        patient.delegation.toLowerCase().includes(term) ||
        patient.address?.toLowerCase().includes(term)
      );
    }

    // Apply activity filter
    if (activityFilter !== 'all') {
      filtered = filtered.filter(patient => {
        const hasRentals = patient.devices?.some(d => d.status === 'RENTED') || false;
        const hasSales = patient.devices?.some(d => d.status === 'SOLD') || false;
        const hasDiagnostics = (patient.diagnostics?.length || 0) > 0;
        const hasAppointments = (patient.appointments?.length || 0) > 0;
        const hasManualTasks = (patient.manualTasks?.length || 0) > 0;

        switch (activityFilter) {
          case 'rentals':
            return hasRentals;
          case 'sales':
            return hasSales;
          case 'diagnostics_only':
            return hasDiagnostics && !hasRentals && !hasSales;
          case 'appointments':
            return hasAppointments;
          case 'manual_tasks':
            return hasManualTasks;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [patients, selectedRegion, searchTerm, activityFilter]);

  const stats = useMemo(() => {
    const withDevices = filteredPatients.filter(p => p.hasDevices).length;
    const withDiagnostics = filteredPatients.filter(p => p.hasDiagnostics).length;
    const activeRegions = new Set(filteredPatients.map(p => p.region)).size;
    return { withDevices, withDiagnostics, activeRegions };
  }, [filteredPatients]);

  // Calculate counts for each filter (based on region/search filtered patients, not activity filter)
  const filterCounts = useMemo(() => {
    // Apply only region and search filters (not activity filter)
    let baseFiltered = patients;

    if (selectedRegion !== 'all') {
      baseFiltered = baseFiltered.filter(patient => patient.region === selectedRegion);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      baseFiltered = baseFiltered.filter(patient =>
        patient.name.toLowerCase().includes(term) ||
        patient.delegation.toLowerCase().includes(term) ||
        patient.address?.toLowerCase().includes(term)
      );
    }

    const all = baseFiltered.length;
    const rentals = baseFiltered.filter(p => p.devices?.some(d => d.status === 'RENTED')).length;
    const sales = baseFiltered.filter(p => p.devices?.some(d => d.status === 'SOLD')).length;
    const diagnosticsOnly = baseFiltered.filter(p => {
      const hasRentals = p.devices?.some(d => d.status === 'RENTED') || false;
      const hasSales = p.devices?.some(d => d.status === 'SOLD') || false;
      const hasDiagnostics = (p.diagnostics?.length || 0) > 0;
      return hasDiagnostics && !hasRentals && !hasSales;
    }).length;
    const appointments = baseFiltered.filter(p => (p.appointments?.length || 0) > 0).length;
    const manualTasks = baseFiltered.filter(p => (p.manualTasks?.length || 0) > 0).length;

    return { all, rentals, sales, diagnosticsOnly, appointments, manualTasks };
  }, [patients, selectedRegion, searchTerm]);

  const getRegionStats = (region: string) => {
    return patients.filter(patient => patient.region === region).length;
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 lg:p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              Carte des Patients
            </h1>
            <p className="text-blue-100 text-sm mt-1">Visualisez la répartition géographique de vos patients</p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Users className="h-4 w-4" />
              <div className="text-right">
                <div className="text-lg font-bold">{filteredPatients.length}</div>
                <div className="text-[10px] text-blue-200 uppercase tracking-wide">Patients</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Package className="h-4 w-4 text-purple-300" />
              <div className="text-right">
                <div className="text-lg font-bold">{stats.withDevices}</div>
                <div className="text-[10px] text-blue-200 uppercase tracking-wide">Équipés</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <Activity className="h-4 w-4 text-orange-300" />
              <div className="text-right">
                <div className="text-lg font-bold">{stats.withDiagnostics}</div>
                <div className="text-[10px] text-blue-200 uppercase tracking-wide">Diagnostics</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
              <MapPin className="h-4 w-4 text-green-300" />
              <div className="text-right">
                <div className="text-lg font-bold">{stats.activeRegions}</div>
                <div className="text-[10px] text-blue-200 uppercase tracking-wide">Régions</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un patient, délégation, adresse..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">Toutes les régions</option>
                {Object.keys(tunisiaRegions).map(region => {
                  const count = getRegionStats(region);
                  return count > 0 ? (
                    <option key={region} value={region}>
                      {region} ({count})
                    </option>
                  ) : null;
                })}
              </select>
            </div>
          </div>

          {/* Activity Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 font-medium mr-2">Filtrer par:</span>
            <button
              onClick={() => setActivityFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="h-4 w-4" />
              Tous
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {filterCounts.all}
              </span>
            </button>
            <button
              onClick={() => setActivityFilter('rentals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'rentals'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-100'
              }`}
            >
              <Key className="h-4 w-4" />
              Locations
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'rentals' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                {filterCounts.rentals}
              </span>
            </button>
            <button
              onClick={() => setActivityFilter('sales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'sales'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-green-100'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Ventes
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'sales' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'
              }`}>
                {filterCounts.sales}
              </span>
            </button>
            <button
              onClick={() => setActivityFilter('diagnostics_only')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'diagnostics_only'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-orange-100'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Diagnostics uniquement
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'diagnostics_only' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'
              }`}>
                {filterCounts.diagnosticsOnly}
              </span>
            </button>
            <button
              onClick={() => setActivityFilter('appointments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'appointments'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-cyan-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              RDV
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'appointments' ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-700'
              }`}>
                {filterCounts.appointments}
              </span>
            </button>
            <button
              onClick={() => setActivityFilter('manual_tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activityFilter === 'manual_tasks'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-pink-100'
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Tâches
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activityFilter === 'manual_tasks' ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'
              }`}>
                {filterCounts.manualTasks}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border relative" style={{ height: '650px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-slate-600">Chargement des patients...</p>
            </div>
          </div>
        ) : (
          <MapComponent patients={filteredPatients} companySettings={companySettings} />
        )}

        {/* Compact Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 z-[1000] max-w-[280px]">
          <h4 className="font-semibold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Légende des couleurs
          </h4>

          {/* HQ */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
            <div className="w-5 h-5 bg-blue-900 rounded flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-[11px] text-slate-600">Siège {companySettings?.companyName || 'Entreprise'}</span>
          </div>

          {/* Patient Categories */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-1">Type de patient</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500 ring-2 ring-purple-300"></div>
                <span className="text-[11px] text-slate-700 font-medium">Location</span>
                <span className="text-[10px] text-slate-500">- Patient avec location active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></div>
                <span className="text-[11px] text-slate-700 font-medium">Vente</span>
                <span className="text-[10px] text-slate-500">- Patient avec vente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500 ring-2 ring-amber-300"></div>
                <span className="text-[11px] text-slate-700 font-medium">Diagnostic</span>
                <span className="text-[10px] text-slate-500">- Non appareillé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-slate-400 ring-2 ring-white"></div>
                <span className="text-[11px] text-slate-700 font-medium">Nouveau</span>
                <span className="text-[10px] text-slate-500">- Sans activité</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Hint */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border px-3 py-2 z-[1000]">
          <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
            <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Zoomez pour voir les initiales</span>
          </p>
        </div>
      </div>

      {/* Region Cards - Only show regions with patients */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Object.entries(tunisiaRegions).map(([region]) => {
          const count = getRegionStats(region);
          if (count === 0) return null;

          return (
            <button
              key={region}
              onClick={() => setSelectedRegion(region === selectedRegion ? 'all' : region)}
              className={`p-3 rounded-lg border transition-all text-left ${
                selectedRegion === region
                  ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <MapPin className={`h-4 w-4 ${selectedRegion === region ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className={`text-lg font-bold ${selectedRegion === region ? 'text-blue-600' : 'text-slate-700'}`}>
                  {count}
                </span>
              </div>
              <p className={`text-xs mt-1 truncate ${selectedRegion === region ? 'text-blue-700' : 'text-slate-600'}`}>
                {region}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapPreview;
