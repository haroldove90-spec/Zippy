
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair } from 'lucide-react';
import { MapEntity } from '../types';

interface MapVisualProps {
  status: string;
  customRoute?: [number, number][]; 
  userLocation?: [number, number]; 
  entities?: MapEntity[]; 
  routeStart?: [number, number]; // New prop for explicit route start
  routeEnd?: [number, number];   // New prop for explicit route end
}

const MapVisual: React.FC<MapVisualProps> = ({ status, customRoute, userLocation, entities, routeStart, routeEnd }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const entitiesLayerRef = useRef<L.LayerGroup | null>(null);
  const entityMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeMarkersRef = useRef<L.LayerGroup | null>(null);
  
  const hasCenteredRef = useRef(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);

  // --- INITIALIZE MAP ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
        const defaultLat = 19.5437; // Tlalnepantla Default
        const defaultLng = -99.1962;

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
        routeMarkersRef.current = L.layerGroup().addTo(map);
        
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
            const marker = L.marker([defaultLat, defaultLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
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

  // --- HANDLE LIVE ENTITIES ---
  useEffect(() => {
    const layer = entitiesLayerRef.current;
    if (!layer || (status !== 'live_map' && status !== 'IDLE')) {
        entityMarkersRef.current.forEach(m => m.remove());
        entityMarkersRef.current.clear();
        return;
    }
    if (!entities) return;

    const currentIds = new Set(entities.map(e => e.id));
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
                <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                    entity.type === 'driver' ? 'bg-zippy-dark text-zippy-main' : 'bg-zippy-main text-zippy-dark'
                }">
                    <span class="text-xs font-black">${entity.type === 'driver' ? '🚕' : '👤'}</span>
                </div>
            </div>
        `;
        const icon = L.divIcon({ className: 'live-entity-icon', html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 20] });

        if (existingMarker) {
            existingMarker.setLatLng([entity.lat, entity.lng]);
            existingMarker.setIcon(icon);
        } else {
            const marker = L.marker([entity.lat, entity.lng], { icon }).addTo(layer);
            entityMarkersRef.current.set(entity.id, marker);
        }
    });
  }, [entities, status]);

  // --- REAL ROUTING LOGIC (OSRM) ---
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Cleanup previous route
    if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
    }
    routeMarkersRef.current?.clearLayers();

    // Determine start/end points
    let start: [number, number] | undefined = routeStart;
    let end: [number, number] | undefined = routeEnd;

    // Smart defaults based on status if props are missing
    if (!start && !end && status !== 'IDLE') {
        // Fallback or custom logic if needed
    }

    if (start && end) {
        const fetchRoute = async () => {
            try {
                // OSRM Public API (Demo server)
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${start![1]},${start![0]};${end![1]},${end![0]}?overview=full&geometries=geojson`
                );
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]); // Swap to LatLng
                    
                    if (routeLineRef.current) routeLineRef.current.remove();
                    
                    routeLineRef.current = L.polyline(coordinates, {
                        color: '#003A70',
                        weight: 6,
                        opacity: 0.8,
                        lineCap: 'round',
                        lineJoin: 'round'
                    }).addTo(map);

                    // Add Start/End Markers
                    const startIcon = L.divIcon({ html: '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md"></div>', className: '' });
                    const endIcon = L.divIcon({ html: '<div class="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md"></div>', className: '' });

                    L.marker(start!, { icon: startIcon }).addTo(routeMarkersRef.current!);
                    L.marker(end!, { icon: endIcon }).addTo(routeMarkersRef.current!);

                    // Fit bounds with padding
                    map.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50] });
                }
            } catch (error) {
                console.error("Routing error:", error);
                // Fallback to straight line
                routeLineRef.current = L.polyline([start!, end!], { color: '#003A70', weight: 4, dashArray: '10, 10' }).addTo(map);
            }
        };

        fetchRoute();
    }

  }, [status, routeStart, routeEnd]);

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
