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
  ArrowRight
} from 'lucide-react';

export default function PropertiesPage({
  properties,
  currentUser,
  onOpenAddProperty,
  onOpenAddUnit,
  onOpenCreateAgreement
}) {
  const isAdmin = currentUser?.role === 'admin';
  const [filter, setFilter] = useState('all'); // all, occupied, vacant

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

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
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

      {/* Properties List */}
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Occupancy Indicator */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Occupancy</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {propOccupiedCount}/{propTotal} Units ({occupancyRate}%)
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenAddUnit && onOpenAddUnit(property)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold rounded-lg text-xs border border-slate-200 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Add Flat / Unit</span>
                    </button>
                  )}
                </div>
              </div>

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

    </div>
  );
}
