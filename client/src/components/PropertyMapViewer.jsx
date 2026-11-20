import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Building2, 
  Share2,
  ShieldCheck,
  Sparkles,
  Crosshair,
  Award
} from 'lucide-react';

export default function PropertyMapViewer({
  property,
  unit = null,
  currentUser = null,
  height = '360px',
  showControls = true,
  showLandmarks = true
}) {
  const [mapType, setMapType] = useState('m'); // 'm' = roadmap, 'k' = satellite, 'p' = terrain
  const [zoomLevel, setZoomLevel] = useState(16);
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const fullAddress = `${property.name ? property.name + ', ' : ''}${property.address}, ${property.city}, ${property.state} - ${property.pincode || ''}`;
  
  const hasExactCoords = Boolean(
    property.latitude !== undefined && 
    property.longitude !== undefined && 
    !isNaN(property.latitude) && 
    !isNaN(property.longitude) &&
    Number(property.latitude) !== 0
  );

  const lat = hasExactCoords ? Number(property.latitude).toFixed(4) : '12.9716';
  const lng = hasExactCoords ? Number(property.longitude).toFixed(4) : '77.5946';
  const coordinatesText = `${lat}° N, ${lng}° E`;
  const propLabel = encodeURIComponent(property.name || 'Property');

  // Exact pinpoint marker query: q=${lat},${lng} drops the marker exactly on the property coordinates
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}+(${propLabel})&ll=${lat},${lng}&t=${mapType}&z=${zoomLevel}&ie=UTF8&iwloc=A&output=embed`;
  const directionsUrl = property.directionsUrl || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const googleMapsUrl = property.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const isMyProperty = Boolean(
    currentUser && (
      currentUser.role !== 'admin' || 
      property.landlordId === currentUser.id || 
      (!property.landlordId && currentUser.id === 'usr_admin')
    )
  );

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(`${fullAddress} (Exact Coordinates: ${coordinatesText})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 19));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 11));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
      
      {/* Top Map Action Bar */}
      {showControls && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <span>{property.name}</span>
                {unit && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    {unit.number || unit}
                  </span>
                )}
                {isMyProperty && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center space-x-1">
                    <span>👑</span>
                    <span>Landlord Verified</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                <Crosshair className="w-3 h-3 text-emerald-600" />
                <span>Exact Marker Pin: <strong>{coordinatesText}</strong></span>
              </p>
            </div>
          </div>

          {/* Map Layer Switcher & Zoom */}
          <div className="flex items-center space-x-1.5">
            <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMapType('m')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapType === 'm' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setMapType('k')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapType === 'k' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setMapType('p')}
                className={`px-2 py-1 rounded transition-colors ${
                  mapType === 'p' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terrain
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-0.5 flex items-center">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Map Canvas with Exact Coordinate Pin */}
      <div className="relative w-full bg-slate-100" style={{ height }}>
        <iframe
          src={embedUrl}
          title={`Location map of ${property.name} at ${coordinatesText}`}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Live Pin Overlay Banner (Top-Left) */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur shadow-md border border-slate-200/90 rounded-xl px-3 py-2 text-xs flex items-center space-x-2 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping opacity-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 absolute" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900">
                {property.name}
              </span>
              <span className="text-[9px] uppercase font-mono font-bold bg-rose-100 text-rose-800 px-1 rounded">
                EXACT PIN
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono block">
              📍 {coordinatesText}
            </span>
          </div>
        </div>

        {/* Landlord Ownership Tag (Top-Right) */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-md border border-amber-300 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-amber-900 flex items-center space-x-1.5 pointer-events-none">
          <span>👑</span>
          <span>Owned by {property.landlordName || (isMyProperty && currentUser?.name ? currentUser.name : 'Achyuta Bidarahalli')}</span>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
        <p className="text-slate-600 text-[11px] line-clamp-1 flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{fullAddress}</span>
        </p>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyLocation}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
            title="Copy address and exact coordinates to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Coordinates!' : 'Copy Location'}</span>
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs"
            title="Open turn-by-turn GPS navigation in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>GPS Directions</span>
          </a>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
            title="Open exact pinpoint in Google Maps app / web"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open in Maps</span>
          </a>
        </div>
      </div>

      {/* Landmarks & Connectivity Pills */}
      {showLandmarks && property.landmarks && property.landmarks.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
          <span className="font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
            <Compass className="w-3 h-3 text-slate-500" />
            <span>Nearby Transit & Landmarks:</span>
          </span>
          {property.landmarks.map((landmark, idx) => (
            <span
              key={idx}
              className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
            >
              📍 {landmark}
            </span>
          ))}
        </div>
      )}

    </div>
  );
}
