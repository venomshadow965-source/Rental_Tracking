import React, { useEffect, useRef, useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Sparkles,
  Compass,
  Info
} from 'lucide-react';

export default function InteractiveMapPicker({
  latitude,
  longitude,
  onLocationChange,
  propertyName = 'Property',
  height = '380px',
  showNudgeControls = true
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [mapType, setMapType] = useState('street'); // 'street' or 'satellite'
  const [stepSize, setStepSize] = useState(0.0001); // 0.0001 ≈ 11 meters
  const [isLeafletReady, setIsLeafletReady] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Nudge helper
  const handleNudge = (direction) => {
    let newLat = Number(latitude);
    let newLng = Number(longitude);

    if (direction === 'north') newLat += stepSize;
    if (direction === 'south') newLat -= stepSize;
    if (direction === 'east') newLng += stepSize;
    if (direction === 'west') newLng -= stepSize;

    newLat = Number(newLat.toFixed(6));
    newLng = Number(newLng.toFixed(6));

    const meters = Math.round(stepSize * 111000);
    setFeedback(`Nudged ${direction.toUpperCase()} by ~${meters}m`);
    setTimeout(() => setFeedback(''), 2500);

    onLocationChange({ lat: newLat, lng: newLng });
  };

  // Initialize or update Leaflet Map
  useEffect(() => {
    let checkInterval = null;

    const initMap = () => {
      if (!window.L || !containerRef.current) return false;

      // Clean up previous instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = window.L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 16,
        scrollWheelZoom: true,
        attributionControl: false
      });

      // Custom high-contrast SVG pin icon
      const pinIcon = window.L.divIcon({
        className: 'custom-draggable-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; transform: translate(-50%, -100%);">
            <div style="background: #e11d48; color: white; border: 2.5px solid white; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.45);">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #e11d48; margin-top: -1px;"></div>
            <div style="width: 14px; height: 5px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px); margin-top: 1px;"></div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [0, 0]
      });

      // Add Tile Layer
      const tileUrl = mapType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      tileLayerRef.current = window.L.tileLayer(tileUrl, {
        maxZoom: 19
      }).addTo(map);

      // Add Draggable Marker
      const marker = window.L.marker([latitude, longitude], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      marker.bindTooltip('📍 Click or Drag to Move Marker', {
        permanent: false,
        direction: 'top',
        offset: [0, -38]
      });

      // Handle marker dragend
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        const newLat = Number(pos.lat.toFixed(6));
        const newLng = Number(pos.lng.toFixed(6));
        setFeedback(`Marker placed at ${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`);
        setTimeout(() => setFeedback(''), 3000);
        onLocationChange({ lat: newLat, lng: newLng });
      });

      // Handle map click to reposition marker
      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));
        setFeedback(`Marker snapped to ${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E`);
        setTimeout(() => setFeedback(''), 3000);
        onLocationChange({ lat: newLat, lng: newLng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      setIsLeafletReady(true);
      return true;
    };

    if (!initMap()) {
      checkInterval = setInterval(() => {
        if (initMap()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync external coordinate changes with Leaflet marker
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const cur = markerRef.current.getLatLng();
      if (Math.abs(cur.lat - latitude) > 0.000001 || Math.abs(cur.lng - longitude) > 0.000001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  // Handle Layer change (Street vs Satellite)
  const handleChangeLayer = (newType) => {
    setMapType(newType);
    if (mapRef.current && tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      const newTileUrl = newType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileLayerRef.current = window.L.tileLayer(newTileUrl, { maxZoom: 19 }).addTo(mapRef.current);
    }
  };

  return (
    <div className="space-y-3">
      {/* Map Header & Layer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
            <Crosshair className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
              <span>Interactive Marker Placement</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                Click or Drag Pin
              </span>
            </span>
            <p className="text-[11px] text-slate-500 font-mono">
              Live Pin: <strong>{Number(latitude).toFixed(6)}° N, {Number(longitude).toFixed(6)}° E</strong>
            </p>
          </div>
        </div>

        {/* Layer Switcher */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => handleChangeLayer('street')}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
              mapType === 'street' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Street Map
          </button>
          <button
            type="button"
            onClick={() => handleChangeLayer('satellite')}
            className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
              mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satellite View
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100" style={{ height }}>
        {/* Leaflet Mount Container */}
        <div ref={containerRef} className="w-full h-full z-10" />

        {/* Fallback & Loading Overlay if Leaflet CDN is delayed */}
        {!isLeafletReady && (
          <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
            <Crosshair className="w-8 h-8 text-rose-600 animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-700">Loading Interactive Draggable Map...</p>
            <p className="text-[11px] text-slate-500">You can also use the precision nudge arrows below to move the marker.</p>
          </div>
        )}

        {/* Floating Instruction Tag */}
        <div className="absolute top-2.5 left-2.5 z-20 bg-white/95 backdrop-blur border border-slate-200 shadow-md rounded-xl px-2.5 py-1.5 text-[11px] flex items-center space-x-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          <span className="font-semibold text-slate-800">
            Click map or drag the red pin to set exact property spot
          </span>
        </div>

        {/* Toast Feedback */}
        {feedback && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-white text-xs font-mono px-3 py-1.5 rounded-full shadow-lg border border-slate-700 animate-in fade-in duration-150">
            {feedback}
          </div>
        )}
      </div>

      {/* Precision Micro-Nudge D-Pad Controls */}
      {showNudgeControls && (
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Precision Nudge Controls (Meter-Level Alignment)</span>
            </span>

            {/* Step Size Selector */}
            <div className="flex items-center space-x-1 text-[11px]">
              <span className="text-slate-400 mr-1">Step:</span>
              <button
                type="button"
                onClick={() => setStepSize(0.0001)}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                  stepSize === 0.0001 ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                }`}
                title="10 meters (Fine - Rooftop/Gate)"
              >
                10m (Fine)
              </button>
              <button
                type="button"
                onClick={() => setStepSize(0.0005)}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                  stepSize === 0.0005 ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                }`}
                title="50 meters (Medium - Street/Crossroad)"
              >
                50m (Medium)
              </button>
              <button
                type="button"
                onClick={() => setStepSize(0.002)}
                className={`px-2 py-0.5 rounded font-mono font-bold transition-colors ${
                  stepSize === 0.002 ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                }`}
                title="200 meters (Coarse - Block/Layout)"
              >
                200m (Coarse)
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-500 max-w-sm">
              Use the directional arrows to fine-tune the pin placement directly over the property's building gate, parking entrance, or rooftop.
            </div>

            {/* D-Pad Buttons */}
            <div className="inline-grid grid-cols-3 gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
              <div />
              <button
                type="button"
                onClick={() => handleNudge('north')}
                className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg flex items-center justify-center transition-colors"
                title="Nudge North (Up)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div />

              <button
                type="button"
                onClick={() => handleNudge('west')}
                className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg flex items-center justify-center transition-colors"
                title="Nudge West (Left)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.setView([latitude, longitude], 17);
                  }
                }}
                className="p-2 bg-emerald-100 text-emerald-800 rounded-lg flex items-center justify-center font-bold text-[10px]"
                title="Center view on marker"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => handleNudge('east')}
                className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg flex items-center justify-center transition-colors"
                title="Nudge East (Right)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              <div />
              <button
                type="button"
                onClick={() => handleNudge('south')}
                className="p-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg flex items-center justify-center transition-colors"
                title="Nudge South (Down)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <div />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
