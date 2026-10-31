import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Activity, Layers, Grid, List, Calendar, MapPin, Search, Plus, Filter,
  Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, TrendingUp,
  Download, FileText, Share2, RefreshCw, Eye, Star, Pin, CornerDownRight, ChevronRight,
  ChevronDown, Phone, Map, Clock, ShieldCheck, Heart, User, Award, Zap, BarChart3, Database, FileSpreadsheet, Image as ImageIcon, Sliders, CheckSquare, MessageSquare
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import {
  fetchPlants, fetchPlantMedicalRecord, createPlantRecord, updatePlantRecord,
  deletePlantRecord, restorePlantRecord, addTimelineScanEntry, calculateSurroundingRisk,
  fetchCropReminders, fetchNearbyContacts, fetchCropAuditLogs, comparePlants, bulkDeletePlants
} from '../../services/cropHealthService';
import { queryLocalOllama } from '../../services/aiService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const PRESET_CROP_IMAGES = [
  { name: 'Rice Paddy', url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600' },
  { name: 'Tomato', url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=600' },
  { name: 'Potato', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600' },
  { name: 'Maize', url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600' },
  { name: 'Cotton', url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=600' },
  { name: 'Chilli', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&q=80&w=600' },
  { name: 'Wheat', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=600' },
  { name: 'Sugarcane', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600' }
];

export const CropHealthTab = () => {
  // Navigation & View Mode State
  const [activeView, setActiveView] = useState('cards'); // 'cards' | 'table' | 'compare' | 'gallery' | 'hierarchy' | 'medical'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [farmFilter, setFarmFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Data State
  const [plantsData, setPlantsData] = useState({ total: 0, plants: [] });
  const [loading, setLoading] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState('PLANT-001');
  const [medicalRecord, setMedicalRecord] = useState(null);

  // Bulk Selection State
  const [selectedPlantIds, setSelectedPlantIds] = useState([]);

  // Plant Comparison Tool State (Plant A vs Plant B)
  const [comparePlantIdA, setComparePlantIdA] = useState('PLANT-001');
  const [comparePlantIdB, setComparePlantIdB] = useState('PLANT-002');
  const [comparisonData, setComparisonData] = useState(null);

  // Gallery Comparison Slider
  const [sliderPos, setSliderPos] = useState(50);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskData, setRiskData] = useState(null);
  const [showFloatingAI, setShowFloatingAI] = useState(false);

  // Floating AI Assistant Chat
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Crop Health Assistant (powered by Ollama qwen:latest). Ask me to explain plant health scores, recommend fertilizers, compare crops, or analyze disease progression!' }
  ]);

  // Form State
  const [formData, setFormData] = useState({
    crop_name: 'Rice (Paddy)', 
    variety: 'ADT 54', 
    image_url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=600',
    farm_name: 'Vellore Main Precision Farm', 
    field_name: 'Field A',
    block_name: 'Block 1', 
    row_number: 1, 
    plant_age_days: 30, 
    health_status: 'Healthy', 
    overall_health_score: 92.0,
    leaf_health: 90.0, 
    stem_health: 94.0, 
    fruit_health: 92.0, 
    root_health: 90.0, 
    disease_status: 'Healthy Foliage',
    severity: 'Low Risk', 
    treatment_notes: 'Routine NPK applied', 
    farmer_notes: '', 
    doctor_notes: ''
  });

  useEffect(() => {
    loadPlants();
  }, [searchQuery, statusFilter, farmFilter, sortBy]);

  useEffect(() => {
    if (selectedPlantId) {
      loadMedicalRecord(selectedPlantId);
    }
  }, [selectedPlantId]);

  useEffect(() => {
    if (activeView === 'compare') {
      loadComparison();
    }
  }, [activeView, comparePlantIdA, comparePlantIdB]);

  const loadPlants = async () => {
    setLoading(true);
    const res = await fetchPlants(searchQuery, statusFilter, farmFilter, 'ALL', sortBy, 1, 100);
    setPlantsData(res);
    setLoading(false);
    if (res.plants && res.plants.length > 0 && !selectedPlantId) {
      setSelectedPlantId(res.plants[0].plant_id);
    }
  };

  const loadMedicalRecord = async (plantId) => {
    const res = await fetchPlantMedicalRecord(plantId);
    setMedicalRecord(res);
  };

  const loadComparison = async () => {
    const data = await comparePlants(comparePlantIdA, comparePlantIdB);
    setComparisonData(data);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPlantIds(plants.map(p => p.plant_id));
    } else {
      setSelectedPlantIds([]);
    }
  };

  const handleToggleSelect = (pid) => {
    setSelectedPlantIds(prev => 
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedPlantIds.length === 0) return;
    if (window.confirm(`Are you sure you want to move ${selectedPlantIds.length} plants to Soft Deleted records?`)) {
      await bulkDeletePlants(selectedPlantIds);
      setSelectedPlantIds([]);
      loadPlants();
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    await createPlantRecord(formData);
    setShowCreateModal(false);
    loadPlants();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updatePlantRecord(selectedPlantId, formData);
    setShowEditModal(false);
    loadPlants();
    loadMedicalRecord(selectedPlantId);
  };

  const handleDelete = async (plantId) => {
    if (window.confirm(`Move DHR ${plantId} to Soft Deleted records?`)) {
      await deletePlantRecord(plantId);
      loadPlants();
    }
  };

  const handleOpenSurroundingRisk = async (plantId) => {
    const risk = await calculateSurroundingRisk(plantId);
    setRiskData(risk);
    setShowRiskModal(true);
  };

  const handleSendAssistantChat = async () => {
    if (!assistantPrompt.trim()) return;
    const userMsg = { sender: 'user', text: assistantPrompt };
    setAssistantMessages(prev => [...prev, userMsg]);
    const promptCopy = assistantPrompt;
    setAssistantPrompt('');

    const contextText = `Total Plants: ${totalCount}, Healthy: ${healthyCount}, Warning: ${warningCount}, Critical: ${criticalCount}, Active View: ${activeView}`;
    const aiResp = await queryLocalOllama(promptCopy, 'qwen:latest', contextText);
    setAssistantMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const handleExportPDF = () => {
    if (!medicalRecord) return;
    const p = medicalRecord.plant;
    exportPDFReport(
      `Digital Crop Medical Record - ${p.plant_id}`,
      `Plant ID: ${p.plant_id}\nCrop: ${p.crop_name} (${p.variety})\nLocation: ${p.farm_name} - ${p.field_name} (Row #${p.row_number})\nOverall Health: ${p.overall_health_score}%\nDisease Status: ${p.disease_status}\nSeverity: ${p.severity}\nTreatment: ${p.treatment_notes}\nDoctor Advisory: ${p.doctor_notes}`,
      [{ title: "Leaf Health Score", value: `${p.leaf_health}%` }, { title: "Stem Health Score", value: `${p.stem_health}%` }]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Healthy':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Healthy</span>;
      case 'Warning':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">Warning</span>;
      case 'Critical':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">Critical</span>;
      case 'Recovered':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">Recovered</span>;
      case 'Harvested':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">Harvested</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">{status}</span>;
    }
  };

  const plants = plantsData.plants || [];
  const totalCount = plantsData.total || 0;
  const healthyCount = plants.filter(p => p.health_status === 'Healthy').length;
  const warningCount = plants.filter(p => p.health_status === 'Warning').length;
  const criticalCount = plants.filter(p => p.health_status === 'Critical').length;
  const totalYield = plants.reduce((sum, p) => sum + (p.yield_prediction_kg || 0), 0);
  const totalIncome = plants.reduce((sum, p) => sum + (p.economic_income_inr || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-mono text-xs relative">
      <AIBadgePanel 
        tabId="crop-health" 
        tabName="AI Digital Crop Health Management System (Digital Hospital for Crops)" 
        defaultPrompt="Manage individual plant digital health records (DHR), track growth timelines, analyze surrounding risk, and prescribe treatment plans." 
      />

      {/* 1. HERO KPI STATS BAR (5 FARMS, 18 FIELDS, 65 PLANTS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Total Plants (65 Records)</span>
            <strong className="text-lg font-bold text-slate-100">{totalCount}</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Healthy Plants</span>
            <strong className="text-lg font-bold text-emerald-400">{healthyCount}</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Warning Plants</span>
            <strong className="text-lg font-bold text-amber-300">{warningCount}</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Critical Plants</span>
            <strong className="text-lg font-bold text-rose-400">{criticalCount}</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Est. Total Yield</span>
            <strong className="text-lg font-bold text-cyan-300">{totalYield.toFixed(0)} kg</strong>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-indigo-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Est. Farm Value</span>
            <strong className="text-lg font-bold text-indigo-300">₹{(totalIncome / 1000).toFixed(0)}k</strong>
          </div>
        </div>
      </div>

      {/* 2. SEARCH, FILTERS & ERP VIEW SWITCHER */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search Plant ID, Crop, Farm, Disease..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Farm Filter Dropdown */}
          <select 
            value={farmFilter}
            onChange={(e) => setFarmFilter(e.target.value)}
            className="h-10 bg-black/60 border border-white/10 rounded-xl text-xs text-slate-200 px-3 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">All 5 Farms</option>
            <option value="Vellore Main Precision Farm">Vellore Main Farm</option>
            <option value="Kanchipuram Agro Park">Kanchipuram Agro Park</option>
            <option value="Thanjavur Rice Delta Belt">Thanjavur Rice Belt</option>
            <option value="Madurai Horticulture Zone">Madurai Zone</option>
            <option value="Coimbatore Cotton & Grain Ranch">Coimbatore Ranch</option>
          </select>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
            {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL', 'RECOVERED', 'HARVESTED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition ${
                  statusFilter === status 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' 
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* ERP View Switcher Buttons & Add Record */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveView('cards')}
              title="Card View"
              className={`p-1.5 rounded-lg transition ${activeView === 'cards' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition ${activeView === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('compare')}
              title="Side-by-Side Plant Comparison (Plant A vs B)"
              className={`p-1.5 rounded-lg transition ${activeView === 'compare' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('gallery')}
              title="Multi-Angle Plant Image Gallery"
              className={`p-1.5 rounded-lg transition ${activeView === 'gallery' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('hierarchy')}
              title="Farm Hierarchy Tree View"
              className={`p-1.5 rounded-lg transition ${activeView === 'hierarchy' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('medical')}
              title="Digital Medical Record (DHR) View"
              className={`p-1.5 rounded-lg transition ${activeView === 'medical' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Stethoscope className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold flex items-center gap-1.5 hover:opacity-90 shadow-lg shadow-emerald-500/20 text-xs"
          >
            <Plus className="w-4 h-4" /> Add DHR Record
          </button>
        </div>
      </div>

      {/* 3. BULK ACTION BAR */}
      {selectedPlantIds.length > 0 && (
        <div className="glass-panel rounded-2xl p-3 border border-emerald-500/50 bg-emerald-950/30 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>{selectedPlantIds.length} Plants Selected for Bulk Operation</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete Selected
            </button>
            <button 
              onClick={() => setSelectedPlantIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE CONTENT VIEWS */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" /> Loading Digital Crop Hospital Database (65 Records)...
        </div>
      ) : activeView === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plants.map((p) => (
            <div 
              key={p.plant_id}
              onClick={() => setSelectedPlantId(p.plant_id)}
              className={`glass-panel rounded-2xl border transition p-4 cursor-pointer overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 ${
                selectedPlantId === p.plant_id ? 'border-emerald-500/60 bg-emerald-950/20 shadow-lg shadow-emerald-950/40' : 'border-white/10 bg-black/40'
              }`}
            >
              <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3 border border-white/10 bg-slate-900">
                <img 
                  src={p.image_url || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=600'} 
                  alt={p.crop_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <input 
                    type="checkbox"
                    checked={selectedPlantIds.includes(p.plant_id)}
                    onChange={() => handleToggleSelect(p.plant_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-white/20 accent-emerald-500 cursor-pointer"
                  />
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-emerald-300 border border-emerald-500/40">
                    {p.plant_id}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {getStatusBadge(p.health_status)}
                </div>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-100">{p.crop_name} <span className="text-xs text-slate-400 font-normal">({p.variety})</span></h3>
                <p className="text-xs text-slate-300">📍 {p.farm_name} • {p.field_name} • Row #{p.row_number}</p>
                <p className="text-xs text-slate-400 mt-1">Disease: <strong className="text-rose-300">{p.disease_status}</strong></p>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Health Index</span>
                  <strong className="text-emerald-400 font-bold">{p.overall_health_score}%</strong>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      p.overall_health_score >= 85 ? 'bg-emerald-400' : p.overall_health_score >= 65 ? 'bg-amber-400' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${p.overall_health_score}%` }} 
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenSurroundingRisk(p.plant_id); }} 
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" /> Surround Risk
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedPlantId(p.plant_id); setShowEditModal(true); }} className="text-slate-400 hover:text-emerald-400">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.plant_id); }} className="text-slate-400 hover:text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeView === 'table' ? (
        <div className="glass-panel rounded-2xl p-4 border border-white/10 overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="p-3">
                  <input type="checkbox" onChange={handleSelectAll} checked={selectedPlantIds.length === plants.length && plants.length > 0} />
                </th>
                <th className="p-3">Photo</th>
                <th className="p-3">Plant ID</th>
                <th className="p-3">Crop Name</th>
                <th className="p-3">Variety</th>
                <th className="p-3">Farm & Field</th>
                <th className="p-3">Age (Days)</th>
                <th className="p-3">Health Score</th>
                <th className="p-3">Disease Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plants.map(p => (
                <tr key={p.plant_id} className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer" onClick={() => setSelectedPlantId(p.plant_id)}>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedPlantIds.includes(p.plant_id)} onChange={() => handleToggleSelect(p.plant_id)} />
                  </td>
                  <td className="p-3">
                    <img src={p.image_url} alt={p.crop_name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                  </td>
                  <td className="p-3 font-bold text-emerald-400">{p.plant_id}</td>
                  <td className="p-3 text-slate-100 font-bold">{p.crop_name}</td>
                  <td className="p-3 text-slate-300">{p.variety}</td>
                  <td className="p-3 text-slate-400">{p.farm_name} ({p.field_name})</td>
                  <td className="p-3 text-slate-300">{p.plant_age_days}d</td>
                  <td className="p-3"><strong className="text-emerald-400">{p.overall_health_score}%</strong></td>
                  <td className="p-3 text-slate-300">{p.disease_status}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedPlantId(p.plant_id); setShowEditModal(true); }} className="text-slate-400 hover:text-emerald-400">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.plant_id)} className="text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeView === 'compare' ? (
        /* SIDE-BY-SIDE PLANT COMPARISON VIEW (PLANT A VS PLANT B) */
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" /> Side-by-Side Plant Medical Comparison (Plant A vs Plant B)
            </h3>

            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Plant A:</span>
                <select value={comparePlantIdA} onChange={(e) => setComparePlantIdA(e.target.value)} className="bg-black/80 border border-emerald-500/50 text-emerald-300 text-xs rounded-xl px-2 py-1">
                  {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_id} - {p.crop_name}</option>)}
                </select>
              </div>
              <span className="text-slate-400 font-bold">VS</span>
              <div>
                <span className="text-[10px] text-slate-400 block">Plant B:</span>
                <select value={comparePlantIdB} onChange={(e) => setComparePlantIdB(e.target.value)} className="bg-black/80 border border-cyan-500/50 text-cyan-300 text-xs rounded-xl px-2 py-1">
                  {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_id} - {p.crop_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {comparisonData && comparisonData.plant_a && comparisonData.plant_b && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              {/* Plant A Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                  <span className="font-bold text-emerald-300 text-sm">{comparisonData.plant_a.plant.plant_id}</span>
                  {getStatusBadge(comparisonData.plant_a.plant.health_status)}
                </div>
                <img src={comparisonData.plant_a.plant.image_url} alt="Plant A" className="w-full h-36 object-cover rounded-xl border border-emerald-500/30" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-100">{comparisonData.plant_a.plant.crop_name} ({comparisonData.plant_a.plant.variety})</h4>
                  <p className="text-slate-300">Overall Health: <strong className="text-emerald-400">{comparisonData.plant_a.plant.overall_health_score}%</strong></p>
                  <p className="text-slate-300">Disease: <strong className="text-amber-300">{comparisonData.plant_a.plant.disease_status}</strong></p>
                  <p className="text-slate-300">Est. Yield: <strong>{comparisonData.plant_a.plant.yield_prediction_kg} kg</strong></p>
                </div>
              </div>

              {/* Plant B Card */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2">
                  <span className="font-bold text-cyan-300 text-sm">{comparisonData.plant_b.plant.plant_id}</span>
                  {getStatusBadge(comparisonData.plant_b.plant.health_status)}
                </div>
                <img src={comparisonData.plant_b.plant.image_url} alt="Plant B" className="w-full h-36 object-cover rounded-xl border border-cyan-500/30" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-100">{comparisonData.plant_b.plant.crop_name} ({comparisonData.plant_b.plant.variety})</h4>
                  <p className="text-slate-300">Overall Health: <strong className="text-cyan-400">{comparisonData.plant_b.plant.overall_health_score}%</strong></p>
                  <p className="text-slate-300">Disease: <strong className="text-amber-300">{comparisonData.plant_b.plant.disease_status}</strong></p>
                  <p className="text-slate-300">Est. Yield: <strong>{comparisonData.plant_b.plant.yield_prediction_kg} kg</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeView === 'gallery' ? (
        /* MULTI-ANGLE IMAGE GALLERY & COMPARISON SLIDER */
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-400" /> Multi-Angle Image Gallery & Before/After Comparison
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PRESET_CROP_IMAGES.map((img) => (
              <div key={img.name} className="relative group rounded-xl overflow-hidden border border-white/10 h-36 bg-slate-900">
                <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-slate-200">{img.name} Photo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. DIGITAL MEDICAL RECORD (DHR) VIEW */}
      {medicalRecord && activeView === 'medical' && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-black space-y-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
              <img 
                src={medicalRecord.plant.image_url} 
                alt={medicalRecord.plant.crop_name} 
                className="w-20 h-20 rounded-2xl object-cover border border-emerald-500/40 shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-100">{medicalRecord.plant.crop_name}</h2>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {medicalRecord.plant.plant_id}
                  </span>
                  {getStatusBadge(medicalRecord.plant.health_status)}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Variety: <strong className="text-amber-300">{medicalRecord.plant.variety}</strong> • 
                  Location: <strong className="text-cyan-300">{medicalRecord.plant.farm_name} ({medicalRecord.plant.field_name})</strong>
                </p>
              </div>
            </div>

            <button 
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-black font-extrabold flex items-center gap-1.5 text-xs"
            >
              <Download className="w-4 h-4" /> Download Medical Dossier (PDF)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Overall Health</span>
              <strong className="text-lg font-bold text-emerald-400">{medicalRecord.plant.overall_health_score}%</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Leaf Health</span>
              <strong className="text-lg font-bold text-amber-300">{medicalRecord.plant.leaf_health}%</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Stem Health</span>
              <strong className="text-lg font-bold text-cyan-300">{medicalRecord.plant.stem_health}%</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Fruit/Grain Health</span>
              <strong className="text-lg font-bold text-indigo-300">{medicalRecord.plant.fruit_health}%</strong>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-400 block">Root Health</span>
              <strong className="text-lg font-bold text-emerald-300">{medicalRecord.plant.root_health}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI ASSISTANT TOGGLE BUTTON */}
      <button 
        onClick={() => setShowFloatingAI(!showFloatingAI)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-2xl hover:scale-105 transition flex items-center gap-2 border border-white/20"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline">AI Crop Health Assistant</span>
      </button>

      {/* FLOATING AI ASSISTANT CHAT WINDOW */}
      {showFloatingAI && (
        <div className="fixed bottom-20 right-6 z-50 w-96 glass-panel rounded-2xl p-4 border border-emerald-500/50 bg-slate-950/95 shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> AI Health Assistant (Ollama Qwen)
            </span>
            <button onClick={() => setShowFloatingAI(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <div className="h-60 overflow-y-auto custom-scrollbar space-y-2 pr-1">
            {assistantMessages.map((msg, idx) => (
              <div key={idx} className={`p-2.5 rounded-xl ${msg.sender === 'user' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30' : 'bg-white/5 text-slate-200 border border-white/10'}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Ask assistant..." 
              value={assistantPrompt}
              onChange={(e) => setAssistantPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAssistantChat()}
              className="flex-1 h-8 px-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 focus:outline-none"
            />
            <button onClick={handleSendAssistantChat} className="px-3 h-8 bg-emerald-500 text-black font-bold rounded-lg hover:bg-emerald-400 text-xs">Send</button>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Create Digital Health Record (DHR)
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Crop Name</label>
                  <input type="text" value={formData.crop_name} onChange={(e) => setFormData({...formData, crop_name: e.target.value})} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Variety</label>
                  <input type="text" value={formData.variety} onChange={(e) => setFormData({...formData, variety: e.target.value})} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none focus:border-emerald-500" required />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Image URL</label>
                <input type="text" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold">Save DHR Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-emerald-400" /> Edit DHR Record ({selectedPlantId})
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Health Status</label>
                <select value={formData.health_status} onChange={(e) => setFormData({...formData, health_status: e.target.value})} className="w-full h-9 bg-black border border-white/10 rounded-xl px-3 text-slate-200">
                  <option value="Healthy">Healthy</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Harvested">Harvested</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl bg-white/5 text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-extrabold">Update DHR</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
