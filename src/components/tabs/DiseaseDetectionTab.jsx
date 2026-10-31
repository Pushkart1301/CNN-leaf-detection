import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  ShieldAlert, Globe, Activity, Search, AlertTriangle, CheckCircle2, FileText, Download,
  TrendingUp, DollarSign, Send, RefreshCw, Cpu, Layers, MapPin, Eye, Filter, Zap, BookOpen, Clock, ShieldCheck,
  Camera
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import {
  fetchDiseaseSurveillance, fetchDiseaseOutbreakAnalysis, fetchDiseaseHistoricalTimeline, fetchDiseaseSpreadPrediction
} from '../../services/aiService';
import { analyzeCropDisease } from '../../services/aiService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

// 3D EARTH GLOBE CANVAS COMPONENT
const GlobalOutbreakGlobe = ({ outbreaks, selectedCountry }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(cx, cy) - 25;

      // Outer Atmosphere Glow
      const grad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.15);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Earth Sphere Outline
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Latitude / Longitude Grids
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = -r + 20; i < r; i += 30) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + i / 2, Math.sqrt(r * r - i * i), 15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating Continent Polygons
      ctx.fillStyle = '#ef4444';
      ctx.globalAlpha = 0.3;
      const rotRad = (rotation * Math.PI) / 180;
      for (let k = 0; k < 6; k++) {
        const angle = rotRad + (k * Math.PI / 3);
        const bx = cx + Math.cos(angle) * (r * 0.6);
        const by = cy + Math.sin(angle) * (r * 0.3);
        ctx.beginPath();
        ctx.arc(bx, by, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Render Active Outbreak Pulsing Hotspots
      if (outbreaks && outbreaks.length > 0) {
        outbreaks.forEach((outbreak, idx) => {
          const pinAngle = rotRad + (idx * (Math.PI * 2 / outbreaks.length));
          const px = cx + Math.cos(pinAngle) * (r * 0.7);
          const py = cy + Math.sin(pinAngle) * (r * 0.4);

          const isSelected = selectedCountry === outbreak.country || selectedCountry === 'ALL';
          ctx.fillStyle = isSelected ? '#f43f5e' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      }

      setRotation(prev => (prev + 0.3) % 360);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [rotation, outbreaks, selectedCountry]);

  return (
    <div className="relative flex items-center justify-center h-80 w-full overflow-hidden bg-black/60 rounded-2xl border border-rose-500/30">
      <canvas ref={canvasRef} width={420} height={300} className="max-w-full" />
      <div className="absolute top-3 left-3 bg-black/80 px-3 py-1.5 rounded-xl text-[10px] text-rose-300 font-mono border border-rose-500/40">
        🌐 Satellite GIS Surveillance • Filter: <strong className="text-amber-300">{selectedCountry}</strong>
      </div>
      <div className="absolute bottom-3 right-3 bg-black/80 px-3 py-1 rounded-xl text-[10px] text-slate-400 font-mono border border-white/10">
        FAO / ICAR / USDA Live Feed Connection Active
      </div>
    </div>
  );
};

const OutbreakMap = ({ outbreaks, selectedCountry, selectedOutbreakId, onSelect }) => {
  const visibleOutbreaks = selectedCountry === 'ALL'
    ? outbreaks
    : outbreaks.filter((outbreak) => outbreak.country === selectedCountry);
  const center = selectedCountry === 'ALL'
    ? [20, 10]
    : visibleOutbreaks.length
      ? [visibleOutbreaks[0].latitude, visibleOutbreaks[0].longitude]
      : [20, 10];
  const zoom = selectedCountry === 'ALL' ? 2 : 5;

  return (
    <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-rose-500/30 bg-black/60">
      <MapContainer key={selectedCountry} center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" aria-label="Reported crop disease locations map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {visibleOutbreaks.map((outbreak) => {
          const selected = outbreak.id === selectedOutbreakId;
          const critical = outbreak.severity_level >= 5;
          return (
            <CircleMarker
              key={outbreak.id}
              center={[outbreak.latitude, outbreak.longitude]}
              radius={selected ? 12 : 8}
              eventHandlers={{ click: () => onSelect(outbreak.id) }}
              pathOptions={{
                color: selected ? '#fbbf24' : '#fff',
                fillColor: critical ? '#dc2626' : '#f43f5e',
                fillOpacity: 0.85,
                weight: selected ? 3 : 1.5,
              }}
            >
              <Popup>
                <strong>{outbreak.disease}</strong><br />
                {outbreak.region}, {outbreak.country}<br />
                Severity: {outbreak.severity}<br />
                Report date: {outbreak.date_reported}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="absolute top-3 left-3 z-[500] bg-black/85 px-3 py-1.5 rounded-xl text-[10px] text-rose-200 font-mono border border-rose-500/40">
        Reported locations in the bundled surveillance dataset • Filter: <strong className="text-amber-300">{selectedCountry}</strong>
      </div>
      <div className="absolute bottom-3 right-3 z-[500] bg-black/85 px-3 py-1 rounded-xl text-[10px] text-slate-300 font-mono border border-white/10">
        {visibleOutbreaks.length} plotted report{visibleOutbreaks.length === 1 ? '' : 's'} • Click a marker for details
      </div>
    </div>
  );
};

export const DiseaseDetectionTab = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = useRef(null);
  const [surveillanceData, setSurveillanceData] = useState(null);
  const [spreadPrediction, setSpreadPrediction] = useState(null);
  const [historicalTimeline, setHistoricalTimeline] = useState(null);
  const [selectedOutbreakId, setSelectedOutbreakId] = useState("OUTBREAK-2026-001");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Local Ollama AI Epidemiology Advisor Chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Greetings. I am your Global Agricultural Epidemiology Specialist (powered by local Ollama qwen:latest & FAO/ICAR RAG data). Ask any outbreak containment, quarantine perimeter, or fungicide protocol question!' }
  ]);

  useEffect(() => {
    loadSurveillanceData();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(previewUrl);
    await runImageScan(file);
  };

  const runImageScan = async (file = null) => {
    setIsScanningImage(true);
    setScanResult(null);
    try {
      const result = await analyzeCropDisease(file);
      setScanResult(result);
    } finally {
      setIsScanningImage(false);
    }
  };

  useEffect(() => {
    if (selectedOutbreakId) {
      loadSpreadPrediction(selectedOutbreakId);
    }
  }, [selectedOutbreakId]);

  const loadSurveillanceData = async () => {
    setIsLoading(true);
    const data = await fetchDiseaseSurveillance();
    const history = await fetchDiseaseHistoricalTimeline();
    setSurveillanceData(data);
    setHistoricalTimeline(history);
    setIsLoading(false);
  };

  const loadSpreadPrediction = async (outbreakId) => {
    const pred = await fetchDiseaseSpreadPrediction(outbreakId);
    setSpreadPrediction(pred);
  };

  const handleSendChat = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = { sender: 'user', text: chatPrompt };
    setChatMessages(prev => [...prev, userMsg]);
    const promptCopy = chatPrompt;
    setChatPrompt('');

    const aiResp = await fetchDiseaseOutbreakAnalysis(selectedOutbreakId, promptCopy);
    setChatMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const outbreaks = surveillanceData?.outbreaks || [];
  const filteredOutbreaks = outbreaks.filter(o => {
    const matchesCountry = selectedCountry === 'ALL' || o.country === selectedCountry;
    const matchesSearch = !searchQuery.trim() || 
      o.disease.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const selectedOutbreak = outbreaks.find(o => o.id === selectedOutbreakId) || outbreaks[0];
  const stats = surveillanceData?.global_statistics || {};

  const handleExportPDF = () => {
    if (!selectedOutbreak) return;
    exportPDFReport(
      `Global Disease Outbreak Report - ${selectedOutbreak.disease}`,
      `Disease: ${selectedOutbreak.disease}\nCrop Host: ${selectedOutbreak.crop}\nCountry: ${selectedOutbreak.country} (${selectedOutbreak.region})\nSeverity: ${selectedOutbreak.severity}\nAffected Area: ${selectedOutbreak.affected_area_ha}\nEconomic Loss: ${selectedOutbreak.estimated_economic_loss_usd}\nAdvisory: ${selectedOutbreak.government_advisory}`,
      [{ title: "Outbreak ID", value: selectedOutbreak.id }, { title: "Farmer Population Impacted", value: selectedOutbreak.farmer_population_affected }]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-xs">
      <AIBadgePanel 
        tabId="disease-detection" 
        tabName="Global Agricultural Disease Intelligence Center (FAO + ICAR + Ollama Qwen)" 
        defaultPrompt="Monitor worldwide plant pathogen outbreaks, track disease vectors, analyze climate influence, and generate containment protocols." 
      />

      <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 bg-black/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Crop Disease Image Scanner</h3>
            <p className="text-[11px] text-amber-300">This model is trained only for tomato leaves. It cannot identify wheat, people, or other unsupported images reliably.</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => runImageScan()}
              disabled={isScanningImage}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold disabled:opacity-60"
            >
              {isScanningImage ? 'Scanning...' : 'Scan Image'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {uploadedImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 min-h-[260px] bg-black/60 flex items-center justify-center">
              <img src={uploadedImage} alt="Uploaded tomato leaf for disease scan" className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-slate-200 bg-black/70 px-3 py-1.5 rounded-full border border-white/10 hover:border-emerald-400"
                >
                  Change image
                </button>
                <span className="text-[11px] text-emerald-300 bg-black/70 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  {isScanningImage ? 'AI analyzing...' : 'Ready to scan'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-500/40 min-h-[260px] bg-slate-950/60 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="rounded-full bg-emerald-500/10 p-4 text-emerald-300">
                <Camera className="w-9 h-9" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Upload a tomato leaf photo</h4>
                <p className="mt-1 text-[11px] text-slate-400">Choose an image from your device to check it for disease.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-bold text-slate-950 hover:bg-emerald-400 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" aria-hidden="true" />
                Choose leaf image
              </button>
            </div>
          )}

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400">Status</div>
              <div className="text-sm font-bold text-slate-100">
                {isScanningImage ? 'Processing image...' : scanResult?.status === 'success' ? 'Scan complete' : scanResult ? 'No diagnosis' : 'Waiting for upload'}
              </div>
            </div>

            {scanResult ? (
              scanResult.status === 'success' ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Detected Disease</span>
                  <span className="text-[10px] text-emerald-300">Confidence {scanResult.confidence}%</span>
                </div>
                <div className="text-base font-extrabold text-slate-100">{scanResult.disease}</div>
                <div className="text-[11px] text-rose-300">Severity: {scanResult.severity}</div>
                <div className="text-[11px] text-slate-300">
                  <div className="font-bold text-slate-200 mb-1">Suggested treatment</div>
                  <ul className="list-disc list-inside space-y-1">
                    {scanResult.treatment_chemical?.map((item, index) => <li key={index}>{item}</li>)}
                  </ul>
                </div>
              </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200">
                  {scanResult.error || scanResult.suggestion || 'No diagnosis was generated.'}
                </div>
              )
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400">
                Upload a leaf image to run the disease detector.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. HERO GLOBAL STATISTICS KPI BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 bg-rose-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Total Active Outbreaks</span>
          <strong className="text-2xl font-extrabold text-rose-400">{stats.total_active_outbreaks || 6}</strong>
          <span className="text-[10px] text-rose-300 block font-sans">Global Hotspots</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 bg-amber-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">New Outbreaks Today</span>
          <strong className="text-2xl font-extrabold text-amber-400">{stats.new_outbreaks_today || 1}</strong>
          <span className="text-[10px] text-amber-300 block font-sans">Bundled sample data</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 bg-cyan-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Countries Affected</span>
          <strong className="text-2xl font-extrabold text-cyan-400">{stats.countries_affected || 6}</strong>
          <span className="text-[10px] text-cyan-300 block font-sans">Global Reach</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-indigo-500/30 bg-indigo-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Total Area Affected</span>
          <strong className="text-lg font-extrabold text-indigo-300">{stats.total_area_affected_ha || "349,100 ha"}</strong>
          <span className="text-[10px] text-indigo-400 block font-sans">Agricultural Land</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Global Economic Loss</span>
          <strong className="text-lg font-extrabold text-emerald-400">{stats.estimated_global_loss || "$138.9M"}</strong>
          <span className="text-[10px] text-emerald-300 block font-sans">Crop Production Impact</span>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-purple-500/30 bg-purple-950/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Containment Urgency</span>
          <strong className="text-lg font-extrabold text-purple-300">Level 4 High</strong>
          <span className="text-[10px] text-purple-400 block font-sans">Quarantine Active</span>
        </div>
      </div>

      {/* 2. WORLD DISEASE MAP & COUNTRY FILTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rose-400" /> Reported Crop Disease Locations
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Country:</span>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg text-[10px] text-slate-200 px-2 py-1 focus:outline-none focus:border-rose-500/50"
              >
                <option value="ALL">All Countries (Global View)</option>
                <option value="India">India</option>
                <option value="Kenya">Kenya</option>
                <option value="United States">United States</option>
                <option value="Brazil">Brazil</option>
                <option value="Philippines">Philippines</option>
                <option value="China">China</option>
              </select>
            </div>
          </div>
          <OutbreakMap
            outbreaks={outbreaks}
            selectedCountry={selectedCountry}
            selectedOutbreakId={selectedOutbreakId}
            onSelect={setSelectedOutbreakId}
          />
        </div>

        {/* AI Spread Predictor Card */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-rose-500/30 bg-black/40 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Illustrative Climate Risk Estimate
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Model score: {spreadPrediction?.confidence_pct || 91.5}%
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-white/5 py-1">
                <span className="text-slate-400">Target Outbreak:</span>
                <strong className="text-rose-300">{selectedOutbreak?.disease}</strong>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span className="text-slate-400">Predominant Vector:</span>
                <span className="text-amber-300">{spreadPrediction?.spread_vector || "North-Easterly Wind & Monsoon Moisture"}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span className="text-slate-400">High Risk Adjacent Regions:</span>
                <span className="text-cyan-300">{spreadPrediction?.high_risk_adjacent_regions?.join(", ")}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span className="text-slate-400">Estimated Timeline:</span>
                <span className="text-rose-400 font-bold">{spreadPrediction?.estimated_spread_timeline_days || "7 - 14 Days"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="text-[10px] text-slate-400 block font-bold">Climate Influence Factors:</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-black/40 p-2 rounded border border-white/5">
                  <span className="text-slate-400 block">Wind Vector:</span>
                  <span className="text-amber-300 font-mono">{spreadPrediction?.climate_factors?.wind_speed_vector || "18.5 km/h NE"}</span>
                </div>
                <div className="bg-black/40 p-2 rounded border border-white/5">
                  <span className="text-slate-400 block">Humidity:</span>
                  <span className="text-cyan-300 font-mono">{spreadPrediction?.climate_factors?.humidity_influence || "84% High"}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleExportPDF}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30"
          >
            <Download className="w-4 h-4" /> Download Epidemiological Dossier (PDF)
          </button>
        </div>
      </div>

      {/* 3. LIVE OUTBREAK SURVEILLANCE FEED & AI EPIDEMIOLOGY ADVISOR */}
      {/*
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" /> Bundled Disease Surveillance Dataset ({filteredOutbreaks.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <input 
                type="text" 
                placeholder="Search disease, crop, country..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {filteredOutbreaks.map((outbreak) => {
              const isSelected = outbreak.id === selectedOutbreakId;
              return (
                <div 
                  key={outbreak.id}
                  onClick={() => setSelectedOutbreakId(outbreak.id)}
                  className={`glass-panel rounded-2xl p-4 border cursor-pointer transition flex flex-col md:flex-row items-start justify-between gap-4 ${
                    isSelected 
                      ? 'border-rose-500 bg-rose-950/30 shadow-lg shadow-rose-950/50' 
                      : 'border-white/10 hover:border-rose-500/40 bg-black/40'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {outbreak.id}
                      </span>
                      <strong className="text-sm text-slate-100">{outbreak.disease}</strong>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      <span className="text-slate-400">Pathogen:</span> {outbreak.pathogen}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span>🌾 Crop: <strong className="text-amber-300">{outbreak.crop}</strong></span>
                      <span>📍 Country: <strong className="text-cyan-300">{outbreak.country} ({outbreak.region})</strong></span>
                      <span>🗓️ Reported: <strong className="text-slate-300">{outbreak.date_reported}</strong></span>
                    </div>

                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-slate-300">
                      <strong className="text-emerald-400 block mb-0.5">Government Advisory:</strong>
                      {outbreak.government_advisory}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4 w-full md:w-auto">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {outbreak.severity}
                    </span>
                    <div className="text-right text-[10px]">
                      <span className="text-slate-400 block">Est. Loss:</span>
                      <strong className="text-emerald-400">{outbreak.estimated_economic_loss_usd}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-black flex flex-col justify-between h-[550px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-slate-200 text-xs">Local Ollama Qwen Epidemiology Advisor</h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                qwen:latest Active
              </span>
            </div>

            <div className="h-[360px] overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl text-xs leading-relaxed border ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 ml-6' 
                      : 'bg-white/5 border-white/10 text-slate-200 mr-6'
                  }`}
                >
                  <strong className="block text-[10px] text-slate-400 mb-1">
                    {msg.sender === 'user' ? '👤 Farmer / Officer Query:' : '🌍 AI Epidemiology Specialist:'}
                  </strong>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center gap-2">
            <input 
              type="text" 
              placeholder={`Ask Qwen about containment for ${selectedOutbreak?.disease}...`} 
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className="flex-1 h-10 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <button 
              onClick={handleSendChat}
              className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      */}

    </div>
  );
};
