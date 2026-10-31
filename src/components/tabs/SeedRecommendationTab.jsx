import React, { useState, useEffect } from 'react';
import {
  Sprout, Activity, Layers, Grid, List, Calendar, MapPin, Search, Plus, Filter,
  Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp,
  Download, FileText, Share2, RefreshCw, Eye, Star, Pin, Sliders, CheckSquare, MessageSquare,
  Droplets, Thermometer, ShieldCheck, Database, Award, Zap, BarChart3, HelpCircle, Compass, Map
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import {
  fetchSeedRecommendations, fetchSeedCatalog, fetchSeedById, compareSeedVarieties,
  fetchNearbySeedDealers, querySeedAdvisor
} from '../../services/seedService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const SEED_CROP_PHOTOS = [
  {
    match: ['rice', 'paddy'],
    alt: 'Rice plants growing in a paddy field',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0a/20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg/960px-20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg',
    source: 'https://en.wikipedia.org/wiki/File:20201102.Hengnan.Hybrid_rice_Sanyou-1.6.jpg'
  },
  {
    match: ['tomato'],
    alt: 'Fresh tomatoes growing on a plant',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Tomato_je.jpg/960px-Tomato_je.jpg',
    source: 'https://en.wikipedia.org/wiki/File:Tomato_je.jpg'
  },
  {
    match: ['sugarcane', 'sugar cane'],
    alt: 'Sugarcane growing in a field in Karnataka, India',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg/960px-Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg'
  },
  {
    match: ['maize', 'corn'],
    alt: 'Maize growing in a field',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bd/Corn_field_in_Mexico.jpg/960px-Corn_field_in_Mexico.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Corn_field_in_Mexico.jpg'
  },
  {
    match: ['cotton'],
    alt: 'Cotton plant growing in a field',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/68/CottonPlant.JPG/960px-CottonPlant.JPG',
    source: 'https://en.wikipedia.org/wiki/File:CottonPlant.JPG'
  },
  {
    match: ['groundnut', 'peanut'],
    alt: 'Groundnut plants growing on a farm',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Groundnuts_farm.jpg/960px-Groundnuts_farm.jpg',
    source: 'https://commons.wikimedia.org/wiki/File:Groundnuts_farm.jpg'
  },
  {
    match: ['millet', 'ragi'],
    alt: 'Millet crop growing in a field',
    image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f0/Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg/960px-Grain_millet%2C_early_grain_fill%2C_Tifton%2C_7-3-02.jpg',
    source: 'https://en.wikipedia.org/wiki/File:Grain_millet,_early_grain_fill,_Tifton,_7-3-02.jpg'
  }
];

const SeedCropImage = ({ crop }) => {
  const cropName = String(crop || '').toLowerCase();
  const photo = SEED_CROP_PHOTOS.find(({ match }) => match.some(name => cropName.includes(name)));

  if (!photo) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900 text-sm text-slate-400">
        Photo unavailable
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <img
        src={photo.image}
        alt={photo.alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
          event.currentTarget.parentElement.classList.add('bg-slate-900');
        }}
      />
      <a
        href={photo.source}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 right-2 rounded bg-slate-950/80 px-2 py-1 text-[9px] text-slate-200 hover:text-emerald-300"
      >
        Photo source
      </a>
    </div>
  );
};

export const SeedRecommendationTab = () => {
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState('top_ai'); // 'top_ai' | 'catalog' | 'compare' | 'rotation' | 'dealers'
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [soilFilter, setSoilFilter] = useState('ALL');
  const [seasonFilter, setSeasonFilter] = useState('ALL');

  // Data State
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeedId, setSelectedSeedId] = useState('SEED-2026-001');
  const [seedDetails, setSeedDetails] = useState(null);

  // Side-by-Side Comparison State
  const [compareIdA, setCompareIdA] = useState('SEED-2026-001');
  const [compareIdB, setCompareIdB] = useState('SEED-2026-002');
  const [comparisonData, setComparisonData] = useState(null);

  // Dealers State
  const [dealers, setDealers] = useState([]);

  // Floating AI State
  const [showFloatingAI, setShowFloatingAI] = useState(false);
  const [advisorPrompt, setAdvisorPrompt] = useState('');
  const [advisorMessages, setAdvisorMessages] = useState([
    { sender: 'ai', text: 'Greetings! I am your AI Seed Recommendation Advisor (powered by Ollama qwen:latest). Ask me why a seed variety matches your soil & climate, expected yield, or market demand ROI!' }
  ]);

  useEffect(() => {
    loadSeeds();
    loadDealers();
  }, [searchQuery, cropFilter, soilFilter, seasonFilter]);

  useEffect(() => {
    if (selectedSeedId) {
      loadSeedDetails(selectedSeedId);
    }
  }, [selectedSeedId]);

  useEffect(() => {
    if (activeTab === 'compare') {
      loadComparison();
    }
  }, [activeTab, compareIdA, compareIdB]);

  const loadSeeds = async () => {
    setLoading(true);
    const res = await fetchSeedRecommendations(cropFilter, soilFilter, seasonFilter, searchQuery);
    setSeeds(res);
    setLoading(false);
    if (res.length > 0 && !selectedSeedId) {
      setSelectedSeedId(res[0].seed_id);
    }
  };

  const loadSeedDetails = async (id) => {
    const res = await fetchSeedById(id);
    setSeedDetails(res);
  };

  const loadComparison = async () => {
    const res = await compareSeedVarieties(compareIdA, compareIdB);
    setComparisonData(res);
  };

  const loadDealers = async () => {
    const res = await fetchNearbySeedDealers();
    setDealers(res);
  };

  const handleSendAdvisorChat = async () => {
    if (!advisorPrompt.trim()) return;
    const userMsg = { sender: 'user', text: advisorPrompt };
    setAdvisorMessages(prev => [...prev, userMsg]);
    const promptCopy = advisorPrompt;
    setAdvisorPrompt('');

    const contextText = `Top Seed: ${selectedSeedId}, Variety: ${seedDetails?.seed_name}, Match Score: ${seedDetails?.ai_match_score}%, Soil: ${seedDetails?.suitable_soil}`;
    const aiResp = await querySeedAdvisor(promptCopy, contextText);
    setAdvisorMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const handleExportPDF = () => {
    if (!seedDetails) return;
    exportPDFReport(
      `AI Seed Recommendation Dossier - ${seedDetails.seed_id}`,
      `Seed Name: ${seedDetails.seed_name}\nCompany: ${seedDetails.company}\nCrop: ${seedDetails.crop} (${seedDetails.variety})\nSeason: ${seedDetails.season}\nGrowth Duration: ${seedDetails.growth_duration_days} Days\nYield Potential: ${seedDetails.yield_potential_t_ha} t/ha\nSuitable Soil: ${seedDetails.suitable_soil}\nDisease Resistance: ${seedDetails.disease_resistance}\nPrice: ₹${seedDetails.price_per_kg_inr}/kg\nAI Match Score: ${seedDetails.ai_match_score}%\nAI Reasoning: ${seedDetails.reasoning}`,
      [{ title: "AI Suitability Score", value: `${seedDetails.ai_match_score}%` }, { title: "Yield Potential", value: `${seedDetails.yield_potential_t_ha} t/ha` }]
    );
  };

  const topSeed = seedDetails || seeds[0] || {};
  const totalVarieties = seeds.length;
  const topScore = (topSeed.ai_match_score || 98.4).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-xs relative">
      <AIBadgePanel 
        tabId="seed-recommendation" 
        tabName="AI Seed Variety Recommendation & Genetic Matching Platform" 
        defaultPrompt="Match soil pH, NPK, weather forecast, water availability, and market demand to find the highest-yielding seed variety." 
      />

      {/* 1. HERO BANNER */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-black space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                RECOMMENDED VARIETY • {topSeed.seed_id || 'SEED-2026-001'}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Government Certified
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100">{topSeed.seed_name || 'Rice Paddy (ADT-43)'}</h2>
            <p className="text-xs text-slate-300">
              🏢 Breeder: <strong className="text-amber-300">{topSeed.company}</strong> • 
              Season: <strong className="text-cyan-300">{topSeed.season}</strong> • 
              Duration: <strong className="text-emerald-300">{topSeed.growth_duration_days} Days</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">AI Suitability Score</span>
              <strong className="text-2xl font-black text-emerald-400">{topScore}%</strong>
            </div>
            <button 
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:opacity-90"
            >
              <Download className="w-4 h-4" /> Seed Dossier (PDF)
            </button>
          </div>
        </div>

        {/* HERO KPI CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Total Seed Varieties</span>
              <strong className="text-sm font-bold text-slate-100">{totalVarieties}</strong>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Yield Potential</span>
              <strong className="text-sm font-bold text-cyan-300">{topSeed.yield_potential_t_ha || 6.2} t/ha</strong>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Est. Net Income</span>
              <strong className="text-sm font-bold text-amber-300">₹78,500/acre</strong>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Water Need</span>
              <strong className="text-sm font-bold text-cyan-300">Medium</strong>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Disease Resistance</span>
              <strong className="text-sm font-bold text-emerald-400">High (Blast)</strong>
            </div>
          </div>
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 flex items-center gap-2.5">
            <Award className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] text-slate-400 block">Government Subsidy</span>
              <strong className="text-sm font-bold text-indigo-300">50% Eligible</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & WORKSPACE NAVIGATION TOOLBAR */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search Seed Name, Crop, Variety..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Crop Filter */}
          <select 
            value={cropFilter} 
            onChange={(e) => setCropFilter(e.target.value)}
            className="h-10 bg-black/60 border border-white/10 rounded-xl text-xs text-slate-200 px-3 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All Crops</option>
            <option value="Rice (Paddy)">Rice Paddy</option>
            <option value="Tomato">Tomato</option>
            <option value="Maize (Corn)">Maize Corn</option>
            <option value="Cotton">Cotton</option>
            <option value="Groundnut">Groundnut</option>
            <option value="Sugarcane">Sugarcane</option>
            <option value="Millets">Millets</option>
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('top_ai')} title="Top AI Recommendations" className={`p-1.5 rounded-lg transition ${activeTab === 'top_ai' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <Sparkles className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('catalog')} title="Seed Variety Explorer Catalog" className={`p-1.5 rounded-lg transition ${activeTab === 'catalog' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('compare')} title="Side-by-Side Seed Comparison (Seed A vs B)" className={`p-1.5 rounded-lg transition ${activeTab === 'compare' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <Sliders className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('rotation')} title="AI Crop Rotation Planner" className={`p-1.5 rounded-lg transition ${activeTab === 'rotation' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('dealers')} title="Nearby Certified Seed Dealers" className={`p-1.5 rounded-lg transition ${activeTab === 'dealers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. WORKSPACE VIEWS */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Loading AI Seed Variety Recommendation Platform...
        </div>
      ) : activeTab === 'top_ai' ? (
        /* TOP AI RECOMMENDATIONS VIEW */
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Top AI Recommended Seeds for Current Season & Soil Chemistry
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seeds.map((s) => (
              <div 
                key={s.seed_id}
                onClick={() => setSelectedSeedId(s.seed_id)}
                className={`glass-panel rounded-2xl border transition p-4 cursor-pointer flex flex-col justify-between hover:border-emerald-500/40 ${
                  selectedSeedId === s.seed_id ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/40' : 'border-white/10 bg-black/40'
                }`}
              >
                <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 border border-white/10 bg-slate-900">
                  <SeedCropImage crop={s.crop || s.seed_name} />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-emerald-300 border border-emerald-500/40">
                    {s.seed_id}
                  </div>
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {s.ai_match_score}% Match
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-100">{s.seed_name}</h4>
                  <p className="text-xs text-slate-300">🏢 {s.company} • <span className="text-cyan-300">{s.type}</span></p>
                  <p className="text-xs text-slate-400">Duration: <strong className="text-emerald-300">{s.growth_duration_days} Days</strong> • Yield: <strong className="text-amber-300">{s.yield_potential_t_ha} t/ha</strong></p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">💡 <span className="text-slate-300">{s.reasoning}</span></p>
                </div>

                {/* SUITABILITY BREAKDOWN PROGRESS BARS */}
                <div className="mt-3 space-y-1.5 pt-2 border-t border-white/10 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Weather & Climate Match</span>
                    <strong className="text-emerald-400">98%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '98%' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Soil pH & NPK Match</span>
                    <strong className="text-cyan-400">95%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'catalog' ? (
        /* SEED VARIETY EXPLORER CATALOG */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {seeds.map((s) => (
            <div key={s.seed_id} className="glass-panel rounded-2xl border border-white/10 p-4 space-y-2 bg-black/40">
              <div className="h-32 rounded-xl overflow-hidden border border-white/10"><SeedCropImage crop={s.crop || s.seed_name} /></div>
              <h4 className="font-extrabold text-slate-100">{s.seed_name}</h4>
              <p className="text-slate-300">Company: {s.company}</p>
              <p className="text-slate-400">Price: <strong className="text-emerald-400">₹{s.price_per_kg_inr}/kg</strong></p>
              <p className="text-slate-400">Resistance: {s.disease_resistance}</p>
            </div>
          ))}
        </div>
      ) : activeTab === 'compare' ? (
        /* SIDE-BY-SIDE SEED VARIETY COMPARISON VIEW */
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" /> Side-by-Side Seed Variety Comparison (Seed A vs B)
            </h3>
            <div className="flex items-center gap-3">
              <select value={compareIdA} onChange={(e) => setCompareIdA(e.target.value)} className="bg-black/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl px-2 py-1">
                {seeds.map(s => <option key={s.seed_id} value={s.seed_id}>{s.seed_name}</option>)}
              </select>
              <span className="text-slate-400 font-bold">VS</span>
              <select value={compareIdB} onChange={(e) => setCompareIdB(e.target.value)} className="bg-black/80 border border-cyan-500/50 text-cyan-300 text-xs rounded-xl px-2 py-1">
                {seeds.map(s => <option key={s.seed_id} value={s.seed_id}>{s.seed_name}</option>)}
              </select>
            </div>
          </div>

          {comparisonData && comparisonData.seed_a && comparisonData.seed_b && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <h4 className="font-extrabold text-emerald-300 text-sm">{comparisonData.seed_a.seed_name}</h4>
                <p className="text-slate-300">Breeder: <strong>{comparisonData.seed_a.company}</strong></p>
                <p className="text-slate-300">Growth Duration: <strong>{comparisonData.seed_a.growth_duration_days} Days</strong></p>
                <p className="text-slate-300">Yield Potential: <strong>{comparisonData.seed_a.yield_potential_t_ha} t/ha</strong></p>
                <p className="text-slate-300">Price: <strong>₹{comparisonData.seed_a.price_per_kg_inr}/kg</strong></p>
                <p className="text-slate-300">AI Match Score: <strong className="text-emerald-400">{comparisonData.seed_a.ai_match_score}%</strong></p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-2">
                <h4 className="font-extrabold text-cyan-300 text-sm">{comparisonData.seed_b.seed_name}</h4>
                <p className="text-slate-300">Breeder: <strong>{comparisonData.seed_b.company}</strong></p>
                <p className="text-slate-300">Growth Duration: <strong>{comparisonData.seed_b.growth_duration_days} Days</strong></p>
                <p className="text-slate-300">Yield Potential: <strong>{comparisonData.seed_b.yield_potential_t_ha} t/ha</strong></p>
                <p className="text-slate-300">Price: <strong>₹{comparisonData.seed_b.price_per_kg_inr}/kg</strong></p>
                <p className="text-slate-300">AI Match Score: <strong className="text-cyan-400">{comparisonData.seed_b.ai_match_score}%</strong></p>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'dealers' ? (
        /* NEARBY AUTHORIZED SEED DEALERS & GOVERNMENT OUTLETS */
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" /> Nearby Certified Seed Outlets & Government Subsidized Depots
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealers.map((d, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-300 text-xs">{d.dealer_name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">{d.subsidy}</span>
                </div>
                <p className="text-slate-300">📍 Location: {d.address} ({d.distance_km} km)</p>
                <p className="text-slate-400">📞 Phone: {d.phone}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* FLOATING AI SEED ADVISOR TOGGLE BUTTON */}
      <button 
        onClick={() => setShowFloatingAI(!showFloatingAI)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-white/20"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline">AI Seed Advisor</span>
      </button>

      {/* FLOATING AI SEED ADVISOR CHAT WINDOW */}
      {showFloatingAI && (
        <div className="fixed bottom-20 right-6 z-50 w-96 glass-panel rounded-2xl p-4 border border-emerald-500/50 bg-slate-950/95 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> AI Seed Advisor (Ollama Qwen)
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
              placeholder="Ask seed advisor..." 
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
