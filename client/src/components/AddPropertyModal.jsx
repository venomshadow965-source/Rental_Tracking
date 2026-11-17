import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Plus, 
  Trash2, 
  MapPin, 
  Home, 
  DollarSign, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Compass,
  Navigation,
  Crosshair,
  LocateFixed,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import PropertyMapViewer from './PropertyMapViewer';
import { geocodeAddress, getBrowserGeolocation } from '../services/geocoding';

export default function AddPropertyModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState('Multi-family Residential Building');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560102');
  const [latitude, setLatitude] = useState(12.9116);
  const [longitude, setLongitude] = useState(77.6389);
  const [landmarksText, setLandmarksText] = useState('Near Metro Station, Grocery Market (500m)');
  const [geocodeMsg, setGeocodeMsg] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // Units array
  const [units, setUnits] = useState([
    {
      number: 'Flat 101',
      floor: '1st Floor',
      type: '2 BHK',
      rent: 22000,
      maintenance: 2500,
      deposit: 110000
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle adding unit row
  const addUnitRow = () => {
    const nextNum = units.length + 1;
    setUnits([
      ...units,
      {
        number: `Flat ${100 + nextNum}`,
        floor: nextNum > 2 ? '2nd Floor' : '1st Floor',
        type: '2 BHK',
        rent: 22000,
        maintenance: 2500,
        deposit: 110000
      }
    ]);
  };

  // Handle unit row change
  const updateUnitRow = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    // Auto update deposit to 5x rent if changing rent and deposit is empty/default
    if (field === 'rent' && Number(value) > 0) {
      if (!updated[index].depositModified) {
        updated[index].deposit = Number(value) * 5;
      }
    }
    if (field === 'deposit') {
      updated[index].depositModified = true;
    }
    setUnits(updated);
  };

  // Handle removing unit row
  const removeUnitRow = (index) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, idx) => idx !== index));
  };

  // Quick preset template filler
  const applyPreset = (preset) => {
    setName(preset.name);
    setPropertyType(preset.propertyType);
    setAddress(preset.address);
    setCity(preset.city);
    setState(preset.state);
    setPincode(preset.pincode);
    if (preset.latitude) setLatitude(preset.latitude);
    if (preset.longitude) setLongitude(preset.longitude);
    if (preset.landmarks) setLandmarksText(preset.landmarks.join(', '));
    setUnits(preset.units);
    setError('');
    setGeocodeMsg(`📍 Coordinates set to ${preset.latitude}° N, ${preset.longitude}° E for ${preset.name}`);
    setTimeout(() => setGeocodeMsg(''), 4000);
  };

  // Automatic geocoding resolver
  const handleAutoGeocode = (customAddr = null) => {
    const geo = geocodeAddress({
      address: customAddr || address,
      city,
      pincode,
      state
    });
    setLatitude(Number(geo.latitude.toFixed(4)));
    setLongitude(Number(geo.longitude.toFixed(4)));
    setGeocodeMsg(`📍 Exact Pinpoint: ${geo.matchedBy} (${geo.latitude}° N, ${geo.longitude}° E)`);
    setTimeout(() => setGeocodeMsg(''), 5000);
  };

  const handleUseGps = async () => {
    setGpsLoading(true);
    setGeocodeMsg('');
    try {
      const pos = await getBrowserGeolocation();
      setLatitude(Number(pos.latitude.toFixed(4)));
      setLongitude(Number(pos.longitude.toFixed(4)));
      setGeocodeMsg(`🎯 Device GPS Coordinates Locked: ${pos.latitude}° N, ${pos.longitude}° E`);
      setTimeout(() => setGeocodeMsg(''), 5000);
    } catch (err) {
      setError('GPS Geolocation: ' + err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const presets = [
    {
      title: 'Jakkur Layout North Villa',
      name: 'Pajaka Residency',
      propertyType: 'Multi-family Residential Building',
      address: '2nd A Cross, Jakkur Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560064',
      latitude: 13.0784,
      longitude: 77.6070,
      landmarks: ['Jakkur Aerodrome (1.2 km)', 'Yelahanka South (2 km)', 'Bellary Road NH44 (800m)'],
      units: [
        { number: 'Flat 101', floor: '1st Floor', type: '2 BHK', rent: 22000, maintenance: 2000, deposit: 110000 },
        { number: 'Flat 201', floor: '2nd Floor', type: '2 BHK', rent: 23000, maintenance: 2000, deposit: 115000 }
      ]
    },
    {
      title: 'HSR Layout 3-Unit Complex',
      name: 'Greenwood Residency',
      propertyType: 'Multi-family Residential Building',
      address: '24, 14th Main, 5th Sector, HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      latitude: 12.9116,
      longitude: 77.6389,
      landmarks: ['HSR BDA Complex (1 km)', 'Agara Lake (1.5 km)', 'Silk Board Metro (2.5 km)'],
      units: [
        { number: 'Flat 101', floor: '1st Floor', type: '2 BHK', rent: 26000, maintenance: 2500, deposit: 130000 },
        { number: 'Flat 201', floor: '2nd Floor', type: '2 BHK', rent: 27000, maintenance: 2500, deposit: 135000 },
        { number: 'Flat 301', floor: '3rd Floor', type: '3 BHK Penthouse', rent: 38000, maintenance: 3500, deposit: 190000 }
      ]
    },
    {
      title: 'Indiranagar Luxury Villa',
      name: 'Surya Nilaya Heritage',
      propertyType: 'Independent House / Villa',
      address: 'Plot 42, 100ft Road, Defence Colony, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9719,
      longitude: 77.6412,
      landmarks: ['100ft Road Food & Shopping (300m)', 'Swami Vivekananda Metro (1.2 km)', 'CMH Hospital (1.5 km)'],
      units: [
        { number: 'Ground Villa', floor: 'Ground Floor', type: '3 BHK', rent: 45000, maintenance: 3500, deposit: 225000 },
        { number: 'First Floor Duplex', floor: '1st & 2nd Floor', type: '4 BHK Duplex', rent: 55000, maintenance: 4000, deposit: 275000 }
      ]
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError('Please provide Property Name and Address.');
      return;
    }

    if (units.length === 0) {
      setError('Please add at least one unit/flat for this property.');
      return;
    }

    for (let i = 0; i < units.length; i++) {
      if (!units[i].number || !units[i].rent) {
        setError(`Please fill Unit Number and Monthly Rent for unit row #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    setError('');

    const parsedLandmarks = landmarksText
      ? landmarksText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    try {
      await onSubmit({
        name,
        propertyType,
        address,
        city,
        state,
        pincode,
        latitude: Number(latitude) || 12.9352,
        longitude: Number(longitude) || 77.6245,
        landmarks: parsedLandmarks,
        units
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[94vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                List New Residential Property
              </h3>
              <p className="text-xs text-slate-500">
                Register building or house details and define unit inventory for tenancy
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Quick Preset Templates */}
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Quick Fill Preset Templates (1-Click)</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: Building Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>1. Property & Building Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property / Building Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Palm Heights Apartments"
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Multi-family Residential Building">Multi-family Residential Building</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Builder Floor Apartment">Builder Floor Apartment</option>
                  <option value="Gated Society Complex">Gated Society Complex</option>
                  <option value="Studio / Serviced Apartments">Studio / Serviced Apartments</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address & Locality *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => handleAutoGeocode()}
                  placeholder="e.g. 2nd A Cross, Jakkur Layout or Koramangala 4th Block"
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => handleAutoGeocode()}
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (e.target.value.length === 6) {
                        const geo = geocodeAddress({ address, city, pincode: e.target.value, state });
                        setLatitude(Number(geo.latitude.toFixed(4)));
                        setLongitude(Number(geo.longitude.toFixed(4)));
                        setGeocodeMsg(`📍 Pincode ${e.target.value} mapped to ${geo.matchedBy}`);
                        setTimeout(() => setGeocodeMsg(''), 4000);
                      }
                    }}
                    onBlur={() => handleAutoGeocode()}
                    placeholder="560064"
                    className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Nearby Landmarks & Transit (Comma separated)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Shown to prospective tenants</span>
                </label>
                <input
                  type="text"
                  value={landmarksText}
                  onChange={(e) => setLandmarksText(e.target.value)}
                  placeholder="e.g. Koramangala BDA Complex (1 km), Sony World Signal (500m), Metro Station (1.8 km)"
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Exact Map Location & Marker Pinpoint */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Crosshair className="w-4 h-4 text-emerald-600" />
                <span>2. Exact Map Marker Pinpoint & Coordinates</span>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Exact GPS Coordinates</span>
              </span>
            </div>

            <p className="text-xs text-slate-500">
              The map marker pin will be placed <strong>exactly</strong> at these geographical coordinates. Auto-detect from your address/pincode or fine-tune manually.
            </p>

            {/* Geocode feedback banner */}
            {geocodeMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{geocodeMsg}</span>
              </div>
            )}

            {/* Coordinate Pickers & Detect Buttons */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Latitude (° N) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 13.0784"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Longitude (° E) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full text-xs font-mono font-bold py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 77.6070"
                  />
                </div>
              </div>

              {/* Action Buttons to Auto-Detect or use GPS */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => handleAutoGeocode()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Auto-Detect Coordinates from Address</span>
                </button>

                <button
                  type="button"
                  onClick={handleUseGps}
                  disabled={gpsLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                >
                  <LocateFixed className={`w-3.5 h-3.5 text-blue-600 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Acquiring GPS...' : 'Use My Device GPS Location'}</span>
                </button>
              </div>
            </div>

            {/* Live Interactive Map Preview Centered on Exact Coordinates */}
            <PropertyMapViewer
              property={{
                name: name || 'Property Location Preview',
                address: address || 'Property Address',
                city,
                state,
                pincode,
                latitude: Number(latitude),
                longitude: Number(longitude),
                landmarks: landmarksText ? landmarksText.split(',').map(s => s.trim()).filter(Boolean) : []
              }}
              height="260px"
              showControls={true}
              showLandmarks={false}
            />
          </div>

          {/* SECTION 3: Units Inventory Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>3. Units & Flats Inventory ({units.length})</span>
              </div>
              <button
                type="button"
                onClick={addUnitRow}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Flat / Unit</span>
              </button>
            </div>

            <div className="space-y-3">
              {units.map((unit, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group space-y-3 hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700">
                      Unit #{idx + 1}
                    </span>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnitRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Remove unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Flat / Unit No.
                      </label>
                      <input
                        type="text"
                        required
                        value={unit.number}
                        onChange={(e) => updateUnitRow(idx, 'number', e.target.value)}
                        placeholder="e.g. Flat 101"
                        className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Floor
                      </label>
                      <input
                        type="text"
                        value={unit.floor}
                        onChange={(e) => updateUnitRow(idx, 'floor', e.target.value)}
                        placeholder="1st Floor"
                        className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        BHK Type
                      </label>
                      <select
                        value={unit.type}
                        onChange={(e) => updateUnitRow(idx, 'type', e.target.value)}
                        className="w-full text-xs py-2 px-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="1 RK">1 RK</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                        <option value="3 BHK Penthouse">3 BHK Penthouse</option>
                        <option value="4 BHK Duplex">4 BHK Duplex</option>
                        <option value="Studio">Studio</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Rent (₹/mo)
                      </label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={unit.rent}
                        onChange={(e) => updateUnitRow(idx, 'rent', e.target.value)}
                        className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold text-emerald-800"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Maint. (₹)
                      </label>
                      <input
                        type="number"
                        value={unit.maintenance}
                        onChange={(e) => updateUnitRow(idx, 'maintenance', e.target.value)}
                        className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Deposit (₹)
                      </label>
                      <input
                        type="number"
                        value={unit.deposit}
                        onChange={(e) => updateUnitRow(idx, 'deposit', e.target.value)}
                        className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Listed units will be immediately available for tenant registration & rental agreements.</span>
          </p>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {loading ? (
                <span>Listing Property...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>List Property ({units.length} Units)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
