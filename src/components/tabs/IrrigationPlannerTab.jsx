import React, { useState, useEffect } from 'react';
import {
  Droplets, Activity, Layers, Grid, List, Calendar, MapPin, Search, Plus, Filter,
  Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp,
  Download, FileText, Share2, RefreshCw, Eye, Star, Pin, Sliders, CheckSquare, MessageSquare,
  Thermometer, ShieldCheck, Database, Award, Zap, BarChart3, HelpCircle, Compass, ShoppingCart, Calculator, Power, Gauge, Wind
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import { LocalProductStore } from '../ui/LocalProductStore';
import { useFarmState } from '../../context/FarmStateContext';
import {
  fetchIrrigationPlans, fetchIrrigationMethods, fetchMarketplaceEquipment,
  calculatePenmanMonteithEtc, compareIrrigationMethods, queryIrrigationAdvisor
} from '../../services/irrigationService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const PUMP_LOG_STORAGE_KEY = 'agriverse-irrigation-pump-log';

const loadPumpSessions = () => {
  try {
    const saved = window.localStorage.getItem(PUMP_LOG_STORAGE_KEY);
    const sessions = saved ? JSON.parse(saved) : [];
    return Array.isArray(sessions)
      ? sessions.filter(session => (
        session &&
        typeof session.id === 'string' &&
        typeof session.startedAt === 'string' &&
        (session.stoppedAt === null || typeof session.stoppedAt === 'string')
      ))
      : [];
  } catch (error) {
    console.warn('Could not load saved pump log:', error);
    return [];
  }
};

const formatPumpTime = (timestamp) => new Date(timestamp).toLocaleString();

const formatPumpDuration = (startedAt, stoppedAt) => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((new Date(stoppedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  );
  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export const IrrigationPlannerTab = () => {
  const { selectedLocation } = useFarmState();
  // View Mode State ('pump' | 'calc' | 'methods' | 'marketplace' | 'compare')
  const [activeTab, setActiveTab] = useState('pump');
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');

  const [pumpSessions, setPumpSessions] = useState(loadPumpSessions);
  const activePumpSession = pumpSessions.find(session => !session.stoppedAt);
  const isPumpRunning = Boolean(activePumpSession);

  // ETc Calculator State
  const [calcCrop, setCalcCrop] = useState('Rice Paddy');
  const [calcAcreage, setCalcAcreage] = useState(2.0);
  const [calcStage, setCalcStage] = useState('Tillering');
  const [calcTemp, setCalcTemp] = useState(32.0);
  const [calcHumidity, setCalcHumidity] = useState(65.0);
  const [calcWind, setCalcWind] = useState(12.0);
  const [etcResult, setEtcResult] = useState(null);

  // Data State
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [loading, setLoading] = useState(true);

  // Side-by-Side Comparison State
  const [compareIdA, setCompareIdA] = useState('METH-001');
  const [compareIdB, setCompareIdB] = useState('METH-002');
  const [comparisonData, setComparisonData] = useState(null);

  // Floating AI State
  const [showFloatingAI, setShowFloatingAI] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState([
    { sender: 'ai', text: 'Greetings! I am your AI Precision Irrigation & Evapotranspiration Advisor (powered by Ollama qwen:latest). Ask me about Penman-Monteith ETc rates, pump schedules, or PM-KUSUM solar pump subsidies!' }
  ]);

  useEffect(() => {
    loadAllData();
  }, [searchQuery, cropFilter]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PUMP_LOG_STORAGE_KEY, JSON.stringify(pumpSessions));
    } catch (error) {
      console.error('Could not save pump log:', error);
    }
  }, [pumpSessions]);

  useEffect(() => {
    handleRunEtcCalculator();
  }, [calcCrop, calcAcreage, calcStage, calcTemp, calcHumidity, calcWind]);

  useEffect(() => {
    if (activeTab === 'compare') {
      loadComparison();
    }
  }, [activeTab, compareIdA, compareIdB]);

  const loadAllData = async () => {
    setLoading(true);
    const p = await fetchIrrigationPlans(cropFilter, searchQuery);
    const m = await fetchIrrigationMethods();
    const eq = await fetchMarketplaceEquipment();
    setPlans(p);
    setMethods(m);
    setMarketplace(eq);
    setLoading(false);
  };

  const loadComparison = async () => {
    const res = await compareIrrigationMethods(compareIdA, compareIdB);
    setComparisonData(res);
  };

  const handleRunEtcCalculator = async () => {
    const res = await calculatePenmanMonteithEtc(calcCrop, calcAcreage, calcStage, calcTemp, calcHumidity, calcWind);
    setEtcResult(res);
  };

  const handleTogglePump = () => {
    const timestamp = new Date().toISOString();
    setPumpSessions(previous => {
      const activeSession = previous.find(session => !session.stoppedAt);
      if (activeSession) {
        return previous.map(session => (
          session.id === activeSession.id
            ? { ...session, stoppedAt: timestamp }
            : session
        ));
      }
      return [...previous, {
        id: `${Date.now()}`,
        startedAt: timestamp,
        stoppedAt: null
      }];
    });
  };

  const handleSendAdvisorChat = async () => {
    if (!advisorPrompt.trim()) return;
    const userMsg = { sender: 'user', text: advisorPrompt };
    setAdvisorMessages(prev => [...prev, userMsg]);
    const promptCopy = advisorPrompt;
    setAdvisorPrompt('');

    const contextText = `Crop: ${calcCrop}, Stage: ${calcStage}, ETc: ${etcResult?.climate_metrics?.etc_crop_evapotranspiration_mm_day} mm/day, Pump Running: ${isPumpRunning}`;
    const aiResp = await queryIrrigationAdvisor(promptCopy, contextText);
    setAdvisorMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const handleExportPDF = () => {
    if (!etcResult) return;
    exportPDFReport(
      `AI Precision Irrigation Schedule & ETc Report - ${calcCrop}`,
      `Crop: ${calcCrop}\nAcreage: ${calcAcreage} Acres\nGrowth Stage: ${calcStage}\n\nCLIMATE & ETc:\n- Temperature: ${calcTemp}°C\n- Humidity: ${calcHumidity}%\n- Wind Speed: ${calcWind} km/h\n- Reference ETo: ${etcResult.climate_metrics.eto_reference_mm_day} mm/day\n- Crop ETc: ${etcResult.climate_metrics.etc_crop_evapotranspiration_mm_day} mm/day\n\nRECOMMENDED WATER:\n- Daily Need: ${etcResult.water_requirements.daily_liters_per_acre} Liters/Acre/Day\n- Total Daily Need: ${etcResult.water_requirements.total_daily_liters} Liters\n- Pump Runtime: ${etcResult.water_requirements.recommended_pump_runtime_mins} Mins\n- Start Time: ${etcResult.water_requirements.recommended_start_time}`,
      [{ title: "Evapotranspiration ETc", value: `${etcResult.climate_metrics.etc_crop_evapotranspiration_mm_day} mm/day` }, { title: "Water Savings", value: "38%" }]
    );
  };

  const topPlan = plans[0] || {};

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-mono text-xs relative">
      {activeTab !== 'pump' && (
        <AIBadgePanel 
          tabId="irrigation-planner" 
          tabName="AI Precision Irrigation Intelligence & Penman-Monteith Evapotranspiration Platform" 
          defaultPrompt="Calculate daily evapotranspiration ETc, rain-aware pump schedule, and smart equipment marketplace." 
        />
      )}

      {activeTab === 'pump' && (
        <section className="glass-panel rounded-xl border border-cyan-500/30 bg-slate-950/70 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Irrigation Planner</h2>
            <p className="mt-1 text-slate-400">
              {selectedLocation?.name || 'Mumbai, Maharashtra, India'}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] uppercase tracking-wide text-cyan-300">Recommended plan</p>
            <p className="mt-1 text-base font-bold text-slate-100">
              {loading ? 'Loading recommendation...' : topPlan.irrigation_decision || 'No irrigation recommendation available'}
            </p>
            {topPlan.crop && (
              <p className="mt-1 text-slate-300">
                {topPlan.crop}{topPlan.stage ? ` · ${topPlan.stage}` : ''}
              </p>
            )}
            {topPlan.recommended_method && (
              <p className="mt-1 text-slate-400">Method: {topPlan.recommended_method}</p>
            )}
            {topPlan.daily_water_req_mm != null && (
              <p className="mt-1 text-slate-400">Estimated water need: {topPlan.daily_water_req_mm} mm/day</p>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            Recommendation only. This app does not read sensors or control irrigation equipment.
          </p>
        </section>
      )}

      {/* 2. SEARCH & WORKSPACE NAVIGATION TOOLBAR */}
      <div className="glass-panel rounded-xl p-2.5 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-2">
        {activeTab !== 'pump' && <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search Crop, Method, Equipment..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <select 
            value={cropFilter} 
            onChange={(e) => setCropFilter(e.target.value)}
            className="h-10 bg-black/60 border border-white/10 rounded-xl text-xs text-slate-200 px-3 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Crops</option>
            <option value="Rice">Rice Paddy</option>
            <option value="Tomato">Tomato</option>
            <option value="Maize">Maize Corn</option>
            <option value="Sugarcane">Sugarcane</option>
          </select>
        </div>}

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-1 w-full lg:w-auto overflow-x-auto">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 whitespace-nowrap">
            <button onClick={() => setActiveTab('pump')} title="Irrigation recommendations and manual time log" className={`px-2.5 py-1.5 rounded-md transition ${activeTab === 'pump' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              Overview
            </button>
            <button onClick={() => setActiveTab('calc')} title="Penman-Monteith ETc Calculator" className={`px-2.5 py-1.5 rounded-md transition ${activeTab === 'calc' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              Calculator
            </button>
            <button onClick={() => setActiveTab('methods')} title="Educational Irrigation Method Guides" className={`px-2.5 py-1.5 rounded-md transition ${activeTab === 'methods' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              Methods
            </button>
            <button onClick={() => setActiveTab('marketplace')} title="Irrigation equipment store" className={`px-2.5 py-1.5 rounded-md transition ${activeTab === 'marketplace' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              Store
            </button>
            <button onClick={() => setActiveTab('compare')} title="Side-by-Side Method Comparison" className={`px-2.5 py-1.5 rounded-md transition ${activeTab === 'compare' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* 3. WORKSPACE VIEWS */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" /> Loading AI Irrigation Intelligence Platform...
        </div>
      ) : activeTab === 'pump' ? (
        /* INTERACTIVE PUMP CONTROLLER & ANIMATED WATER FLOW CANVAS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-3">
            {/*
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 space-y-3">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" /> Live Soil Moisture Infiltration & Water Flow Canvas
              </h3>
              <SoilWaterCanvas isPumpRunning={isPumpRunning} />
            </div>
            */}

            {/* CROP IRRIGATION DECISION SCHEDULE CARDS */}
            {plans.length > 1 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 text-sm">Other crop plans</h4>
                {plans.filter(p => p.id !== topPlan.id).map((p) => (
                <div key={p.id} className="glass-panel rounded-lg p-3 border border-white/10 bg-black/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {p.crop} • {p.stage}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm mt-1">{p.irrigation_decision}</h4>
                    <p className="text-slate-300 text-xs mt-0.5">Method: <strong>{p.recommended_method}</strong> • Daily Need: <strong>{p.daily_water_req_mm} mm</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Water Savings</span>
                    <strong className="text-emerald-400 text-base font-bold">+{p.water_savings_pct}%</strong>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {/* INTERACTIVE PUMP CONTROLLER BOARD */}
          <div className="lg:col-span-5 glass-panel rounded-xl p-4 border border-white/10 space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">Irrigation time log</h3>
              <p className="text-[11px] text-slate-400">Record start and stop times manually. No equipment is controlled.</p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-300 font-bold">
                {isPumpRunning ? `Started ${formatPumpTime(activePumpSession.startedAt)}` : 'No active session'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPumpRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                {isPumpRunning ? 'In progress' : 'Stopped'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTogglePump}
              className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                isPumpRunning
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {isPumpRunning ? 'Log Stop Time' : 'Log Start Time'}
            </button>

            <div className="space-y-2 border-t border-white/10 pt-3">
              <h4 className="font-bold text-slate-200">Recent times</h4>
              {pumpSessions.length === 0 ? (
                <p className="text-slate-400">No pump sessions recorded yet.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {[...pumpSessions].reverse().map(session => (
                    <div key={session.id} className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1">
                      <p className="text-slate-300">Started: {formatPumpTime(session.startedAt)}</p>
                      <p className="text-slate-300">
                        Stopped: {session.stoppedAt ? formatPumpTime(session.stoppedAt) : 'In progress'}
                      </p>
                      {session.stoppedAt && (
                        <p className="text-slate-400">Duration: {formatPumpDuration(session.startedAt, session.stoppedAt)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'calc' ? (
        /* PENMAN-MONTEITH ETc CALCULATOR VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-cyan-500/40 space-y-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" /> Penman-Monteith ETc Evapotranspiration Calculator
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Crop Variety</label>
                <select value={calcCrop} onChange={(e) => setCalcCrop(e.target.value)} className="w-full h-10 bg-black/80 border border-white/10 rounded-xl px-3 text-slate-200">
                  <option value="Rice Paddy">Rice Paddy</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Maize Corn">Maize Corn</option>
                  <option value="Sugarcane">Sugarcane</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Field Size (Acres)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  value={calcAcreage} 
                  onChange={(e) => setCalcAcreage(parseFloat(e.target.value) || 1.0)} 
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none" 
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Growth Stage</label>
                <select value={calcStage} onChange={(e) => setCalcStage(e.target.value)} className="w-full h-10 bg-black/80 border border-white/10 rounded-xl px-3 text-slate-200">
                  <option value="Tillering">Tillering (Kc 1.15)</option>
                  <option value="Flowering">Flowering (Kc 1.25)</option>
                  <option value="Grand Growth">Grand Growth (Kc 1.30)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Temp (°C)</label>
                  <input type="number" value={calcTemp} onChange={(e) => setCalcTemp(parseFloat(e.target.value))} className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2 text-slate-200" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Humidity (%)</label>
                  <input type="number" value={calcHumidity} onChange={(e) => setCalcHumidity(parseFloat(e.target.value))} className="w-full h-9 bg-white/5 border border-white/10 rounded-lg px-2 text-slate-200" />
                </div>
              </div>

              <button 
                onClick={handleRunEtcCalculator}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
              >
                Calculate Daily ETc & Pump Runtime
              </button>
            </div>
          </div>

          {/* CALCULATOR OUTPUT BOARD */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-400" /> Prescribed Daily Water Need & Runtime
            </h3>

            {etcResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Daily ETc Rate</span>
                    <strong className="text-lg font-extrabold text-cyan-400">{etcResult.climate_metrics.etc_crop_evapotranspiration_mm_day} mm/day</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Daily Water Need</span>
                    <strong className="text-lg font-extrabold text-emerald-400">{etcResult.water_requirements.daily_liters_per_acre} L/acre</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-slate-400 block">Pump Runtime</span>
                    <strong className="text-lg font-extrabold text-amber-300">{etcResult.water_requirements.recommended_pump_runtime_mins} Mins</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <h4 className="font-bold text-cyan-300 text-xs">Penman-Monteith Calculation Breakdown:</h4>
                  <p className="text-slate-300">☀️ <strong>Reference ETo:</strong> {etcResult.climate_metrics.eto_reference_mm_day} mm/day</p>
                  <p className="text-slate-300">🌿 <strong>Crop Factor (Kc):</strong> {etcResult.climate_metrics.kc_crop_factor}</p>
                  <p className="text-slate-300">⏰ <strong>Optimal Start Time:</strong> {etcResult.water_requirements.recommended_start_time}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'methods' ? (
        /* EDUCATIONAL IRRIGATION METHOD GUIDES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((m) => (
            <div key={m.id} className="glass-panel rounded-2xl border border-white/10 p-4 space-y-3 bg-black/40">
              <img src={m.image_url} alt={m.name} className="w-full h-36 rounded-xl object-cover border border-white/10" />
              <h4 className="font-extrabold text-slate-100 text-sm">{m.name}</h4>
              <p className="text-cyan-300">Water Efficiency: <strong>{m.efficiency_pct}%</strong></p>
              <p className="text-amber-300">Installation Cost: <strong>₹{m.installation_cost_inr_acre}/acre</strong></p>
              <p className="text-slate-300 text-[11px]"><strong>Pros:</strong> {m.pros}</p>
            </div>
          ))}
        </div>
      ) : activeTab === 'marketplace' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400" /> Irrigation Equipment
            </h3>
          </div>
          <LocalProductStore products={marketplace} kind="equipment" />
        </div>
      ) : activeTab === 'compare' ? (
        /* SIDE-BY-SIDE METHOD COMPARISON */
        <div className="glass-panel rounded-2xl p-6 border border-cyan-500/40 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" /> Side-by-Side Irrigation Method Comparison (Method A vs B)
            </h3>
            <div className="flex items-center gap-3">
              <select value={compareIdA} onChange={(e) => setCompareIdA(e.target.value)} className="bg-black/80 border border-cyan-500/50 text-cyan-300 text-xs rounded-xl px-2 py-1">
                {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <span className="text-slate-400 font-bold">VS</span>
              <select value={compareIdB} onChange={(e) => setCompareIdB(e.target.value)} className="bg-black/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl px-2 py-1">
                {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {comparisonData && comparisonData.method_a && comparisonData.method_b && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                <h4 className="font-extrabold text-cyan-300 text-sm">{comparisonData.method_a.name}</h4>
                <p className="text-slate-300">Water Efficiency: <strong>{comparisonData.method_a.efficiency_pct}%</strong></p>
                <p className="text-slate-300">Installation Cost: <strong>₹{comparisonData.method_a.installation_cost_inr_acre}/acre</strong></p>
                <p className="text-slate-300">Water Saving: <strong>+{comparisonData.method_a.water_saving_pct}%</strong></p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <h4 className="font-extrabold text-emerald-300 text-sm">{comparisonData.method_b.name}</h4>
                <p className="text-slate-300">Water Efficiency: <strong>{comparisonData.method_b.efficiency_pct}%</strong></p>
                <p className="text-slate-300">Installation Cost: <strong>₹{comparisonData.method_b.installation_cost_inr_acre}/acre</strong></p>
                <p className="text-slate-300">Water Saving: <strong>+{comparisonData.method_b.water_saving_pct}%</strong></p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {activeTab !== 'pump' && (
        <button 
          onClick={() => setShowFloatingAI(!showFloatingAI)}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-white/20"
        >
          <Sparkles className="w-5 h-5" />
          <span className="hidden sm:inline">AI Irrigation Advisor</span>
        </button>
      )}

      {/* FLOATING AI CHAT WINDOW */}
      {activeTab !== 'pump' && showFloatingAI && (
        <div className="fixed bottom-20 right-6 z-50 w-96 glass-panel rounded-2xl p-4 border border-cyan-500/50 bg-slate-950/95 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-cyan-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> AI Irrigation Advisor (Ollama Qwen)
            </span>
            <button onClick={() => setShowFloatingAI(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {advisorMessages.map((msg, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl ${msg.sender === 'user' ? 'bg-cyan-500/10 text-cyan-200 border border-cyan-500/30' : 'bg-white/5 text-slate-200 border border-white/10'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ask irrigation advisor..." 
              value={advisorPrompt}
              onChange={(e) => setAdvisorPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAdvisorChat()}
              className="flex-1 h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
            />
            <button onClick={handleSendAdvisorChat} className="px-3 h-8 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 text-xs">Send</button>
          </div>
        </div>
      )}

    </div>
  );
};
