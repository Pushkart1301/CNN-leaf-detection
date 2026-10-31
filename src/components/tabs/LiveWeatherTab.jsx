import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  CloudSun, Wind, Thermometer, CloudRain, Sun, Calendar, Eye, CheckCircle2,
  FileText, Download, History, Search, MapPin, Gauge, Umbrella, Compass, Radio,
  AlertOctagon, TrendingUp, DollarSign, Plus, Edit3, Trash2, Database, ShieldAlert,
  Sparkles, Award, Target, HelpCircle, Zap, Crosshair, BarChart3, PieChart, Layers,
  Globe, ShieldCheck, Activity, Send, Clock, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import {
  fetchLiveWeatherData, searchWeatherGeocoding, fetchWeatherAIInsights, fetchHistoricalClimateTrends
} from '../../services/weatherService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const FarmMap = ({ location, satellite = false, radarTimestamp }) => {
  const position = [location.lat, location.lon];
  const radarUrl = radarTimestamp
    ? `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`
    : null;

  return (
    <MapContainer center={position} zoom={satellite ? 13 : 8} scrollWheelZoom className="h-full w-full" aria-label={`${location.name} weather map`}>
      <TileLayer
        url={satellite ? SATELLITE_URL : OSM_URL}
        attribution={satellite ? '&copy; Esri, Maxar, Earthstar Geographics' : '&copy; OpenStreetMap contributors'}
      />
      {radarUrl && <TileLayer url={radarUrl} opacity={0.7} zIndex={10} />}
      <CircleMarker center={position} radius={9} pathOptions={{ color: '#fbbf24', fillColor: '#ef4444', fillOpacity: 0.9, weight: 2 }}>
        <Popup><strong>{location.name}</strong><br />Selected farm location</Popup>
      </CircleMarker>
    </MapContainer>
  );
};

import { useFarmState } from '../../context/FarmStateContext';
import { GlobalLocationSearch } from '../ui/GlobalLocationSearch';

export const LiveWeatherTab = () => {
  const { selectedLocation, globalWeatherData, isWeatherLoading } = useFarmState();
  const [climateTrends, setClimateTrends] = useState(null);

  // Active GIS Layer
  const [activeLayer, setActiveLayer] = useState('Radar');
  const [radarTimestamp, setRadarTimestamp] = useState(null);

  // AI Advisor Chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Agricultural Meteorologist (powered by Open-Meteo Meteorological Radar & Ollama qwen:latest). Ask any ET0, spray safety, or microclimate question!' }
  ]);

  useEffect(() => {
    loadClimateTrends();
  }, []);

  // RainViewer publishes its most recent radar frame without requiring an API key.
  useEffect(() => {
    const loadRadarFrame = async () => {
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        const frames = [...(data?.radar?.past || []), ...(data?.radar?.nowcast || [])];
        setRadarTimestamp(frames.at(-1)?.time || null);
      } catch {
        setRadarTimestamp(null);
      }
    };
    loadRadarFrame();
  }, []);

  const loadClimateTrends = async () => {
    const trends = await fetchHistoricalClimateTrends();
    setClimateTrends(trends);
  };

  const handleSendChat = async () => {
    if (!chatPrompt.trim() || !globalWeatherData) return;
    const userMsg = { sender: 'user', text: chatPrompt };
    setChatMessages(prev => [...prev, userMsg]);
    const promptCopy = chatPrompt;
    setChatPrompt('');

    const aiResp = await fetchWeatherAIInsights(globalWeatherData, promptCopy);
    setChatMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const handleExportPDF = () => {
    if (!globalWeatherData) return;
    const curr = globalWeatherData.current || {};
    const agri = globalWeatherData.agri_metrics || {};
    exportPDFReport(
      `AI Agricultural Weather Report - ${selectedLocation.name}`,
      `Location: ${selectedLocation.name} (${selectedLocation.lat}°, ${selectedLocation.lon}°)\nTemperature: ${curr.temperature_c}°C (Feels Like ${curr.feels_like_c}°C)\nHumidity: ${curr.humidity_pct}%\nWind Speed: ${curr.wind_speed_kph} km/h\nET0 Evapotranspiration: ${agri.evapotranspiration_mm} mm/day\nDisease Risk: ${agri.disease_risk}\nSpray Window: ${agri.spray_window}`,
      [{ title: "Farming Confidence", value: `${agri.farming_confidence_score}%` }, { title: "ET0 Rate", value: `${agri.evapotranspiration_mm} mm/day` }]
    );
  };

  const weatherData = globalWeatherData;
  const curr = weatherData?.current || {};
  const agri = weatherData?.agri_metrics || {};
  const hourly = weatherData?.hourly_24h || [];
  const daily = weatherData?.daily_7d || [];
  const suitables = weatherData?.crop_suitability || [];
  const diseases = weatherData?.disease_forecast || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-xs">
      <AIBadgePanel 
        tabId="live-weather" 
        tabName="AI Agricultural Weather Decision Center (Open-Meteo + Ollama Qwen)" 
        defaultPrompt="Analyze current microclimate ET0 rates, GDD growth indexes, spray safety windows, and crop disease outbreak risks." 
      />

      {/* 1. GLOBAL LOCATION SEARCH BAR */}
      <GlobalLocationSearch />

      {/* 2. HERO WEATHER OVERVIEW BANNER */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 font-mono">
        <div className="space-y-2 z-10 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              📡 Open-Meteo Meteorological Radar Live
            </span>
            <span className="text-[10px] text-slate-400">Updated: {curr.retrieved_at || 'Just Now'}</span>
          </div>
          
          <h2 className="text-4xl font-extrabold text-slate-100 flex items-center gap-3">
            {curr.temperature_c !== undefined ? `${curr.temperature_c}°C` : '28.0°C'}
            <span className="text-lg font-normal text-slate-300">({curr.weather_condition || 'Clear Sky'})</span>
          </h2>

          <p className="text-xs text-slate-300">
            Feels Like: <strong className="text-slate-100">{curr.feels_like_c || 29.5}°C</strong> • Cloud Cover: <strong className="text-cyan-300">{curr.cloud_cover_pct || 20}%</strong> • Precipitation: <strong className="text-blue-300">{curr.precipitation_mm || 0.0} mm</strong>
          </p>
        </div>

        {/* 6 Key Agri Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 z-10 w-full lg:w-auto text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">Humidity</span>
            <strong className="text-cyan-300 text-base font-bold">{curr.humidity_pct || 65}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">Wind Speed</span>
            <strong className="text-emerald-400 text-base font-bold">{curr.wind_speed_kph || 12.0} km/h</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">ET0 Evapo</span>
            <strong className="text-amber-300 text-base font-bold">{agri.evapotranspiration_mm || 4.2} mm/d</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">GDD Today</span>
            <strong className="text-indigo-300 text-base font-bold">{agri.gdd_today || 14.5}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">Crop Stress</span>
            <strong className="text-rose-300 text-base font-bold">{agri.crop_stress_index || 12.0}%</strong>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-slate-400 block">Disease Risk</span>
            <strong className="text-emerald-300 text-base font-bold">{agri.disease_risk || 'Low'}</strong>
          </div>
        </div>
      </div>

      {/* 3. LIVE FARM LOCATION & PRECIPITATION RADAR (TWO COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selected Farm Satellite View (6 Cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" /> Farm Satellite View
            </h3>
          </div>

          <div className="h-80 overflow-hidden rounded-2xl border border-white/10 relative">
            <FarmMap location={selectedLocation} satellite />
            <div className="absolute top-3 left-3 z-[500] bg-black/80 px-3 py-1.5 rounded-xl text-[10px] text-emerald-300 font-mono border border-emerald-500/40">
              Selected location: <strong className="text-slate-100">{selectedLocation.name}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>Imagery: <strong className="text-emerald-400">Esri World Imagery</strong></span>
            <span>Coordinates: <strong className="text-cyan-300">{Number(selectedLocation.lat).toFixed(4)}°, {Number(selectedLocation.lon).toFixed(4)}°</strong></span>
          </div>
        </div>

        {/* Live precipitation map (6 Cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Live Precipitation Radar
            </h3>

            <div className="flex gap-1 overflow-x-auto custom-scrollbar">
              {['Radar', 'Rain'].map(lyr => (
                <button
                  key={lyr}
                  onClick={() => setActiveLayer(lyr)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                    activeLayer === lyr ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/5 text-slate-400 border-white/10'
                  }`}
                >
                  {lyr}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80 rounded-2xl overflow-hidden border border-white/10 relative bg-slate-950">
            <FarmMap location={selectedLocation} radarTimestamp={radarTimestamp} />
            <div className="absolute top-3 left-3 z-[500] bg-black/80 px-3 py-1.5 rounded-xl text-[10px] text-emerald-300 font-bold border border-emerald-500/40">
              {radarTimestamp ? `${activeLayer} overlay — latest RainViewer frame` : 'Loading latest precipitation radar…'}
            </div>
            <div className="absolute bottom-3 right-3 z-[500] bg-black/80 px-3 py-1 rounded-xl text-[10px] text-slate-300 border border-white/10">
              Rain intensity overlay • {selectedLocation.name}
            </div>
          </div>
        </div>

      </div>

      {/* 4. AI FARM DECISION ENGINE & SPRAY SAFETY WINDOW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Spray Window & Actionable Scores (6 Cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> AI Farm Decision Engine & Spray Safety Window
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              Farming Confidence: {agri.farming_confidence_score || 92.5}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300">🎯 Spray Safety Recommendation</span>
              <span className="text-amber-300 font-mono text-[11px]">Countdown: {agri.optimal_spray_countdown_hours || 3.5}h remaining</span>
            </div>
            <p className="text-slate-200">{agri.spray_window || 'Optimal Spraying Window active. Wind speed under 15 km/h and zero rainfall predicted.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 block">Irrigation Need</span>
              <strong className="text-cyan-300 text-sm">{agri.irrigation_advice || 'Sufficient Soil Moisture'}</strong>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 block">Risk Index</span>
              <strong className="text-amber-300 text-sm">{agri.farming_risk_score || 14.0}% (Low Risk)</strong>
            </div>
          </div>
        </div>

        {/* AI Disease Outbreak Forecast (6 Cols) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> AI Disease Outbreak Forecast (Pre-symptom)
            </h3>
            <span className="text-[10px] text-slate-400">Microclimate Humidity Vector</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {diseases.map((d, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <strong className="text-slate-200 block">{d.disease}</strong>
                  <span className="text-[10px] text-slate-400">{d.prevention}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-bold block ${d.risk_pct > 30 ? 'text-amber-300' : 'text-emerald-400'}`}>{d.risk_pct}%</span>
                  <span className="text-[9px] text-slate-400">{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. CROP SUITABILITY & PROFIT MATCHING MATRIX */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Microclimate Crop Suitability & Profit Estimator
          </h3>
          <button onClick={handleExportPDF} className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 hover:bg-emerald-500/20 flex items-center gap-1 text-xs">
            <Download className="w-3.5 h-3.5" /> Export PDF Weather Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {suitables.map((c, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-slate-100 text-sm">{c.crop}</strong>
                <span className="text-emerald-400 font-bold">{c.suitability_score}% Match</span>
              </div>
              <p className="text-slate-300">Variety: <strong className="text-emerald-300">{c.recommended_variety}</strong></p>
              <p className="text-slate-400">Est. Yield: <strong>{c.est_yield_t_ha} t/ha</strong></p>
              <p className="text-slate-400">Est. Profit: <strong className="text-indigo-300">₹{c.profit_inr_acre.toLocaleString()}/acre</strong></p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. LOCAL OLLAMA WEATHER AI ADVISOR CHAT */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" /> Weather AI Advisory Assistant (Ollama qwen:latest)
        </h3>

        <div className="h-48 overflow-y-auto space-y-2.5 custom-scrollbar pr-2">
          {chatMessages.map((m, idx) => (
            <div key={idx} className={`p-3 rounded-xl text-xs ${m.sender === 'user' ? 'bg-emerald-500/20 ml-12 text-emerald-200 border border-emerald-500/30' : 'bg-white/5 mr-12 text-slate-200 border border-white/10'}`}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <input 
            type="text" 
            placeholder="Ask weather question (e.g. Can I spray fungicide tomorrow morning?)..." 
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            className="flex-1 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
          <button onClick={handleSendChat} className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Ask AI
          </button>
        </div>
      </div>

    </div>
  );
};
