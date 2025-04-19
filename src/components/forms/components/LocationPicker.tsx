import React, { useState, useEffect } from 'react';
import { MapPin, X, Search, MapPinOff } from 'lucide-react';

const defaultCenter = {
  lat: 36.8065, // Default center for Tunisia
  lng: 10.1815
};

interface LocationPickerProps {
  initialAddress?: string;
  onAddressChange: (address: string) => void;
  onCoordinatesChange: (coordinates: { lat: number; lng: number }) => void;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}



const LocationPicker: React.FC<LocationPickerProps> = ({
  initialAddress = '',
  onAddressChange,
  onCoordinatesChange
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<Coordinates>(defaultCenter);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  // Update coordinates if initialAddress changes and we don't have coordinates yet
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialAddress, address]);



  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onAddressChange(data.display_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'fr' } }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);
    onAddressChange(newAddress);
    setSearchQuery(newAddress);
  };

  const toggleMap = () => {
    setShowMap(!showMap);
    // Clear search results when closing the map
    if (showMap) {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const newCoordinates = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    setCoordinates(newCoordinates);
    onCoordinatesChange(newCoordinates);
    setAddress(result.display_name);
    onAddressChange(result.display_name);
    setSearchResults([]);
    setShowMap(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocation();
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={handleManualAddressChange}
          placeholder="Entrez une adresse"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={toggleMap}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500"
        >
          <MapPin size={20} />
        </button>
      </div>

      {showMap && (
        <div className="mt-2 relative border border-gray-300 rounded-md p-2 bg-white">
          <div className="absolute right-2 top-2 z-10">
            <button
              type="button"
              onClick={toggleMap}
              className="bg-white p-1 rounded-full shadow-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Rechercher un lieu"
              className="w-full p-2 border border-gray-300 rounded-md pr-10"
            />
            <button 
              type="button" 
              onClick={searchLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-500"
            >
              <Search size={18} />
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mb-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              <ul className="divide-y divide-gray-200">
                {searchResults.map((result, index) => (
                  <li 
                    key={index} 
                    className="p-2 hover:bg-blue-50 cursor-pointer"
                    onClick={() => selectSearchResult(result)}
                  >
                    {result.display_name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Coordonnées enregistrées</h3>
              <button 
                type="button"
                onClick={() => {
                  setCoordinates(defaultCenter);
                  onCoordinatesChange(defaultCenter);
                }}
                className="text-xs text-gray-500 flex items-center gap-1 hover:text-blue-500"
              >
                <MapPinOff size={14} />
                Réinitialiser
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input 
                  type="text" 
                  value={coordinates.lat.toFixed(6)}
                  readOnly
                  className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input 
                  type="text" 
                  value={coordinates.lng.toFixed(6)}
                  readOnly
                  className="w-full p-2 bg-white border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Pour une intégration complète avec une carte, veuillez contacter l'équipe de développement.
            </div>
          </div>
          
          {isSearching && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
