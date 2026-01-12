
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { MapEntity } from '../types';

interface MapVisualProps {
  status: string;
  customRoute?: [number, number][]; 
  userLocation?: [number, number]; 
  entities?: MapEntity[]; // Nuevas entidades para el mapa en vivo
}

const MapVisual: React.FC<MapVisualProps> = ({ status, customRoute, userLocation, entities }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const entitiesLayerRef = useRef<L.LayerGroup | null>(null);
  const entityMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  
  const hasCenteredRef = useRef(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  const MOCK_ROUTE: [number, number][] = [
    [19.4326, -99.1332],
    [19.4310, -99.1330],
    [19.4300, -99.1350],
    [19.4290, -99.1360],
    [19.4280, -99.1380],
    [19.4270, -99.1400], 
  ];

  // --- INITIALIZE MAP ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
        const defaultLat = 19.4326; 
        const defaultLng = -99.1332;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false, 
            attributionControl: false,
            zoomAnimation: true,
            zoom: 15
        }).setView([defaultLat, defaultLng], 15);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20,
            subdomains: 'abcd'
        }).addTo(map);

        mapInstanceRef.current = map;
        entitiesLayerRef.current = L.layerGroup().addTo(map);
        
        if (!status.startsWith('ADMIN')) {
            const userIcon = L.divIcon({
                className: 'custom-user-icon',
                html: `
                  <div class="relative w-6 h-6">
                    <span class="absolute inline-flex h-full w-full rounded-full bg-zippy-accent opacity-75 animate-ping"></span>
                    <div class="relative w-6 h-6 bg-zippy-dark rounded-full border-2 border-zippy-accent flex items-center justify-center shadow-lg">
                       <div class="w-2 h-2 bg-zippy-accent rounded-full"></div>
                    </div>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            const marker = L.marker([defaultLat, defaultLng], { icon: userIcon }).addTo(map);
            userMarkerRef.current = marker;
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }
    
    const resizeObserver = new ResizeObserver(() => {
        mapInstanceRef.current?.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
        resizeObserver.disconnect();
    };
  }, []);

  // --- HANDLE GEOLOCATION ---
  useEffect(() => {
      if (userLocation) {
          setUserPos(userLocation);
          updateMapPosition(userLocation[0], userLocation[1]);
          return;
      }

      if ('geolocation' in navigator && !status.startsWith('ADMIN') && !userLocation) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserPos([latitude, longitude]);
                updateMapPosition(latitude, longitude);
            },
            (error) => {},
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [status, userLocation]);

  const updateMapPosition = (lat: number, lng: number) => {
      if (mapInstanceRef.current && userMarkerRef.current) {
          const newLatLng = new L.LatLng(lat, lng);
          userMarkerRef.current.setLatLng(newLatLng);
          if (!hasCenteredRef.current) {
              mapInstanceRef.current.setView(newLatLng, 16);
              hasCenteredRef.current = true;
          }
      }
  };

  // --- HANDLE LIVE ENTITIES (ADMIN) ---
  useEffect(() => {
    const layer = entitiesLayerRef.current;
    if (!layer || status !== 'live_map') {
        entityMarkersRef.current.forEach(m => m.remove());
        entityMarkersRef.current.clear();
        return;
    }

    if (!entities) return;

    // Actualizar marcadores existentes o crear nuevos
    const currentIds = new Set(entities.map(e => e.id));
    
    // Eliminar los que ya no están
    entityMarkersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
            marker.remove();
            entityMarkersRef.current.delete(id);
        }
    });

    entities.forEach(entity => {
        const existingMarker = entityMarkersRef.current.get(entity.id);
        const iconHtml = `
            <div class="relative group">
                <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-zippy-dark text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                    ${entity.label}
                </div>
                <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                    entity.type === 'driver' ? 'bg-zippy-dark text-zippy-main' : 
                    entity.type === 'passenger' ? 'bg-zippy-main text-zippy-dark' : 'bg-orange-500 text-white'
                }">
                    <span class="text-xs font-black">${entity.type === 'driver' ? '🚕' : entity.type === 'passenger' ? '👤' : '🛠️'}</span>
                </div>
                ${entity.status === 'online' ? '<span class="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>' : ''}
            </div>
        `;

        const icon = L.divIcon({
            className: 'live-entity-icon',
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        if (existingMarker) {
            existingMarker.setLatLng([entity.lat, entity.lng]);
            existingMarker.setIcon(icon);
        } else {
            const marker = L.marker([entity.lat, entity.lng], { icon }).addTo(layer);
            entityMarkersRef.current.set(entity.id, marker);
        }
    });

  }, [entities, status]);

  // --- EFFECT: LAYERS & ROUTES ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
    }
    if (heatLayerRef.current) {
        heatLayerRef.current.remove();
        heatLayerRef.current = null;
    }

    if (status === 'ADMIN_HEATMAP') {
        const heatGroup = L.layerGroup().addTo(map);
        const center = [19.4326, -99.1332];
        for (let i = 0; i < 50; i++) {
            const lat = center[0] + (Math.random() - 0.5) * 0.04;
            const lng = center[1] + (Math.random() - 0.5) * 0.04;
            const intensity = Math.random();
            const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#eab308' : '#22c55e';
            
            L.circle([lat, lng], {
                color: 'transparent',
                fillColor: color,
                fillOpacity: 0.4,
                radius: 300 * intensity
            }).addTo(heatGroup);
        }
        heatLayerRef.current = heatGroup;
        map.setView([19.4326, -99.1332], 13);
    }

    const activeStates = ['ACCEPTED', 'IN_PROGRESS', 'ARRIVED'];
    const routeToDraw = customRoute || (activeStates.includes(status) ? MOCK_ROUTE : null);

    if (routeToDraw) {
        const polyline = L.polyline(routeToDraw, {
            color: '#003A70', 
            weight: 5,
            opacity: 0.8,
            lineCap: 'round'
        }).addTo(map);
        
        if (customRoute) {
            L.circleMarker(customRoute[0], { radius: 6, color: 'green', fillOpacity: 1 }).addTo(map);
            L.circleMarker(customRoute[customRoute.length-1], { radius: 6, color: 'red', fillOpacity: 1 }).addTo(map);
        }

        routeLineRef.current = polyline;
        map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

  }, [status, customRoute]);

  const handleCenterMap = () => {
    if (mapInstanceRef.current && userPos) {
        mapInstanceRef.current.flyTo(userPos, 16);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0">
        <div ref={mapContainerRef} className="w-full h-full bg-gray-200" />
        
        {!status.startsWith('ADMIN') && status !== 'live_map' && (
            <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[var(--zippy-main)] to-transparent opacity-80 pointer-events-none z-[400]"></div>
        )}
        
        {!status.startsWith('ADMIN') && status !== 'live_map' && (
            <button 
                onClick={handleCenterMap}
                className="absolute right-4 bottom-1/2 translate-y-16 z-[400] p-3 bg-white text-zippy-dark rounded-full shadow-xl border border-gray-200 active:scale-95 transition-transform hover:bg-gray-50"
            >
                <Crosshair className="w-6 h-6 text-zippy-dark" />
            </button>
        )}
    </div>
  );
};

export default MapVisual;
