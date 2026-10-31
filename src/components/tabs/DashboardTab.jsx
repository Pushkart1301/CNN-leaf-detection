import React, { useState, useEffect, useRef } from 'react';
import { 
  Scan, Sparkles, CloudSun, TrendingUp, Landmark, Stethoscope, Globe, Grid, MapPin, 
  CheckCircle2, AlertTriangle, Droplets, Wind, CloudRain, Sun, MessageSquare, Camera, 
  Upload, Mic, ArrowUpRight, ArrowDownRight, Calendar, Layers, Search, ExternalLink, Sprout
} from 'lucide-react';
import { analyzeCropDisease, queryLocalOllama } from '../../services/aiService';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import { useAuth } from '../../context/AuthContext';
import { useFarmState } from '../../context/FarmStateContext';
import { MOCK_USER } from '../../constants/tabs';

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};

export const DashboardTab = ({ onSelectTab, toggleAIDrawer }) => {
  const { user } = useAuth();
  const { globalWeatherData } = useFarmState();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    const timer = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weatherCurrent = globalWeatherData?.current || {};
  const weatherLocation = globalWeatherData?.location?.name || user?.farmLocation || 'Mumbai, Maharashtra, India';
  const weatherTemp = Math.round(weatherCurrent.temperature_c ?? 28);
  const weatherCondition = weatherCurrent.weather_condition || 'Clear Sky';
  const currentDateLabel = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short'
  });
  const currentTimeLabel = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      setUploadedImage(imgUrl);
      await runScanProcess(file);
    }
  };

  const runScanProcess = async (file = null) => {
    setIsScanning(true);
    setScanResult(null);

    const result = await analyzeCropDisease(file);
    
    setTimeout(() => {
      setScanResult(result);
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 rounded-3xl p-4 text-slate-100 sm:p-6">
      
      <AIBadgePanel 
        tabId="dashboard" 
        tabName="Dashboard & Farm Overview" 
        contextData={{
          user: user?.displayName || 'Farmer',
          location: user?.farmLocation || 'Vellore, Tamil Nadu',
          farm_health: "Good",
          weather: `${weatherCondition} (${weatherTemp}°C)`,
          soil_moisture: "42%",
          market_trend: "Rising"
        }}
      />

      
      {/* 1. TOP PANORAMIC GREETING CARD */}
      <div className="relative rounded-2xl overflow-hidden glass-panel border border-white/10 p-6 min-h-[170px] flex flex-col justify-between">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-45 mix-blend-luminosity hover:opacity-60 transition-opacity duration-700"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1600')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-emerald-950/40 z-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
              {greeting}, {user?.displayName || 'Farmer'}! 🌿
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-medium">
              Your smart farm is ready for today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-emerald-500/30 flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Farm Health:</span>
              <strong className="text-emerald-400 font-semibold">Good</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-mono">
              <CloudSun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Weather:</span>
              <strong className="text-slate-200">Clear Sky</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 text-xs font-mono">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Soil Moisture:</span>
              <strong className="text-cyan-300">42%</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-emerald-500/30 flex items-center gap-2 text-xs font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Market Trend:</span>
              <strong className="text-emerald-400 flex items-center gap-0.5">Rising ↗</strong>
            </div>
          </div>
        </div>

        {/* 6 QUICK ACTION GLASS BUTTONS */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4">
          {[
            { id: 'disease-detection', label: 'Crop Disease', sub: 'Detect Now', icon: Scan, color: 'from-emerald-500 to-teal-600' },
            { id: 'ai-crop-doctor', label: 'AI Advisor', sub: 'Get Suggestion', icon: Sparkles, color: 'from-cyan-500 to-blue-600' },
            { id: 'weather-intel', label: 'Weather', sub: 'Live Updates', icon: CloudSun, color: 'from-amber-500 to-orange-600' },
            { id: 'live-market', label: 'Market Prices', sub: 'Check Now', icon: TrendingUp, color: 'from-emerald-400 to-emerald-700' },
            { id: 'govt-schemes', label: 'Govt Schemes', sub: 'Apply Now', icon: Landmark, color: 'from-indigo-500 to-purple-600' },
            { id: 'ai-doctor-consult', label: 'AI Doctor', sub: 'Consult Now', icon: Stethoscope, color: 'from-rose-500 to-pink-600' },
            { id: 'satellite-analytics', label: 'Satellite View', sub: 'Explore', icon: Globe, color: 'from-blue-500 to-cyan-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="p-2.5 rounded-xl glass-panel-interactive flex flex-col items-center justify-center text-center group border border-white/10 hover:border-emerald-500/50"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform mb-1.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 truncate w-full">{item.label}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-slate-200 truncate">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-COLUMN MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: CROP DISEASE DETECTION & SCANNER (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Crop Health & Disease Detection</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Local HF & Ollama
              </span>
            </div>
            <p className="text-[10px] text-amber-300">
              The active classifier supports tomato leaves only. Other crops and non-leaf images may be mislabeled.
            </p>

            {/* SCANNING FRAME WITH DASHED BOUNDING CORNERS */}
            <div className="relative rounded-xl overflow-hidden border border-white/15 h-56 bg-black/60 flex items-center justify-center group">
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Selected crop leaf"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-950/70 via-slate-950 to-teal-950/70">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-400/40 bg-black/40 px-6 py-4 text-emerald-300 shadow-lg shadow-emerald-950/50 transition hover:border-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    aria-label="Choose a crop leaf image to upload"
                  >
                    <Camera className="h-10 w-10" aria-hidden="true" />
                    <span className="text-xs font-bold">Click to upload a leaf photo</span>
                  </button>
                  <span className="text-[10px] text-slate-400">JPG, PNG, or WEBP</span>
                </div>
              )}
              {uploadedImage && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />}

              <div className="absolute inset-4 border-2 border-dashed border-emerald-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                  <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="flex justify-between">
                  <span className="w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                  <span className="w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>

              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400 animate-laser" />
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />

              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button 
                  onClick={() => runScanProcess()}
                  disabled={isScanning}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition active:scale-95"
                >
                  <Scan className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'AI Analyzing...' : 'Scan Image'}
                </button>
              </div>
            </div>

            {/* DETECTION RESULTS */}
            {scanResult && (
              scanResult.status === 'success' ? (
              <div className="space-y-3 pt-2 animate-in fade-in">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Detection Result</span>
                    <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                      {scanResult.disease}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                        {scanResult.severity}
                      </span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-mono">Confidence Score</span>
                    <p className="text-sm font-extrabold text-emerald-400 font-mono">{scanResult.confidence}%</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5 text-xs font-mono">
                  <strong className="text-slate-200">Recommended Chemical Treatment:</strong>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    {scanResult.treatment_chemical.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>

                  {scanResult.ollamaRealAdvice && (
                    <div className="mt-2 p-2 rounded bg-black/60 border border-emerald-500/30 text-emerald-300 text-[10px]">
                      🤖 <strong>Real Local Ollama (qwen:latest) Advice:</strong> {scanResult.ollamaRealAdvice.slice(0, 180)}...
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-sm text-amber-200">
                  {scanResult.error || scanResult.suggestion || 'No diagnosis was generated.'}
                </div>
              )
            )}
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl ai-orb-glow flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100">AI Assistant</h4>
                <p className="text-[11px] text-slate-400">Hello {MOCK_USER.name}! Powered by local qwen:latest.</p>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: SMART TIPS & QUICK ACCESS (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Smart Tips For You
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Best time to irrigate', desc: 'Early morning 5 AM - 8 AM', icon: Droplets, color: 'text-cyan-400 border-cyan-500/20' },
                { title: 'Next fertilizer', desc: 'Urea after 7 days (50kg/acre)', icon: Layers, color: 'text-amber-400 border-amber-500/20' },
                { title: 'Sowing suggestion', desc: 'Try ADT 54 Rice Variety for next cycle', icon: Sprout, color: 'text-emerald-400 border-emerald-500/20' },
                { title: 'Pest Alert', desc: 'Stem borer risk in 3 days due to humidity shift', icon: AlertTriangle, color: 'text-rose-400 border-rose-500/20' }
              ].map((tip) => {
                const IconComp = tip.icon;
                return (
                  <div key={tip.title} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                    <div className={`p-2 rounded-xl border ${tip.color} shrink-0`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">{tip.title}</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10">
            <h4 className="text-xs font-bold text-slate-300 mb-3 font-mono">Quick Access Shortcuts</h4>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'AI Chat', icon: MessageSquare, action: () => toggleAIDrawer() },
                { label: 'Camera Scan', icon: Camera, action: () => fileInputRef.current?.click() },
                { label: 'Upload Image', icon: Upload, action: () => fileInputRef.current?.click() },
                { label: 'Voice Command', icon: Mic, action: () => onSelectTab('ai-voice-assistant') },
              ].map((q) => {
                const QIcon = q.icon;
                return (
                  <button
                    key={q.label}
                    onClick={q.action}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 text-slate-300 hover:text-emerald-300 flex flex-col items-center gap-1.5 transition group"
                  >
                    <QIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold truncate w-full">{q.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: WEATHER, FARM LOCATION & LIVE MARKET (3 Cols) */}
        <div className="lg:col-span-3 space-y-5">
          
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{currentDateLabel}</span>
              <span>{currentTimeLabel}</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{weatherLocation}</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div>
                  <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight font-mono">{weatherTemp}°C</h3>
                  <p className="text-xs text-amber-300 font-medium">{weatherCondition}</p>
                </div>
                <Sun className="w-10 h-10 text-amber-400 animate-spin-slow" />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Live Market Prices
              </h4>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-300">Paddy (ADT-54)</span>
                <span className="font-bold text-emerald-400">₹ 2,183 (+2.45%)</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-white/5">
                <span className="text-slate-300">Wheat Sharbati</span>
                <span className="font-bold text-emerald-400">₹ 2,275 (+1.32%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
