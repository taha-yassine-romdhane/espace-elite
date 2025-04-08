import React, { useEffect, useRef } from 'react';
// Import these components directly to avoid SSR issues
import dynamic from 'next/dynamic';

// Import Leaflet directly only on client side
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
}

// Fix Leaflet icon issues
const fixLeafletIcon = () => {
  // Only run on client-side
  if (typeof window === 'undefined') return;

  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconUrl: '/images/marker-icon.png',
    iconRetinaUrl: '/images/marker-icon.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};



interface LeafletMapProps {
  center: [number, number];
  zoom: number;
  address: string;
  onMapClick: (e: any) => void;
}

// Create a dynamic Map component that loads only on client-side
const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  { ssr: false }
);

const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom, address, onMapClick }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fixLeafletIcon();
    }
  }, []);
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapWithNoSSR 
        center={center}
        zoom={zoom}
        address={address}
        onMapClick={onMapClick}
      />
    </div>
  );
};

export default LeafletMap;
