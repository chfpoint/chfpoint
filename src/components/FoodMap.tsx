import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import { LatLng } from '../types';

interface FoodMapProps {
  riderLocation?: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  restaurantLocation?: { lat: number; lng: number } | null;
  pathHistory?: LatLng[];
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function FoodMap({
  riderLocation,
  customerLocation = { lat: 23.7561, lng: 90.3758 }, // Default clean Dhaka coordinates
  restaurantLocation = { lat: 23.7941, lng: 90.4042 }, // Banani restaurant hub
  pathHistory = [],
  interactive = false,
  onLocationSelect
}: FoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    const mapObj = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([customerLocation?.lat || 23.7561, customerLocation?.lng || 90.3758], 14);

    mapRef.current = mapObj;

    // Load standard highly reliable OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapObj);

    // Create gorgeous CSS/Tailwind-based SVG markers to bypass standard Leaflet PNG path errors!
    const restIcon = L.divIcon({
      className: '',
      html: `
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-black border-2 border-white shadow-lg text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M30 7v3a3 3 0 0 1-6 0v-3"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const custIcon = L.divIcon({
      className: '',
      html: `
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary border-2 border-white shadow-lg text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Add customer & restaurant markers
    if (customerLocation) {
      L.marker([customerLocation.lat, customerLocation.lng], { icon: custIcon })
        .addTo(mapObj)
        .bindPopup('<b class="font-sans font-medium text-brand-primary">Your Delivery Address</b>')
        .openPopup();
    }

    if (restaurantLocation) {
      L.marker([restaurantLocation.lat, restaurantLocation.lng], { icon: restIcon })
        .addTo(mapObj)
        .bindPopup('<b class="font-sans font-medium">Panda Kitchen</b>');
    }

    // Add select location click handler if interactive
    if (interactive && onLocationSelect) {
      mapObj.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
        
        // Temporarily put a blue circle to confirm selection
        const circle = L.circle([lat, lng], {
          radius: 40,
          color: '#d70f64',
          fillColor: '#ff2b85',
          fillOpacity: 0.5
        }).addTo(mapObj);
        setTimeout(() => mapObj.removeLayer(circle), 1000);
      });
    }

    // Add path history polyline if initialized
    if (pathHistory.length > 0) {
      const latlngs = pathHistory.map(pt => [pt.lat, pt.lng] as [number, number]);
      const pathLine = L.polyline(latlngs, {
        color: '#ff2b85',
        weight: 4,
        dashArray: '5, 8',
        opacity: 0.8
      }).addTo(mapObj);
      polylineRef.current = pathLine;
    }

    // Add rider location marker if available
    if (riderLocation) {
      const riderIcon = L.divIcon({
        className: '',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <span class="absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 animate-ping"></span>
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-green-500 border-2 border-white shadow-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const rMarker = L.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon })
        .addTo(mapObj)
        .bindPopup('<b class="font-sans font-medium text-green-600">Rider Is On The Way!</b>')
        .openPopup();

      riderMarkerRef.current = rMarker;
    }

    // Adjust map viewport bounds containing all markers
    const groupPoints: L.LatLngExpression[] = [];
    if (customerLocation) groupPoints.push([customerLocation.lat, customerLocation.lng]);
    if (restaurantLocation) groupPoints.push([restaurantLocation.lat, restaurantLocation.lng]);
    if (riderLocation) groupPoints.push([riderLocation.lat, riderLocation.lng]);
    
    if (groupPoints.length > 1) {
      mapObj.fitBounds(L.latLngBounds(groupPoints), { padding: [50, 50] });
    }

    return () => {
      mapObj.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Rider location dynamically when it changes without reloading map!
  useEffect(() => {
    if (!mapRef.current) return;

    const mapObj = mapRef.current;

    if (riderLocation) {
      const riderCoords: L.LatLngExpression = [riderLocation.lat, riderLocation.lng];

      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng(riderCoords);
      } else {
        const riderIcon = L.divIcon({
          className: '',
          html: `
            <div class="relative flex items-center justify-center w-12 h-12">
              <span class="absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 animate-ping"></span>
              <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-green-500 border-2 border-white shadow-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
              </div>
            </div>
          `,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const rMarker = L.marker(riderCoords, { icon: riderIcon })
          .addTo(mapObj)
          .bindPopup('<b class="font-sans font-medium text-green-600">Rider Location Updated</b>')
          .openPopup();

        riderMarkerRef.current = rMarker;
      }

      // Append new path line update
      if (pathHistory.length > 0) {
        const latlngs = pathHistory.map(pt => [pt.lat, pt.lng] as [number, number]);
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latlngs);
        } else {
          const pathLine = L.polyline(latlngs, {
            color: '#ff2b85',
            weight: 4,
            dashArray: '5, 8',
            opacity: 0.8
          }).addTo(mapObj);
          polylineRef.current = pathLine;
        }
      }

      // Smoothly pan to rider location
      mapObj.panTo(riderCoords);
    } else {
      if (riderMarkerRef.current) {
        mapObj.removeLayer(riderMarkerRef.current);
        riderMarkerRef.current = null;
      }
    }
  }, [riderLocation, pathHistory]);

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-10" />
      {interactive && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 px-3 py-1.5 rounded-lg z-20 text-xs text-brand-primary font-medium flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
          Click map to pin custom delivery location
        </div>
      )}
    </div>
  );
}
