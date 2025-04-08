declare module 'react-leaflet' {
  import { FC, ReactNode, RefObject } from 'react';
  import {
    Map as LeafletMap,
    MapOptions,
    LatLngExpression,
    MarkerOptions,
    Marker as LeafletMarker,
    PopupOptions,
    TileLayerOptions,
    LeafletEventHandlerFnMap,
    LeafletMouseEvent,
    TileLayer as LeafletTileLayer
  } from 'leaflet';

  export interface MapContainerProps extends MapOptions {
    center: LatLngExpression;
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
    ref?: RefObject<LeafletMap>;
    whenCreated?: (map: LeafletMap) => void;
  }

  export interface TileLayerProps extends TileLayerOptions {
    url: string;
    attribution?: string;
    children?: ReactNode;
  }

  export interface MarkerProps extends MarkerOptions {
    position: LatLngExpression;
    children?: ReactNode;
  }

  export interface PopupProps extends PopupOptions {
    children?: ReactNode;
  }

  export interface MapEventsProps {
    onClick?: (e: LeafletMouseEvent) => void;
    onZoom?: () => void;
    onMove?: () => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
  }

  export const MapContainer: FC<MapContainerProps>;
  export const TileLayer: FC<TileLayerProps>;
  export const Marker: FC<MarkerProps>;
  export const Popup: FC<PopupProps>;
  
  export function useMapEvents(events: LeafletEventHandlerFnMap): LeafletMap;
}
