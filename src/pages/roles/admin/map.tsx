import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Users, Filter, Search } from 'lucide-react';

// Dynamically import the entire Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
}

// Tunisia regions with their center coordinates
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
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite' | 'light'>('street');

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, selectedRegion, searchTerm]);

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

  const filterPatients = () => {
    let filtered = patients;

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(patient => patient.region === selectedRegion);
    }

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.delegation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPatients(filtered);
  };

  const getRegionStats = (region: string) => {
    return patients.filter(patient => patient.region === region).length;
  };

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carte des Patients</h1>
          <p className="text-gray-600">Visualisez la répartition géographique de vos patients par délégation et région</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un patient, délégation..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">Toutes les régions</option>
                {Object.keys(tunisiaRegions).map(region => (
                  <option key={region} value={region}>
                    {region} ({getRegionStats(region)})
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={20} />
              <span className="text-sm font-medium text-blue-900">
                {filteredPatients.length} patients
              </span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden relative" style={{ height: '600px' }}>
          {!loading && <MapComponent patients={filteredPatients} />}
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
            <h4 className="font-semibold text-sm text-gray-900 mb-2">Légende</h4>
            <div className="space-y-2">
              {/* Company Headquarters */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-900 rounded flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 21h18M4 21V7l8-4v18M20 21V11l-8-4"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600 font-medium">Elite Medical Services (Siège)</span>
              </div>
              
              {/* Patient Visit Status */}
              <div className="border-t pt-1.5">
                <h5 className="text-xs font-medium text-gray-700 mb-1.5">Statut des visites</h5>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Visite récente (&lt; 30 jours)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Visite modérée (30-90 jours)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Visite ancienne (&gt; 90 jours)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-xs text-gray-600">Aucune visite</span>
                  </div>
                </div>
              </div>

              {/* Diagnostic Status */}
              <div className="border-t pt-1.5">
                <h5 className="text-xs font-medium text-gray-700 mb-1.5">Patients avec diagnostics</h5>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></div>
                    <span className="text-xs text-gray-600">Diagnostic avec suivi requis</span>
                  </div>
                </div>
              </div>

              {/* Device Status */}
              <div className="border-t pt-1.5">
                <h5 className="text-xs font-medium text-gray-700 mb-1.5">Patients avec équipements</h5>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600 border border-purple-800"></div>
                    <span className="text-xs text-gray-600">Patient avec équipements</span>
                  </div>
                </div>
              </div>

              {/* Status Types */}
              <div className="border-t pt-1.5">
                <h5 className="text-xs font-medium text-gray-700 mb-1.5">Types de statuts</h5>
                <div className="flex flex-wrap gap-1">
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Loué</span>
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Vendu</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">Assigné</span>
                  <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">En attente</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Region Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(tunisiaRegions).map(([region]) => {
            const count = getRegionStats(region);
            if (count === 0) return null;
            
            return (
              <div key={region} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-blue-600" size={16} />
                    <h3 className="font-medium text-gray-900">{region}</h3>
                  </div>
                  <span className="text-lg font-semibold text-blue-600">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
};

export default MapPreview;