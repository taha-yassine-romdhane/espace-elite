import React, { useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';

// Component to handle map events
function MapEvents({ onMapClick }: { onMapClick: (e: any) => void }) {
  useMapEvents({
    click: onMapClick,
  });
  return null;
}

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  address: string;
  onMapClick: (e: any) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, zoom, address, onMapClick }) => {
  const mapRef = useRef<LeafletMap>(null);
  
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      whenCreated={(map: any) => { 
        if (mapRef.current) {
          mapRef.current = map;
        }
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        <Popup>
          {address}
        </Popup>
      </Marker>
      <MapEvents onMapClick={onMapClick} />
    </MapContainer>
  );
};

export default MapComponent;
