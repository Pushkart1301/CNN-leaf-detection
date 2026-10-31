import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Activity, Layers, Grid, List, Calendar, MapPin, Search, Plus, Filter,
  Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp,
  Download, FileText, Share2, RefreshCw, Eye, Star, Pin, Sliders, CheckSquare, MessageSquare,
  Droplets, Thermometer, ShieldCheck, Database, Award, Zap, BarChart3, HelpCircle, Compass, ShoppingCart, Calculator, Check
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import { LocalProductStore } from '../ui/LocalProductStore';
import {
  fetchFertilizerRecommendations, calculateNpkDose, compareFertilizers,
  fetchNearbyFertilizerDealers, queryFertilizerAdvisor
} from '../../services/fertilizerService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const FIELD_CROPS_STORAGE_KEY = 'agriverse-my-field-crops';
const FIELD_CROPS_UPDATED_EVENT = 'agriverse-field-crops-updated';

const loadFieldCrops = () => {
  try {
    const saved = window.localStorage.getItem(FIELD_CROPS_STORAGE_KEY);
    const crops = saved ? JSON.parse(saved) : [];
    return Array.isArray(crops)
      ? crops.filter(crop => (
        crop &&
        typeof crop.id === 'string' &&
        typeof crop.name === 'string' &&
        Number.isFinite(crop.area) &&
        (crop.areaUnit === 'acre' || crop.areaUnit === 'hectare')
      ))
      : [];
  } catch (error) {
    console.warn('Could not load saved field crops for fertilizer planning:', error);
    return [];
  }
};

const getAreaInAcres = crop => crop.areaUnit === 'hectare'
  ? Number((crop.area * 2.47105).toFixed(2))
  : crop.area;

const getPlantingLabel = crop => {
  if (!crop.plantedMonth) return '';
  const [year, month] = crop.plantedMonth.split('-').map(Number);
  return Number.isInteger(year) && Number.isInteger(month)
    ? new Date(year, month - 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : '';
};

export const FertilizerPlannerTab = () => {
  // View Switcher State ('calc' | 'shopping' | 'gantt' | 'compare' | 'dealers')
  const [activeTab, setActiveTab] = useState('calc'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [fieldCrops, setFieldCrops] = useState(loadFieldCrops);
  const [selectedFieldCropId, setSelectedFieldCropId] = useState(() => loadFieldCrops()[0]?.id || '');
  const initialFieldCrop = fieldCrops.find(crop => crop.id === selectedFieldCropId);

  // Interactive Calculator State
  const [calcCrop, setCalcCrop] = useState(initialFieldCrop?.name || '');
  const [calcAcreage, setCalcAcreage] = useState(initialFieldCrop ? getAreaInAcres(initialFieldCrop) : '');
  const [calcYieldTarget, setCalcYieldTarget] = useState(6.5);
  const [calcResult, setCalcResult] = useState(null);
  const [calcSuccessBanner, setCalcSuccessBanner] = useState(false);

  // Data State
  const [fertilizers, setFertilizers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Side-by-Side Comparison State
  const [compareIdA, setCompareIdA] = useState('FERT-2026-001');
  const [compareIdB, setCompareIdB] = useState('FERT-2026-002');
  const [comparisonData, setComparisonData] = useState(null);

  // Dealers State
  const [dealers, setDealers] = useState([]);

  // Floating AI State
  const [showFloatingAI, setShowFloatingAI] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState([
    { sender: 'ai', text: 'Greetings! I am your AI Fertilizer & Plant Nutrition Specialist (powered by Ollama qwen:latest). Ask me to calculate your NPK dose, find government subsidies, or recommend foliar sprays!' }
  ]);

  useEffect(() => {
    loadFertilizers();
    loadDealers();
  }, [searchQuery, cropFilter]);

  useEffect(() => {
    const refreshFieldCrops = () => setFieldCrops(loadFieldCrops());
    window.addEventListener('storage', refreshFieldCrops);
    window.addEventListener(FIELD_CROPS_UPDATED_EVENT, refreshFieldCrops);
    return () => {
      window.removeEventListener('storage', refreshFieldCrops);
      window.removeEventListener(FIELD_CROPS_UPDATED_EVENT, refreshFieldCrops);
    };
  }, []);

  useEffect(() => {
    const selectedCrop = fieldCrops.find(crop => crop.id === selectedFieldCropId);
    if (selectedCrop) {
      setCalcCrop(selectedCrop.name);
      setCalcAcreage(getAreaInAcres(selectedCrop));
      return;
    }

    const firstCrop = fieldCrops[0];
    if (firstCrop) {
      setSelectedFieldCropId(firstCrop.id);
      setCalcCrop(firstCrop.name);
      setCalcAcreage(getAreaInAcres(firstCrop));
    } else {
      setSelectedFieldCropId('');
      setCalcCrop('');
      setCalcAcreage('');
      setCalcResult(null);
    }
  }, [fieldCrops, selectedFieldCropId]);

  useEffect(() => {
    if (calcCrop && Number(calcAcreage) > 0) {
      runCalculatorQuietly();
    } else {
      setCalcResult(null);
    }
  }, [calcCrop, calcAcreage, calcYieldTarget]);

  useEffect(() => {
    if (activeTab === 'compare') {
      loadComparison();
    }
  }, [activeTab, compareIdA, compareIdB]);

  const loadFertilizers = async () => {
    setLoading(true);
    const res = await fetchFertilizerRecommendations(cropFilter, 'ALL', searchQuery);
    setFertilizers(res);
    setLoading(false);
  };

  const loadComparison = async () => {
    const res = await compareFertilizers(compareIdA, compareIdB);
    setComparisonData(res);
  };

  const loadDealers = async () => {
    const res = await fetchNearbyFertilizerDealers();
    setDealers(res);
  };

  const runCalculatorQuietly = async () => {
    if (!calcCrop || Number(calcAcreage) <= 0) return;
    const res = await calculateNpkDose(calcCrop, calcAcreage, calcYieldTarget);
    setCalcResult(res);
  };

  const handleRunCalculator = async (e) => {
    if (e) e.preventDefault();
    if (!calcCrop || Number(calcAcreage) <= 0) return;
    const res = await calculateNpkDose(calcCrop, calcAcreage, calcYieldTarget);
    setCalcResult(res);
    setCalcSuccessBanner(true);
    setTimeout(() => setCalcSuccessBanner(false), 4000);
  };

  const handleSendAdvisorChat = async () => {
    if (!advisorPrompt.trim()) return;
    const userMsg = { sender: 'user', text: advisorPrompt };
    setAdvisorMessages(prev => [...prev, userMsg]);
    const promptCopy = advisorPrompt;
    setAdvisorPrompt('');

    const contextText = `Crop: ${calcCrop}, Acreage: ${calcAcreage} Acres, Calc Result Payable: ₹${calcResult?.financial_summary?.farmer_payable_cost_inr}`;
    const aiResp = await queryFertilizerAdvisor(promptCopy, contextText);
    setAdvisorMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const handleExportPDF = () => {
    if (!calcResult) return;
    exportPDFReport(
      `AI Fertilizer Plan & NPK Schedule - ${calcCrop}`,
      `Crop: ${calcCrop}\nAcreage: ${calcAcreage} Acres\nTarget Yield: ${calcYieldTarget} t/ha\n\nDOSAGE SCHEDULE:\n- Basal: ${calcResult.dosage_schedule.basal_dose}\n- Tillering: ${calcResult.dosage_schedule.tillering_dose}\n- Panicle: ${calcResult.dosage_schedule.panicle_dose}\n\nBAGS REQUIRED:\n- Neem Coated Urea: ${calcResult.bags_required.neem_coated_urea_45kg_bags} Bags\n- DAP: ${calcResult.bags_required.dap_50kg_bags} Bags\n- MOP: ${calcResult.bags_required.mop_50kg_bags} Bags\n\nCOST & SUBSIDY:\n- Farmer Payable: ₹${calcResult.financial_summary.farmer_payable_cost_inr}\n- Government Subsidy: ₹${calcResult.financial_summary.government_subsidy_value_inr}`,
      [{ title: "Target Yield", value: `${calcYieldTarget} t/ha` }, { title: "Net ROI Boost", value: "+18.5%" }]
    );
  };

  const formatAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—';
  };

  const formatRupees = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
      : '—';
  };

  const handleFieldCropChange = (event) => {
    const crop = fieldCrops.find(item => item.id === event.target.value);
    if (!crop) return;
    setSelectedFieldCropId(crop.id);
    setCalcCrop(crop.name);
    setCalcAcreage(getAreaInAcres(crop));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-mono text-xs relative">
      <AIBadgePanel 
        tabId="fertilizer-planner" 
        tabName="AI Fertilizer Planning, NPK Calculator & Official E-Commerce Marketplace Platform" 
        defaultPrompt="Calculate precise stage-wise NPK fertilizer dosage, government subsidy, and buy online from official stores." 
      />

      {/* Current calculator inputs and outputs; explicitly estimates, not live farm readings. */}
      <section className="glass-panel rounded-xl border border-emerald-500/30 bg-slate-950/70 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-emerald-300">Fertilizer plan · estimate</p>
            <h2 className="mt-1 text-lg font-bold text-slate-100">{calcCrop || 'No field crop selected'}</h2>
            <p className="mt-1 text-slate-400">
              {formatAmount(calcAcreage)} acres · Target yield {formatAmount(calcYieldTarget)} t/ha
            </p>
          </div>
          <button 
            onClick={handleExportPDF}
            disabled={!calcResult}
            className="self-start px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 hover:bg-emerald-400 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Download plan
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-[10px] text-slate-400 block">Urea · 45 kg bags</span>
            <strong className="mt-1 block text-sm text-slate-100">
              {formatAmount(calcResult?.bags_required?.neem_coated_urea_45kg_bags)}
            </strong>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-[10px] text-slate-400 block">DAP · 50 kg bags</span>
            <strong className="mt-1 block text-sm text-slate-100">
              {formatAmount(calcResult?.bags_required?.dap_50kg_bags)}
            </strong>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-[10px] text-slate-400 block">MOP · 50 kg bags</span>
            <strong className="mt-1 block text-sm text-slate-100">
              {formatAmount(calcResult?.bags_required?.mop_50kg_bags)}
            </strong>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-[10px] text-slate-400 block">Estimated input cost</span>
            <strong className="mt-1 block text-sm text-amber-300">
              {formatRupees(calcResult?.financial_summary?.farmer_payable_cost_inr)}
            </strong>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-3">
            <span className="text-[10px] text-slate-400 block">Indicative subsidy</span>
            <strong className="mt-1 block text-sm text-cyan-300">
              {formatRupees(calcResult?.financial_summary?.government_subsidy_value_inr)}
            </strong>
          </div>
        </div>
        <p className="text-[10px] text-slate-500">
          Planning estimate only, calculated from the selected area using preset rates and prices. It does not use a soil test, live market prices, or verified subsidy eligibility.
        </p>
      </section>

      {/* 2. SEARCH & WORKSPACE NAVIGATION TOOLBAR */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search Fertilizer, Brand, NPK Ratio..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <select 
            value={cropFilter} 
            onChange={(e) => setCropFilter(e.target.value)}
            className="h-10 bg-black/60 border border-white/10 rounded-xl text-xs text-slate-200 px-3 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Crops</option>
            <option value="Rice">Rice Paddy</option>
            <option value="Tomato">Tomato</option>
            <option value="Wheat">Wheat</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Cotton">Cotton</option>
          </select>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('calc')} title="Interactive NPK & Dose Calculator" className={`p-1.5 rounded-lg transition ${activeTab === 'calc' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Calculator className="w-4 h-4 inline mr-1" /> Dose Calculator
            </button>
            <button onClick={() => setActiveTab('shopping')} title="Official E-Commerce Shopping Panel" className={`p-1.5 rounded-lg transition ${activeTab === 'shopping' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <ShoppingCart className="w-4 h-4 inline mr-1" /> Direct Buy Online
            </button>
            <button onClick={() => setActiveTab('gantt')} title="Stage-wise Application Gantt Timeline" className={`p-1.5 rounded-lg transition ${activeTab === 'gantt' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Calendar className="w-4 h-4 inline mr-1" /> Application Gantt
            </button>
            <button onClick={() => setActiveTab('compare')} title="Side-by-Side Fertilizer Comparison" className={`p-1.5 rounded-lg transition ${activeTab === 'compare' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <Sliders className="w-4 h-4 inline mr-1" /> Compare
            </button>
            <button onClick={() => setActiveTab('dealers')} title="Nearby Fertilizer Dealers & IFFCO Depots" className={`p-1.5 rounded-lg transition ${activeTab === 'dealers' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
              <MapPin className="w-4 h-4 inline mr-1" /> Dealers
            </button>
          </div>
        </div>
      </div>

      {/* 3. WORKSPACE VIEWS */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Loading AI Fertilizer Intelligence Platform...
        </div>
      ) : activeTab === 'calc' ? (
        /* INTERACTIVE NPK & DOSE CALCULATOR VIEW */
        <div className="space-y-6">
          {calcSuccessBanner && (
            <div className="glass-panel rounded-xl p-3 border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>NPK Dose Calculated & Updated for {calcAcreage} Acres ({calcCrop})!</span>
              </div>
              <span className="text-[10px] text-slate-400">Total Payable: ₹{calcResult?.financial_summary?.farmer_payable_cost_inr}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CALCULATOR INPUT FORM */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-4">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" /> Interactive NPK Dose Calculator
              </h3>

              <form onSubmit={handleRunCalculator} className="space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Crop in your field</label>
                  <select
                    value={selectedFieldCropId}
                    onChange={handleFieldCropChange}
                    disabled={fieldCrops.length === 0}
                    className="w-full h-10 bg-black/80 border border-white/10 rounded-xl px-3 text-slate-200 disabled:opacity-60"
                  >
                    {fieldCrops.length === 0 ? (
                      <option value="">Add a crop first</option>
                    ) : (
                      fieldCrops.map(crop => {
                        const plantedLabel = getPlantingLabel(crop);
                        return (
                          <option key={crop.id} value={crop.id}>
                            {crop.name}{plantedLabel ? ` · ${plantedLabel}` : ''} · {crop.area} {crop.areaUnit}
                          </option>
                        );
                      })
                    )}
                  </select>
                  {fieldCrops.length === 0 && (
                    <p className="mt-1 text-[10px] text-amber-300">
                      Add a crop in My Field Crops to calculate its fertilizer plan.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Field Size (Acres)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={calcAcreage} 
                    onChange={(e) => setCalcAcreage(e.target.value === '' ? '' : Number(e.target.value))} 
                    disabled={!calcCrop}
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none focus:border-emerald-500" 
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Target Yield (t/ha)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    value={calcYieldTarget} 
                    onChange={(e) => setCalcYieldTarget(parseFloat(e.target.value) || 6.0)} 
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none focus:border-emerald-500" 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold hover:opacity-90 transition shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" /> Calculate NPK Bag Requirements
                </button>
              </form>
            </div>

            {/* CALCULATOR OUTPUT BOARD */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-400" /> Prescribed Fertilizer Bags & Cost Summary
              </h3>

              {calcResult && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block">Neem Coated Urea (45kg)</span>
                      <strong className="text-lg font-extrabold text-emerald-400">{calcResult.bags_required.neem_coated_urea_45kg_bags} Bags</strong>
                      <a href="https://www.iffcoebazar.in/" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-cyan-400 hover:underline pt-1">
                        Buy Online 🛒
                      </a>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block">DAP (50kg)</span>
                      <strong className="text-lg font-extrabold text-cyan-300">{calcResult.bags_required.dap_50kg_bags} Bags</strong>
                      <a href="https://www.bighaat.com/search?q=dap" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-cyan-400 hover:underline pt-1">
                        Buy Online 🛒
                      </a>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <span className="text-[10px] text-slate-400 block">MOP (50kg)</span>
                      <strong className="text-lg font-extrabold text-amber-300">{calcResult.bags_required.mop_50kg_bags} Bags</strong>
                      <a href="https://www.iffcoebazar.in/" target="_blank" rel="noopener noreferrer" className="block text-[10px] text-cyan-400 hover:underline pt-1">
                        Buy Online 🛒
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <h4 className="font-bold text-emerald-300 text-xs">Stage-wise Fertigation Dosage Plan:</h4>
                    <p className="text-slate-300">🌱 <strong>Basal (Sowing):</strong> {calcResult.dosage_schedule.basal_dose}</p>
                    <p className="text-slate-300">🌿 <strong>Tillering (Day 21):</strong> {calcResult.dosage_schedule.tillering_dose}</p>
                    <p className="text-slate-300">🌾 <strong>Panicle (Day 45):</strong> {calcResult.dosage_schedule.panicle_dose}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-black/60 border border-white/10">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Farmer Payable Price</span>
                      <strong className="text-emerald-400 text-base font-bold">₹{calcResult.financial_summary.farmer_payable_cost_inr}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Government Subsidy Savings</span>
                      <strong className="text-indigo-300 text-base font-bold">₹{calcResult.financial_summary.government_subsidy_value_inr}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DIRECT E-COMMERCE BUY SECTION RIGHT ON CALCULATOR VIEW */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" /> Fertilizer Store
              </h3>
            </div>
            <LocalProductStore products={fertilizers} kind="fertilizer" />
          </div>
        </div>
      ) : activeTab === 'shopping' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-400" /> Fertilizer Store
            </h3>
          </div>
          <LocalProductStore products={fertilizers} kind="fertilizer" />
        </div>
      ) : activeTab === 'gantt' ? (
        /* STAGE-WISE APPLICATION GANTT TIMELINE */
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> Crop Growth Stage Application Gantt Schedule
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">Stage 1: Basal Sowing (Day 0)</span>
                <p className="text-slate-300 mt-1">DAP 1.1 Bags + MOP 0.4 Bags incorporated into root zone during land prep.</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">COMPLETED</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 flex items-center justify-between">
              <div>
                <span className="text-amber-300 font-bold">Stage 2: Active Tillering (Day 21 - CURRENT)</span>
                <p className="text-slate-300 mt-1">Neem Coated Urea 0.8 Bags + Zinc Sulphate 10kg top dressing scheduled.</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">DUE IN 2 DAYS</span>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-cyan-300 font-bold">Stage 3: Panicle Initiation (Day 45)</span>
                <p className="text-slate-300 mt-1">Neem Coated Urea 0.8 Bags + MOP 0.4 Bags + Foliar NPK 19-19-19 spray (5g/L).</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">SCHEDULED</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'compare' ? (
        /* SIDE-BY-SIDE FERTILIZER COMPARISON */
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" /> Side-by-Side Fertilizer Comparison (Fertilizer A vs B)
            </h3>
            <div className="flex items-center gap-3">
              <select value={compareIdA} onChange={(e) => setCompareIdA(e.target.value)} className="bg-black/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl px-2 py-1">
                {fertilizers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <span className="text-slate-400 font-bold">VS</span>
              <select value={compareIdB} onChange={(e) => setCompareIdB(e.target.value)} className="bg-black/80 border border-cyan-500/50 text-cyan-300 text-xs rounded-xl px-2 py-1">
                {fertilizers.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>

          {comparisonData && comparisonData.fertilizer_a && comparisonData.fertilizer_b && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <h4 className="font-extrabold text-emerald-300 text-sm">{comparisonData.fertilizer_a.name}</h4>
                <p className="text-slate-300">Brand: <strong>{comparisonData.fertilizer_a.brand}</strong></p>
                <p className="text-slate-300">NPK Ratio: <strong>{comparisonData.fertilizer_a.npk_ratio}</strong></p>
                <p className="text-slate-300">Price: <strong>₹{comparisonData.fertilizer_a.price_per_bag_inr}/bag</strong></p>
                <p className="text-slate-300">Subsidy: <strong>₹{comparisonData.fertilizer_a.subsidy_amount_inr} OFF</strong></p>
                <p className="text-slate-300">AI Score: <strong className="text-emerald-400">{comparisonData.fertilizer_a.ai_score}%</strong></p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                <h4 className="font-extrabold text-cyan-300 text-sm">{comparisonData.fertilizer_b.name}</h4>
                <p className="text-slate-300">Brand: <strong>{comparisonData.fertilizer_b.brand}</strong></p>
                <p className="text-slate-300">NPK Ratio: <strong>{comparisonData.fertilizer_b.npk_ratio}</strong></p>
                <p className="text-slate-300">Price: <strong>₹{comparisonData.fertilizer_b.price_per_bag_inr}/bag</strong></p>
                <p className="text-slate-300">Subsidy: <strong>₹{comparisonData.fertilizer_b.subsidy_amount_inr} OFF</strong></p>
                <p className="text-slate-300">AI Score: <strong className="text-cyan-400">{comparisonData.fertilizer_b.ai_score}%</strong></p>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'dealers' ? (
        /* NEARBY FERTILIZER DEALERS & IFFCO DEPOTS */
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Nearby Certified Fertilizer Dealers & IFFCO PACS Depots
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealers.map((d, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-300 text-xs">{d.dealer_name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{d.stock_status}</span>
                </div>
                <p className="text-slate-300">📍 Location: {d.address} ({d.distance_km} km)</p>
                <p className="text-slate-400">📞 Phone: {d.phone}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* FLOATING AI FERTILIZER ADVISOR TOGGLE BUTTON */}
      <button 
        onClick={() => setShowFloatingAI(!showFloatingAI)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-white/20"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline">AI Fertilizer Advisor</span>
      </button>

      {/* FLOATING AI FERTILIZER ADVISOR CHAT WINDOW */}
      {showFloatingAI && (
        <div className="fixed bottom-20 right-6 z-50 w-96 glass-panel rounded-2xl p-4 border border-emerald-500/50 bg-slate-950/95 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> AI Fertilizer Advisor (Ollama Qwen)
            </span>
            <button onClick={() => setShowFloatingAI(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {advisorMessages.map((msg, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl ${msg.sender === 'user' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30' : 'bg-white/5 text-slate-200 border border-white/10'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ask fertilizer advisor..." 
              value={advisorPrompt}
              onChange={(e) => setAdvisorPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAdvisorChat()}
              className="flex-1 h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
            />
            <button onClick={handleSendAdvisorChat} className="px-3 h-8 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 text-xs">Send</button>
          </div>
        </div>
      )}

    </div>
  );
};
