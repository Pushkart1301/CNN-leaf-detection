import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Star, History, RefreshCw, X, Check, Globe } from 'lucide-react';
import { useFarmState } from '../../context/FarmStateContext';
import { searchWeatherGeocoding } from '../../services/weatherService';

export const GlobalLocationSearch = () => {
  const { 
    selectedLocation, 
    updateGlobalLocation, 
    searchHistory, 
    favoriteLocations, 
    toggleFavoriteLocation,
    isWeatherLoading 
  } = useFarmState();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Debounced Search Effect (250ms)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setNoResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setNoResults(false);
      const results = await searchWeatherGeocoding(query);
      setIsSearching(false);
      
      if (results && results.length > 0) {
        setSuggestions(results);
        setShowDropdown(true);
      } else {
        setSuggestions([]);
        setNoResults(true);
        setShowDropdown(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc) => {
    updateGlobalLocation(loc);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setNoResults(false);
  };

  const isFavorite = favoriteLocations.some(f => f.name === selectedLocation.name);

  return (
    <div className="space-y-3 font-mono text-xs" ref={searchContainerRef}>
      
      {/* 1. SEARCH BAR WITH AUTOCOMPLETE */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/40 bg-black/40 flex flex-col md:flex-row items-center justify-between gap-4 relative">
        <div className="flex items-center gap-2 text-slate-200 w-full md:w-auto">
          <MapPin className="w-4.5 h-4.5 text-emerald-400 shrink-0 animate-bounce" />
          <div>
            <span className="text-slate-400 text-[10px] block">Global Weather Context</span>
            <strong className="text-emerald-300 text-sm">{selectedLocation.name}</strong>
            <span className="text-[10px] text-slate-400 ml-2">({selectedLocation.lat.toFixed(4)}°, {selectedLocation.lon.toFixed(4)}°)</span>
          </div>

          <button
            onClick={() => toggleFavoriteLocation(selectedLocation)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-amber-400 ml-2 transition"
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Global Input Field */}
        <div className="relative w-full md:w-[480px]">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search Village, Town, City, District, PIN code, Lat, Lon (e.g. Neyveli Township, Tokyo)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => (suggestions.length > 0 || noResults) && setShowDropdown(true)}
              className="w-full h-11 pl-4 pr-10 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 shadow-inner"
            />

            <div className="absolute right-3 top-3 flex items-center gap-1.5 text-slate-400">
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : query ? (
                <button onClick={() => { setQuery(''); setSuggestions([]); setNoResults(false); }} className="hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Autocomplete & Results Dropdown */}
          {showDropdown && (
            <div className="absolute top-13 left-0 right-0 z-50 bg-slate-900/95 border border-emerald-500/50 rounded-xl p-2 shadow-2xl backdrop-blur-md max-h-72 overflow-y-auto custom-scrollbar space-y-1">
              
              {isSearching && (
                <div className="p-3 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Searching location globally...
                </div>
              )}

              {!isSearching && noResults && (
                <div className="p-3 text-center text-rose-300 space-y-1">
                  <p className="font-bold">Location not found.</p>
                  <p className="text-[10px] text-slate-400">Try another spelling, district, PIN code, or GPS coordinates.</p>
                </div>
              )}

              {!isSearching && suggestions.map((loc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelect(loc)}
                  className="p-2.5 rounded-lg hover:bg-emerald-500/20 text-xs font-mono text-slate-200 cursor-pointer flex items-center justify-between transition border border-transparent hover:border-emerald-500/30"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{loc.display_name}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                    ({loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. RECENT SEARCHES & FAVORITE LOCATION CHIPS */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
          <History className="w-3 h-3 text-emerald-400" /> Quick Switch:
        </span>

        {searchHistory.slice(0, 5).map((loc, idx) => (
          <button
            key={idx}
            onClick={() => updateGlobalLocation(loc)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
              selectedLocation.name === loc.name 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' 
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Globe className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{loc.name.split(',')[0]}</span>
          </button>
        ))}

        {isWeatherLoading && (
          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 ml-auto animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> Updating Global Weather System...
          </span>
        )}
      </div>

    </div>
  );
};
