import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Home, 
  CheckCircle2, 
  Clock, 
  User, 
  IndianRupee, 
  FileText, 
  Layers, 
  Sparkles,
  ArrowRight,
  Navigation,
  ExternalLink,
  Compass,
  ChevronDown,
  ChevronUp,
  Map as MapIcon,
  Zap,
  Droplets,
  Gauge
} from 'lucide-react';
import PropertyMapViewer from '../components/PropertyMapViewer';

export default function PropertiesPage({
  properties,
  currentUser,
  meters = [],
  onOpenAddProperty,
  onOpenAddUnit,
  onOpenCreateAgreement,
  onOpenMap,
  onOpenRegisterMeter
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, occupied, vacant
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState(properties[0]?.id || null);
  const [expandedCardMapId, setExpandedCardMapId] = useState(null);

  // Calculate totals
  const allUnits = [];
  properties.forEach(p => {
    (p.units || []).forEach(u => {
      allUnits.push({ ...u, propertyId: p.id, propertyName: p.name });
    });
  });

  const occupiedUnits = allUnits.filter(u => u.status === 'occupied');
  const vacantUnits = allUnits.filter(u => u.status === 'vacant');
  const totalMonthlyRoll = occupiedUnits.reduce((acc, curr) => acc + (curr.rent || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Property & Real Estate Portfolio
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            List and manage residential buildings, independent villas, and apartment units available for tenant leasing and Model Tenancy Act rental agreements.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddProperty}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>List New Property</span>
          </button>
        )}
      </div>

      {/* Portfolio Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Properties</span>
          <p className="text-2xl font-black text-slate-900">{properties.length}</p>
          <span className="text-[11px] text-slate-500">Buildings / Villas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Units</span>
          <p className="text-2xl font-black text-slate-900">{allUnits.length}</p>
          <span className="text-[11px] text-slate-500">Flats & Floors</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Occupied Units</span>
          <p className="text-2xl font-black text-emerald-700">{occupiedUnits.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Active Tenancies</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Vacant Units</span>
          <p className="text-2xl font-black text-amber-700">{vacantUnits.length}</p>
          <span className="text-[11px] text-amber-600 font-semibold">Ready to Lease</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Rent Roll</span>
          <p className="text-xl font-black text-slate-900 font-mono">₹{totalMonthlyRoll.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-500">From Occupied Units</span>
        </div>
      </div>

      {/* Filter Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Properties ({properties.length})
          </button>
          <button
            onClick={() => setFilter('occupied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'occupied'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Occupied Units ({occupiedUnits.length})
          </button>
          <button
            onClick={() => setFilter('vacant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'vacant'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Vacant & Available ({vacantUnits.length})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cards View</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('map');
              if (!selectedMapPropertyId && properties.length > 0) {
                setSelectedMapPropertyId(properties[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors ${
              viewMode === 'map' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Interactive Portfolio Map</span>
          </button>
        </div>
      </div>

      {/* Interactive Map View */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {/* Property Selector Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Property to View on Map
            </h3>
            {properties.map((prop) => {
              const isSelected = (selectedMapPropertyId || properties[0]?.id) === prop.id;
              const occCount = (prop.units || []).filter(u => u.status === 'occupied').length;
              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedMapPropertyId(prop.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <h4 className="text-sm font-bold text-slate-900">{prop.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{prop.address}, {prop.city}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {prop.propertyType}
                    </span>
                  </div>

                  {prop.latitude && prop.longitude && (
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{prop.latitude.toFixed(4)}° N, {prop.longitude.toFixed(4)}° E</span>
                    </p>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Units: {prop.units?.length || 0} ({occCount} occupied)</span>
                    {onOpenMap && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMap(prop);
                        }}
                        className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 text-[11px]"
                      >
                        <span>Full Map Modal →</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Map Column */}
          <div className="lg:col-span-2 space-y-4">
            {(() => {
              const currentProp = properties.find(p => p.id === (selectedMapPropertyId || properties[0]?.id)) || properties[0];
              if (!currentProp) return null;

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">{currentProp.name}</h3>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                          Live Satellite & Map
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{currentProp.address}, {currentProp.city}, {currentProp.state} - {currentProp.pincode}</p>
                    </div>
                    {onOpenMap && (
                      <button
                        type="button"
                        onClick={() => onOpenMap(currentProp)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Open Modal</span>
                      </button>
                    )}
                  </div>

                  <PropertyMapViewer
                    property={currentProp}
                    height="460px"
                    showControls={true}
                    showLandmarks={true}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Properties List (Grid View) */}
      {viewMode === 'grid' && (
      <div className="space-y-6">
        {properties.map((property) => {
          const propUnits = (property.units || []).filter(u => {
            if (filter === 'occupied') return u.status === 'occupied';
            if (filter === 'vacant') return u.status === 'vacant';
            return true;
          });

          const propOccupiedCount = (property.units || []).filter(u => u.status === 'occupied').length;
          const propTotal = property.units?.length || 0;
          const occupancyRate = propTotal > 0 ? Math.round((propOccupiedCount / propTotal) * 100) : 0;
          const isMapExpanded = expandedCardMapId === property.id;

          return (
            <div 
              key={property.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
            >
              {/* Property Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-slate-900">{property.name}</h2>
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded">
                          {property.propertyType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{property.address}, {property.city}, {property.state} - {property.pincode}</span>
                      </p>
                      {property.latitude && property.longitude && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          Coordinates: {property.latitude.toFixed(4)}° N, {property.longitude.toFixed(4)}° E
                        </p>
                      )}

                      {/* Linked Government Meters Badge */}
                      {(() => {
                        const propMeters = (meters || []).filter(m => m.propertyId === property.id);
                        if (propMeters.length > 0) {
                          return (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[11px]">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                                <Gauge className="w-3 h-3 text-emerald-600" />
                                <span>Gov Meters ({propMeters.length}):</span>
                              </span>
                              {propMeters.map(m => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center space-x-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-mono text-[10px] text-slate-700"
                                  title={`Consumer ID: ${m.consumerId} • Serial: ${m.meterNumber}`}
                                >
                                  <span>{m.meterType === 'electricity' ? '⚡' : m.meterType === 'water' ? '💧' : '🔥'}</span>
                                  <strong className="text-slate-900">{m.utilityProvider.split(' ')[0]}</strong>
                                  <span className="text-slate-400">({m.unitNumber})</span>
                                  <span className="text-emerald-700 font-bold">{m.currentReading} {m.unitOfMeasure || (m.meterType === 'electricity' ? 'kWh' : 'kL')}</span>
                                </span>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="pt-1 text-[11px] text-amber-700/80 flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>No government meters registered yet.</span>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => onOpenRegisterMeter && onOpenRegisterMeter(property.id)}
                                className="underline font-bold text-amber-800 ml-1 hover:text-amber-900"
                              >
                                Link Gov Meter →
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Occupancy Indicator */}
                  <div className="text-right mr-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Occupancy</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {propOccupiedCount}/{propTotal} Units ({occupancyRate}%)
                    </span>
                  </div>

                  {/* Add Gov Meter Button */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenRegisterMeter && onOpenRegisterMeter(property.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-2xs"
                      title="Link official government electricity or water meter for this property"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Add Gov Meter</span>
                    </button>
                  )}

                  {/* Map Buttons */}
                  <button
                    type="button"
                    onClick={() => setExpandedCardMapId(prev => prev === property.id ? null : property.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center space-x-1 ${
                      isMapExpanded 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                    title="Toggle embedded interactive map preview"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>{isMapExpanded ? 'Hide Map' : 'Map Preview'}</span>
                    {isMapExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {onOpenMap && (
                    <button
                      type="button"
                      onClick={() => onOpenMap(property)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs border border-emerald-200 transition-colors flex items-center space-x-1"
                      title="Open full interactive map dialog"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Full Map</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenAddUnit && onOpenAddUnit(property)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Flat / Unit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Map Preview */}
              {isMapExpanded && (
                <div className="pt-1 pb-3 animate-in fade-in duration-200">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                    <span className="font-bold flex items-center space-x-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Interactive Location & Satellite Map for {property.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Live coordinates: {property.latitude || 12.9345}° N, {property.longitude || 77.6221}° E</span>
                  </div>
                  <PropertyMapViewer property={property} height="320px" showControls={true} showLandmarks={true} />
                </div>
              )}

              {/* Landmarks Badges */}
              {property.landmarks && property.landmarks.length > 0 && !isMapExpanded && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                    <Compass className="w-3 h-3 text-slate-400" />
                    <span>Nearby:</span>
                  </span>
                  {property.landmarks.map((landmark, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                    >
                      📍 {landmark}
                    </span>
                  ))}
                </div>
              )}

              {/* Units Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Unit Inventory ({propUnits.length} of {propTotal} units)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {propUnits.map((unit) => {
                    const isOccupied = unit.status === 'occupied';

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                          isOccupied 
                            ? 'bg-slate-50/70 border-slate-200' 
                            : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-400 hover:shadow-sm'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <Home className="w-4 h-4 text-slate-600" />
                                <h3 className="text-sm font-bold text-slate-900">{unit.number}</h3>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {unit.floor} • <strong>{unit.type}</strong>
                              </p>
                            </div>

                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isOccupied 
                                ? 'bg-slate-200 text-slate-700' 
                                : 'bg-emerald-100 text-emerald-800 animate-pulse'
                            }`}>
                              {isOccupied ? 'Occupied' : 'Vacant'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">Monthly Rent:</span>
                              <span className="font-mono font-black text-slate-900 text-sm">₹{unit.rent?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500">
                              <span>Maintenance: ₹{unit.maintenance?.toLocaleString('en-IN')}</span>
                              <span>Deposit: ₹{unit.deposit?.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {isOccupied ? (
                            <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-1">
                              <User className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Resident: <strong>{unit.tenantName || 'Active Tenant'}</strong></span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1 pt-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ready for immediate occupancy</span>
                            </div>
                          )}
                        </div>

                        {!isOccupied && isAdmin && (
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => onOpenCreateAgreement && onOpenCreateAgreement()}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Make Agreement for this Unit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

    </div>
  );
}
