import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Crosshair, 
  Navigation, 
  Search, 
  Check, 
  RotateCcw, 
  Building2, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import InteractiveMapPicker from './InteractiveMapPicker';
import PropertyMapViewer from './PropertyMapViewer';
import { geocodeAddress, getBrowserGeolocation } from '../services/geocoding';

export default function EditLocationModal({ property, onClose, onSave }) {
  if (!property) return null;

  // Initial values
  const initialLat = Number(property.latitude) || 12.9716;
  const initialLng = Number(property.longitude) || 77.5946;

  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [address, setAddress] = useState(property.address || '');
  const [city, setCity] = useState(property.city || 'Bengaluru');
  const [state, setState] = useState(property.state || 'Karnataka');
  const [pincode, setPincode] = useState(property.pincode || '560064');
  const [activeTab, setActiveTab] = useState('interactive'); // 'interactive' or 'preview'
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  // Handle marker movement from interactive map or D-Pad
  const handleLocationChange = ({ lat, lng }) => {
    setLatitude(lat);
    setLongitude(lng);
    setError('');
  };

  // Auto-geocode based on address input
  const handleAutoGeocode = () => {
    if (!address.trim() && !pincode.trim()) {
      setError('Please provide an Address or PIN code to geocode.');
      return;
    }

    const geo = geocodeAddress({ address, city, pincode, state });
    setLatitude(Number(geo.latitude.toFixed(6)));
    setLongitude(Number(geo.longitude.toFixed(6)));
    setStatusMsg(`📍 Marker placed via ${geo.matchedBy} (${geo.latitude.toFixed(4)}° N, ${geo.longitude.toFixed(4)}° E)`);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  // Device GPS Geolocation
  const handleUseGps = async () => {
    setGpsLoading(true);
    setStatusMsg('');
    setError('');
    try {
      const pos = await getBrowserGeolocation();
      const lat = Number(pos.latitude.toFixed(6));
      const lng = Number(pos.longitude.toFixed(6));
      setLatitude(lat);
      setLongitude(lng);
      setStatusMsg(`🎯 Device GPS coordinates locked: ${lat}° N, ${lng}° E`);
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setError('GPS Geolocation: ' + err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  // Quick Preset Locality click
  const handleSelectPreset = (name, coords) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
    setStatusMsg(`📍 Snapped marker to ${name} (${coords.lat}° N, ${coords.lng}° E)`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Reset to original coordinates
  const handleReset = () => {
    setLatitude(initialLat);
    setLongitude(initialLng);
    setAddress(property.address || '');
    setCity(property.city || 'Bengaluru');
    setPincode(property.pincode || '');
    setStatusMsg('Reverted back to original property location.');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Save changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      setError('Valid latitude and longitude are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(property.id, {
        latitude: Number(Number(latitude).toFixed(6)),
        longitude: Number(Number(longitude).toFixed(6)),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update property location.');
    } finally {
      setLoading(false);
    }
  };

  // Mock property for live Google Maps preview tab
  const previewProperty = {
    ...property,
    address,
    city,
    state,
    pincode,
    latitude,
    longitude
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[96vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shadow-sm">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Change Location & Move Marker Pin
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Exact Geocode Editor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                <strong>{property.name}</strong> • Move and set the red pin marker directly to your property's exact spot.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Status / Feedback / Error Banners */}
          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* Location Details Form Fields */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Property Address & Search</span>
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={gpsLoading}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-700 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1"
                  title="Snap marker to your device current GPS position"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{gpsLoading ? 'Detecting GPS...' : 'Use My GPS'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoGeocode}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-2xs"
                  title="Find coordinates from address text"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Geocode Address</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Street / Area Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 44, 2nd A Cross, Jakkur Layout"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="560064"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Quick Bangalore Localities</label>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { name: 'Jakkur', lat: 13.0784, lng: 77.6070 },
                    { name: 'Virupakshapura', lat: 13.0768, lng: 77.5583 },
                    { name: 'Koramangala', lat: 12.9345, lng: 77.6221 },
                    { name: 'Indiranagar', lat: 12.9719, lng: 77.6412 },
                    { name: 'HSR Layout', lat: 12.9116, lng: 77.6389 }
                  ].map(loc => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => handleSelectPreset(loc.name, loc)}
                      className="px-2 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-medium text-slate-700 transition-colors"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Numeric Coordinates Bar */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="text-slate-500 font-bold">LAT:</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-slate-400">°N</span>
                </div>

                <div className="flex items-center space-x-1.5 font-mono">
                  <span className="text-slate-500 font-bold">LNG:</span>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                  <span className="text-slate-400">°E</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                title="Revert back to the property's original coordinates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pin</span>
              </button>
            </div>
          </div>

          {/* View Mode Toggle: Interactive Draggable Map vs Google Maps Live Embed */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('interactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'interactive'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Move & Drag Pin (Interactive)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Live Google Maps Preview</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              {activeTab === 'interactive' ? 'Drag pin or click map to move' : 'Verifying final Google Maps output'}
            </span>
          </div>

          {/* Active Tab: Interactive Draggable Map */}
          {activeTab === 'interactive' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <InteractiveMapPicker
                latitude={latitude}
                longitude={longitude}
                onLocationChange={handleLocationChange}
                propertyName={property.name}
                height="380px"
                showNudgeControls={true}
              />
            </div>
          )}

          {/* Active Tab: Live Google Maps Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <PropertyMapViewer
                property={previewProperty}
                height="380px"
                showControls={true}
                showLandmarks={false}
              />
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Updated coordinates will be saved to your portfolio and shown to tenants on their dashboard.
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving Exact Location...' : 'Save Location & Marker Pin'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
