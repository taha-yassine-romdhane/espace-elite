import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number, lng: number) => void;
}

// Fix Leaflet default icon issue
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

// Custom HQ marker icon
const createHQIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(30, 64, 175, 0.4);
        border: 3px solid white;
      ">
        <svg style="transform: rotate(45deg);" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M3 21h18M4 21V7l8-4v18M20 21V11l-8-4"/>
        </svg>
      </div>
    `,
    className: 'hq-location-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
};

// Component to handle map clicks
const MapClickHandler: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map
const MapRecenter: React.FC<{ lat: number; lng: number; zoom?: number }> = ({ lat, lng, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], zoom || map.getZoom());
    }
  }, [lat, lng, zoom, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Tunisia center as default
  const defaultCenter: [number, number] = [35.8, 10.2];
  const currentCenter: [number, number] = latitude && longitude
    ? [latitude, longitude]
    : defaultCenter;

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Search for location using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Tunisia')}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        onLocationChange(newLat, newLng);

        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], 15);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset to Tunisia center
  const handleReset = () => {
    if (mapRef.current) {
      mapRef.current.setView(defaultCenter, 7);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher une adresse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          title="Recentrer sur la Tunisie"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200" style={{ height: '350px' }}>
        <MapContainer
          center={currentCenter}
          zoom={latitude && longitude ? 13 : 7}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={onLocationChange} />

          {latitude && longitude && (
            <>
              <Marker
                position={[latitude, longitude]}
                icon={createHQIcon()}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onLocationChange(position.lat, position.lng);
                  },
                }}
              />
              <MapRecenter lat={latitude} lng={longitude} />
            </>
          )}
        </MapContainer>

        {/* Instructions overlay */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 z-[1000]">
          <p className="text-xs text-gray-600 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            Cliquez sur la carte ou glissez le marqueur
          </p>
        </div>
      </div>

      {/* Current coordinates display */}
      {latitude && longitude && (
        <div className="flex items-center gap-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Latitude:</span>{' '}
              <span className="font-mono font-medium text-gray-900">{latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">Longitude:</span>{' '}
              <span className="font-mono font-medium text-gray-900">{longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}

      {!latitude && !longitude && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <MapPin className="h-3.5 w-3.5" />
          Aucun emplacement sélectionné. Cliquez sur la carte pour définir le siège.
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
