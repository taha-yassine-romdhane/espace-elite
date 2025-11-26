import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  devices?: Device[];
  hasDevices?: boolean;
  diagnostics?: DiagnosticDevice[];
  hasDiagnostics?: boolean;
}

interface CompanySettings {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLatitude?: number | null;
  companyLongitude?: number | null;
}

interface MapProps {
  patients: Patient[];
  companySettings?: CompanySettings;
}

// Memoized helper functions outside component
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || '?';
};

const getDaysSinceVisit = (lastVisit: string | null | undefined): number => {
  if (!lastVisit) return -1;
  try {
    const lastVisitDate = new Date(lastVisit.split('/').reverse().join('-'));
    return Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
};

const getMarkerColor = (patient: Patient): string => {
  const days = getDaysSinceVisit(patient.lastVisit);

  if (patient.hasDiagnostics) {
    if (days < 0) return '#F59E0B';
    if (days < 30) return '#D97706';
    if (days < 90) return '#B45309';
    return '#92400E';
  }

  if (patient.hasDevices) {
    if (days < 0) return '#8B5CF6';
    if (days < 30) return '#059669';
    if (days < 90) return '#D97706';
    return '#DC2626';
  }

  if (days < 0) return '#6B7280';
  if (days < 30) return '#10B981';
  if (days < 90) return '#F59E0B';
  return '#EF4444';
};

const getStatusBadge = (patient: Patient): { text: string; bg: string; color: string } => {
  const days = getDaysSinceVisit(patient.lastVisit);

  if (patient.hasDiagnostics) {
    return { text: 'Diagnostic', bg: '#FEF3C7', color: '#92400E' };
  }
  if (patient.hasDevices) {
    return { text: 'Équipement', bg: '#EDE9FE', color: '#6D28D9' };
  }
  if (days < 0) return { text: 'Nouveau', bg: '#F3F4F6', color: '#374151' };
  if (days < 30) return { text: 'Récent', bg: '#D1FAE5', color: '#065F46' };
  if (days < 90) return { text: 'Modéré', bg: '#FEF3C7', color: '#92400E' };
  return { text: 'Ancien', bg: '#FEE2E2', color: '#991B1B' };
};

// Compact popup content generator
const createPopupContent = (patient: Patient): string => {
  const status = getStatusBadge(patient);
  const deviceCount = patient.devices?.length || 0;
  const diagCount = patient.diagnostics?.length || 0;

  return `
    <div style="width:320px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:12px;border-radius:8px 8px 0 0;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">
            ${getInitials(patient.name)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${patient.name}</div>
            <div style="font-size:11px;opacity:0.9;">${patient.region} • ${patient.delegation}</div>
          </div>
          <span style="padding:3px 8px;border-radius:12px;font-size:10px;font-weight:600;background:${status.bg};color:${status.color};">${status.text}</span>
        </div>
      </div>

      <!-- Quick Info Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#f8fafc;">
        <!-- Phone -->
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          <span style="color:#1e40af;font-weight:500;">${patient.phone || '-'}</span>
        </div>

        <!-- CIN -->
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/></svg>
          <span style="color:#374151;">${patient.cin || '-'}</span>
        </div>

        <!-- Last Visit -->
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style="color:#374151;">${patient.lastVisit || 'Aucune'}</span>
        </div>

        <!-- Technician -->
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span style="color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${patient.technician || '-'}</span>
        </div>
      </div>

      <!-- Devices & Diagnostics Summary -->
      ${(deviceCount > 0 || diagCount > 0) ? `
        <div style="display:flex;gap:8px;padding:0 12px 12px;background:#f8fafc;">
          ${deviceCount > 0 ? `
            <div style="flex:1;padding:8px;background:#ede9fe;border-radius:6px;border-left:3px solid #8b5cf6;">
              <div style="font-weight:600;color:#6d28d9;font-size:12px;margin-bottom:4px;">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="12" rx="2"/></svg>
                  ${deviceCount} Équipement${deviceCount > 1 ? 's' : ''}
                </span>
              </div>
              <div style="font-size:11px;color:#7c3aed;">
                ${patient.devices?.slice(0, 2).map(d => `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">• ${d.name}</div>`).join('') || ''}
                ${deviceCount > 2 ? `<div style="color:#a78bfa;">+${deviceCount - 2} autres</div>` : ''}
              </div>
            </div>
          ` : ''}
          ${diagCount > 0 ? `
            <div style="flex:1;padding:8px;background:#fef3c7;border-radius:6px;border-left:3px solid #f59e0b;">
              <div style="font-weight:600;color:#92400e;font-size:12px;margin-bottom:4px;">
                <span style="display:inline-flex;align-items:center;gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  ${diagCount} Diagnostic${diagCount > 1 ? 's' : ''}
                </span>
              </div>
              <div style="font-size:11px;color:#b45309;">
                ${patient.diagnostics?.slice(0, 2).map(d => `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">• ${d.deviceName}</div>`).join('') || ''}
                ${diagCount > 2 ? `<div style="color:#d97706;">+${diagCount - 2} autres</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Address -->
      ${patient.address && patient.address !== 'Adresse non spécifiée' ? `
        <div style="padding:8px 12px;background:#fff;border-top:1px solid #e2e8f0;">
          <div style="display:flex;align-items:flex-start;gap:6px;color:#64748b;font-size:11px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;margin-top:2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style="line-height:1.4;">${patient.address}</span>
          </div>
        </div>
      ` : ''}

      <!-- Action Button -->
      <div style="padding:10px 12px;background:#fff;border-top:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
        <a href="/roles/admin/renseignement/patient/${patient.id}"
           style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;border-radius:6px;text-decoration:none;font-weight:500;font-size:12px;transition:opacity 0.2s;"
           onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Voir le profil complet
        </a>
      </div>
    </div>
  `;
};

const MapComponent: React.FC<MapProps> = ({ patients, companySettings }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerCacheRef = useRef<Map<string, L.Marker>>(new Map());

  // Memoize patient data for faster lookup
  const patientMap = useMemo(() => {
    const map = new Map<string, Patient>();
    patients.forEach(p => map.set(p.id, p));
    return map;
  }, [patients]);

  // Get marker size config based on zoom
  const getMarkerConfig = useCallback((zoom: number) => {
    if (zoom <= 6) return { size: 10, fontSize: '0px', showInitials: false };
    if (zoom <= 8) return { size: 14, fontSize: '0px', showInitials: false };
    if (zoom <= 10) return { size: 18, fontSize: '9px', showInitials: true };
    if (zoom <= 12) return { size: 24, fontSize: '10px', showInitials: true };
    return { size: 30, fontSize: '11px', showInitials: true };
  }, []);

  // Create marker icon
  const createMarkerIcon = useCallback((patient: Patient, config: ReturnType<typeof getMarkerConfig>) => {
    const initials = getInitials(patient.name);
    const color = getMarkerColor(patient);
    const borderColor = patient.hasDiagnostics ? '#F59E0B' : patient.hasDevices ? '#7c3aed' : 'white';
    const borderWidth = Math.max(2, config.size * 0.1);

    return L.divIcon({
      html: `
        <div style="
          width:${config.size}px;
          height:${config.size}px;
          background:${color};
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#fff;
          font-weight:700;
          font-size:${config.fontSize};
          font-family:system-ui,sans-serif;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
          border:${borderWidth}px solid ${borderColor};
          cursor:pointer;
          transition:transform 0.15s ease;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${config.showInitials ? initials : ''}
        </div>
      `,
      className: 'patient-marker',
      iconSize: [config.size, config.size],
      iconAnchor: [config.size / 2, config.size / 2],
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true, // Better performance for many markers
    }).setView([33.8869, 9.5375], 7);

    // Tile layers
    const baseLayers = {
      'Street (Détaillé)': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }),
      'Street (Propre)': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19
      }),
      'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri',
        maxZoom: 19
      }),
    };

    baseLayers['Street (Détaillé)'].addTo(map);

    // Controls
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.control.layers(baseLayers, undefined, { position: 'topright', collapsed: true }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    // Markers layer group for efficient management
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Company HQ marker (only show if coordinates are set)
    const hqLat = companySettings?.companyLatitude;
    const hqLng = companySettings?.companyLongitude;
    const hqName = companySettings?.companyName || 'Siège';
    const hqAddress = companySettings?.companyAddress || '';

    if (hqLat && hqLng) {
      const companyIcon = L.divIcon({
        html: `
          <div style="
            width:44px;height:44px;background:#1e3a8a;border-radius:8px;
            display:flex;align-items:center;justify-content:center;color:#fff;
            box-shadow:0 4px 12px rgba(0,0,0,0.4);border:3px solid #fff;
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21h18M4 21V7l8-4v18M20 21V11l-8-4"/>
            </svg>
          </div>
        `,
        className: 'company-hq',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      L.marker([hqLat, hqLng], { icon: companyIcon })
        .bindPopup(`
          <div style="padding:12px;font-family:system-ui,sans-serif;">
            <h3 style="font-weight:700;font-size:15px;color:#1e3a8a;margin:0 0 8px;">${hqName}</h3>
            <p style="margin:0;font-size:12px;color:#64748b;">${hqAddress.replace(/\n/g, '<br/>')}</p>
          </div>
        `)
        .addTo(map);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      markerCacheRef.current.clear();
    };
  }, []);

  // Update markers when patients change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    const config = getMarkerConfig(map.getZoom());

    // Clear existing patient markers
    markersLayer.clearLayers();
    markerCacheRef.current.clear();

    // Batch add markers for better performance
    const markers: L.Marker[] = [];

    patients.forEach(patient => {
      if (!patient.latitude || !patient.longitude) return;

      const icon = createMarkerIcon(patient, config);
      const marker = L.marker([patient.latitude, patient.longitude], { icon });

      // Lazy load popup content on first open
      marker.bindPopup(() => createPopupContent(patient), {
        maxWidth: 340,
        className: 'patient-popup',
      });

      markers.push(marker);
      markerCacheRef.current.set(patient.id, marker);
    });

    // Add all markers at once
    markers.forEach(m => markersLayer.addLayer(m));

    // Handle zoom changes - update marker sizes
    const handleZoom = () => {
      const newConfig = getMarkerConfig(map.getZoom());

      markersLayer.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const latlng = layer.getLatLng();
          const patient = patients.find(p =>
            Math.abs(p.latitude - latlng.lat) < 0.0001 &&
            Math.abs(p.longitude - latlng.lng) < 0.0001
          );

          if (patient) {
            layer.setIcon(createMarkerIcon(patient, newConfig));
          }
        }
      });
    };

    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [patients, getMarkerConfig, createMarkerIcon]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default MapComponent;
