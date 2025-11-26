import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Users, Filter, Search, Building2, Activity, Package } from 'lucide-react';

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

interface Patient {
  id: string;
  name: string;
  delegation: string;
  region: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  lastVisit?: string;
  hasDevices?: boolean;
  hasDiagnostics?: boolean;
}

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

    return filtered;
  }, [patients, selectedRegion, searchTerm]);

  const stats = useMemo(() => {
    const withDevices = filteredPatients.filter(p => p.hasDevices).length;
    const withDiagnostics = filteredPatients.filter(p => p.hasDiagnostics).length;
    const activeRegions = new Set(filteredPatients.map(p => p.region)).size;
    return { withDevices, withDiagnostics, activeRegions };
  }, [filteredPatients]);

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
          <MapComponent patients={filteredPatients} />
        )}

        {/* Compact Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border p-3 z-[1000] max-w-[260px]">
          <h4 className="font-semibold text-xs text-slate-800 mb-2 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Légende
          </h4>

          {/* HQ */}
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
            <div className="w-5 h-5 bg-blue-900 rounded flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-[11px] text-slate-600">Siège Elite Medical</span>
          </div>

          {/* Status Legend */}
          <div className="space-y-1.5 pb-2 mb-2 border-b border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Statut visite</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-600">Récente (&lt;30j)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-[10px] text-slate-600">Modérée (30-90j)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-slate-600">Ancienne (&gt;90j)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-[10px] text-slate-600">Nouvelle</span>
              </div>
            </div>
          </div>

          {/* Special Categories */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Catégories</p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-300"></div>
                <span className="text-[10px] text-slate-600">Équipement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-300"></div>
                <span className="text-[10px] text-slate-600">Diagnostic</span>
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
