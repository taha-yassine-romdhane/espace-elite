import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TUNISIA_GOVERNORATES } from '@/data/tunisia-locations';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapSelectorProps {
  initialCenter: { lat: number; lng: number };
  onLocationSelect: (coordinates: { 
    lat: number; 
    lng: number; 
    address?: string;
    governorate?: string;
    delegation?: string;
  }) => void;
  className?: string;
}

export default function SimpleMapSelector({ initialCenter, onLocationSelect, className = '' }: SimpleMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [tempLocation, setTempLocation] = useState<{ 
    lat: number; 
    lng: number; 
    address?: string;
    governorate?: string;
    delegation?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current || map) return;

    console.log('Initializing map with center:', initialCenter);
    console.log('Map container dimensions:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);

    // Ensure the container has dimensions
    if (mapRef.current.offsetHeight === 0) {
      mapRef.current.style.height = '400px';
      console.log('Set container height to 400px');
    }

    try {
      // Initialize map with simpler options
      const leafletMap = L.map(mapRef.current, {
        zoomControl: false, // We'll add a custom zoom control
        attributionControl: false
      }).setView([initialCenter.lat, initialCenter.lng], 13);

      console.log('Map initialized successfully');

    // Add tile layer with a cleaner style
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 5,
      attribution: '© OpenStreetMap contributors'
    });
    
    tileLayer.addTo(leafletMap);
    console.log('Tile layer added');
    
    // Force map to invalidate size after a short delay to ensure proper rendering
    setTimeout(() => {
      leafletMap.invalidateSize();
      console.log('Map size invalidated');
    }, 100);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(leafletMap);

    // Add attribution in a cleaner way
    L.control.attribution({
      position: 'bottomleft',
      prefix: false
    }).addTo(leafletMap).addAttribution('© OpenStreetMap');

    // Create a single marker that we'll reuse
    let currentMarker: L.Marker | null = null;

    // Handle map clicks
    leafletMap.on('click', async (e) => {
      const { lat, lng } = e.latlng;

      // Remove existing marker if any
      if (currentMarker) {
        leafletMap.removeLayer(currentMarker);
      }

      // Create new marker at clicked position
      currentMarker = L.marker([lat, lng]).addTo(leafletMap);
      setMarker(currentMarker);

      // Pan the map to ensure the marker is visible above the compact confirmation panel
      // Calculate the position to show the marker in the upper portion of the map
      const mapSize = leafletMap.getSize();
      const confirmationPanelHeight = 60; // Approximate height of the compact panel
      const availableHeight = mapSize.y - confirmationPanelHeight;
      const targetY = availableHeight * 0.4; // Position marker at 40% of available height
      
      const point = leafletMap.latLngToContainerPoint([lat, lng]);
      const newPoint = L.point(point.x, targetY);
      const newLatLng = leafletMap.containerPointToLatLng(newPoint);
      
      // Smoothly pan to the new position
      leafletMap.panTo([newLatLng.lat, lng], {
        animate: true,
        duration: 0.3 // Fast animation
      });

      // Set temporary location
      setTempLocation({ lat, lng });
      setIsLoading(true);

      // Try to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'PatientForm/1.0'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const address = formatAddress(data);
          const locationInfo = extractLocationInfo(data);
          
          setTempLocation({
            lat,
            lng,
            address: address || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
            governorate: locationInfo.governorate,
            delegation: locationInfo.delegation
          });
        } else {
          setTempLocation({ 
            lat, 
            lng, 
            address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` 
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setTempLocation({ 
          lat, 
          lng, 
          address: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}` 
        });
      } finally {
        setIsLoading(false);
      }
    });

    setMap(leafletMap);

    // Cleanup
    return () => {
      leafletMap.remove();
    };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [initialCenter.lat, initialCenter.lng]); // Only re-initialize if coordinates change

  const formatAddress = (data: any): string | null => {
    const address = data.address;
    if (address) {
      const parts = [];
      if (address.house_number) parts.push(address.house_number);
      if (address.road) parts.push(address.road);
      if (address.suburb) parts.push(address.suburb);
      if (address.city || address.town || address.village) {
        parts.push(address.city || address.town || address.village);
      }
      if (address.state) parts.push(address.state);
      
      return parts.length > 0 ? parts.join(', ') : data.display_name;
    }
    
    return data.display_name || null;
  };

  const extractLocationInfo = (data: any): { governorate?: string; delegation?: string } => {
    const address = data.address;
    if (!address) return {};

    console.log('Address data from geocoding:', address);

    // Common location fields from Nominatim
    const locationParts = [
      address.state,           // Governorate level
      address.county,          // Sometimes used for governorate
      address.city,            // City/delegation level
      address.town,            // Town/delegation level
      address.municipality,    // Municipality level
      address.suburb,          // Suburb level
      address.neighbourhood,   // Neighbourhood level
      address.village,         // Village level
    ].filter(Boolean);

    console.log('Location parts found:', locationParts);

    let matchedGovernorate: string | undefined;
    let matchedDelegation: string | undefined;

    // Try to match governorate first
    for (const part of locationParts) {
      const governorate = TUNISIA_GOVERNORATES.find(gov => 
        gov.name.toLowerCase().includes(part.toLowerCase()) ||
        part.toLowerCase().includes(gov.name.toLowerCase()) ||
        gov.nameAr === part
      );
      
      if (governorate) {
        matchedGovernorate = governorate.name; // Use name instead of ID
        console.log('Matched governorate:', governorate.name);
        
        // Now try to match delegation within this governorate
        console.log('Available delegations for', governorate.name, ':', governorate.delegations.map(d => ({ name: d.name, id: d.id })));
        
        for (const locationPart of locationParts) {
          console.log('Trying to match location part:', locationPart, 'against delegations');
          
          // Try more flexible matching for delegations
          const delegation = governorate.delegations.find(del => {
            const delNameLower = del.name.toLowerCase();
            const partLower = locationPart.toLowerCase();
            
            // Exact match
            if (delNameLower === partLower) return true;
            
            // Contains match (both ways)
            if (delNameLower.includes(partLower) || partLower.includes(delNameLower)) return true;
            
            // Arabic match
            if (del.nameAr === locationPart) return true;
            
            // Remove common prefixes/suffixes for better matching
            const cleanDelName = delNameLower.replace(/\s*(nord|sud|est|ouest|ville|center|centre)\s*/g, '').trim();
            const cleanPartName = partLower.replace(/\s*(north|south|east|west|city|center|centre)\s*/g, '').trim();
            
            if (cleanDelName === cleanPartName) return true;
            if (cleanDelName.includes(cleanPartName) || cleanPartName.includes(cleanDelName)) return true;
            
            return false;
          });
          
          if (delegation) {
            matchedDelegation = delegation.name; // Use name instead of ID
            console.log('✅ Matched delegation:', delegation.name);
            break;
          } else {
            console.log('❌ No match found for:', locationPart);
          }
        }
        
        // If no delegation found yet, try some manual mappings for the matched governorate
        if (!matchedDelegation && matchedGovernorate) {
          const gov = TUNISIA_GOVERNORATES.find(g => g.id === matchedGovernorate);
          if (gov) {
            for (const part of locationParts) {
              const partLower = part.toLowerCase();
              
              // Try to find a delegation that matches common patterns
              const fallbackDelegation = gov.delegations.find(del => {
                const words = partLower.split(/\s+/);
                const delWords = del.name.toLowerCase().split(/\s+/);
                
                // Check if any word in the location matches any word in delegation name
                return words.some((word: string) => 
                  delWords.some((delWord: string) => 
                    word.length > 2 && delWord.length > 2 && 
                    (word.includes(delWord) || delWord.includes(word))
                  )
                );
              });
              
              if (fallbackDelegation) {
                matchedDelegation = fallbackDelegation.id;
                console.log('✅ Fallback matched delegation:', fallbackDelegation.name, 'with id:', fallbackDelegation.id);
                break;
              }
            }
          }
        }
        
        break;
      }
    }

    // If no governorate matched, try some manual mappings for common variations
    if (!matchedGovernorate) {
      for (const part of locationParts) {
        const partLower = part.toLowerCase();
        
        // Manual mappings for common variations (using actual names)
        if (partLower.includes('tunis') || partLower.includes('تونس')) {
          matchedGovernorate = 'Tunis';
        } else if (partLower.includes('ariana') || partLower.includes('أريانة')) {
          matchedGovernorate = 'Ariana';
        } else if (partLower.includes('ben arous') || partLower.includes('بن عروس')) {
          matchedGovernorate = 'Ben Arous';
        } else if (partLower.includes('manouba') || partLower.includes('منوبة')) {
          matchedGovernorate = 'Manouba';
        } else if (partLower.includes('nabeul') || partLower.includes('نابل')) {
          matchedGovernorate = 'Nabeul';
        } else if (partLower.includes('sousse') || partLower.includes('سوسة')) {
          matchedGovernorate = 'Sousse';
        } else if (partLower.includes('sfax') || partLower.includes('صفاقس')) {
          matchedGovernorate = 'Sfax';
        }
        
        if (matchedGovernorate) {
          console.log('Matched governorate via manual mapping:', matchedGovernorate);
          break;
        }
      }
    }

    return {
      governorate: matchedGovernorate,
      delegation: matchedDelegation
    };
  };

  const handleConfirm = () => {
    if (tempLocation) {
      onLocationSelect(tempLocation);
    }
  };

  const handleCancel = () => {
    setTempLocation(null);
    if (marker && map) {
      map.removeLayer(marker);
      setMarker(null);
    }
  };

  return (
    <div className={`relative overflow-visible ${className}`}>
      {/* Map container */}
      <div className="relative h-full w-full">
        <div ref={mapRef} className="absolute inset-0 rounded-lg min-h-[400px]" />
        
        {/* Clean instruction at the top */}
        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur rounded-lg p-3 shadow-md" style={{ zIndex: 1001 }}>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span>Cliquez sur la carte pour placer le marqueur</span>
          </div>
        </div>

        {/* Location confirmation panel - overlay positioned at bottom */}
        {tempLocation && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" style={{ zIndex: 1002 }}>
            <div className="bg-white/95 backdrop-blur rounded-lg p-3 shadow-xl border border-gray-200 max-w-md mx-auto pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm">Position sélectionnée</h4>
                  {isLoading ? (
                    <p className="text-xs text-gray-500 animate-pulse">Recherche de l'adresse...</p>
                  ) : (
                    <p className="text-xs text-gray-600 truncate">{tempLocation.address || `${tempLocation.lat.toFixed(4)}, ${tempLocation.lng.toFixed(4)}`}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleConfirm}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
                    disabled={isLoading}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Confirmer
                  </Button>
                  <Button 
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}