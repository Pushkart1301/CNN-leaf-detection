import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchLiveWeatherData } from '../services/weatherService';

const FarmStateContext = createContext();

export const FarmStateProvider = ({ children }) => {
  // Global Weather & Location Context
  const [selectedLocation, setSelectedLocation] = useState({
    name: 'Mumbai, Maharashtra, India',
    lat: 19.0760,
    lon: 72.8777
  });

  const [globalWeatherData, setGlobalWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Search History & Favorite Locations Cache
  const [searchHistory, setSearchHistory] = useState([
    { name: 'Mumbai, Maharashtra, India', lat: 19.0760, lon: 72.8777 },
    { name: 'Vellore, Tamil Nadu, India', lat: 12.9165, lon: 79.1325 },
    { name: 'Neyveli Township, Tamil Nadu, India', lat: 11.6033, lon: 79.4851 },
    { name: 'Villupuram, Tamil Nadu, India', lat: 11.9401, lon: 79.4861 },
    { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lon: 80.2707 },
    { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 }
  ]);

  const [favoriteLocations, setFavoriteLocations] = useState([
    { name: 'Mumbai, Maharashtra, India', lat: 19.0760, lon: 72.8777 },
    { name: 'Vellore, Tamil Nadu, India', lat: 12.9165, lon: 79.1325 },
    { name: 'Neyveli Township, Tamil Nadu, India', lat: 11.6033, lon: 79.4851 }
  ]);

  // Existing Farm Health State (Preserved 100%)
  const [farmHealthScore, setFarmHealthScore] = useState(94);
  const [recentDiagnoses, setRecentDiagnoses] = useState([
    {
      id: 1,
      crop: 'Rice (Paddy - ADT 54)',
      disease: 'Brown Spot (Bipolaris oryzae)',
      confidence: 94.6,
      severity: 'High Risk',
      timestamp: 'Today 08:30 AM'
    }
  ]);

  const [activeAlerts, setActiveAlerts] = useState([
    { id: 1, title: 'Brown Spot Disease Detected', field: 'Field #2 (Paddy)', level: 'high', time: '10m ago' },
    { id: 2, title: 'Stem Borer Outbreak Risk', field: 'Field #1 (Paddy)', level: 'medium', time: '1h ago' }
  ]);

  // Fetch weather automatically whenever selectedLocation changes
  useEffect(() => {
    refreshGlobalWeather(selectedLocation.lat, selectedLocation.lon, selectedLocation.name);
  }, [selectedLocation]);

  const refreshGlobalWeather = async (lat, lon, name) => {
    setIsWeatherLoading(true);
    const data = await fetchLiveWeatherData(lat, lon, name);
    if (data) {
      setGlobalWeatherData(data);
    }
    setIsWeatherLoading(false);
  };

  const updateGlobalLocation = (locationObj) => {
    if (!locationObj || !locationObj.name) return;

    setSelectedLocation({
      name: locationObj.display_name || locationObj.name,
      lat: parseFloat(locationObj.latitude || locationObj.lat),
      lon: parseFloat(locationObj.longitude || locationObj.lon)
    });

    // Append to search history (deduplicated)
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.name !== locationObj.name);
      return [{
        name: locationObj.display_name || locationObj.name,
        lat: parseFloat(locationObj.latitude || locationObj.lat),
        lon: parseFloat(locationObj.longitude || locationObj.lon)
      }, ...filtered].slice(0, 10);
    });
  };

  const toggleFavoriteLocation = (locationObj) => {
    setFavoriteLocations(prev => {
      const exists = prev.some(item => item.name === locationObj.name);
      if (exists) {
        return prev.filter(item => item.name !== locationObj.name);
      } else {
        return [...prev, locationObj];
      }
    });
  };

  const addDiagnosisEvent = (diagnosis) => {
    const newDiag = {
      id: Date.now(),
      crop: diagnosis.crop || 'Rice (Paddy - ADT 54)',
      disease: diagnosis.disease_name || 'Brown Spot',
      confidence: diagnosis.confidence || 94.6,
      severity: diagnosis.severity || 'Medium Risk',
      timestamp: 'Just now'
    };

    setRecentDiagnoses(prev => [newDiag, ...prev]);

    if (diagnosis.confidence > 70) {
      setFarmHealthScore(prev => Math.max(75, prev - 4));
      setActiveAlerts(prev => [
        {
          id: Date.now(),
          title: `${diagnosis.disease_name} Alert`,
          field: 'Field #2 (Paddy)',
          level: 'high',
          time: 'Just now'
        },
        ...prev
      ]);
    }
  };

  return (
    <FarmStateContext.Provider value={{
      selectedLocation,
      globalWeatherData,
      isWeatherLoading,
      searchHistory,
      favoriteLocations,
      updateGlobalLocation,
      toggleFavoriteLocation,
      farmHealthScore,
      recentDiagnoses,
      activeAlerts,
      addDiagnosisEvent
    }}>
      {children}
    </FarmStateContext.Provider>
  );
};

export const useFarmState = () => useContext(FarmStateContext);
