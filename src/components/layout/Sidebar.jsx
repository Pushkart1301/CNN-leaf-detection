import React, { useState } from 'react';
import {
  ChevronRight, Search, Cpu, Zap, Activity, LayoutDashboard, Stethoscope, Scan, CloudSun, Globe, Layers, Sprout, FlaskConical, Droplets, MapPin, History, Compass, TrendingUp, RotateCw, Bug, Scissors, PieChart, Waves, Users, DollarSign, LineChart, Warehouse, Truck, Landmark, FileText, CheckCircle, ShieldAlert, Calculator, Lock, MessageSquare, Mic, Bot, Workflow, FileSpreadsheet, Sliders, Plane, Gauge, Tractor, Boxes, Receipt, UserCheck, Calendar, Kanban, Share2, GraduationCap, Settings, Award
} from 'lucide-react';
import { TAB_CATEGORIES } from '../../constants/tabs';
import { useAuth } from '../../context/AuthContext';

const iconMap = {
  LayoutDashboard, Stethoscope, Scan, Activity, CloudSun, Globe, Layers, Sprout, FlaskConical, Droplets,
  MapPin, History, Compass, TrendingUp, RotateCw, Bug, Scissors, PieChart, Waves,
  Users, DollarSign, LineChart, Warehouse, Truck, Landmark, FileText, CheckCircle, ShieldAlert, Calculator, Lock,
  MessageSquare, Mic, Bot, Workflow, FileSpreadsheet, Sliders, Plane, Gauge, Tractor,
  Boxes, Receipt, UserCheck, Calendar, Kanban, Share2, GraduationCap, Settings, Award
};

const getInitials = (name = '') => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

export const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const { user, setShowAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({
    core: true,
    'farm-intel': true,
    market: false,
    government: false,
    'ai-automation': false,
    'iot-smart': false,
    'farm-management': false,
    community: false
  });

  const toggleCategory = (catId) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const getIconComponent = (iconName) => {
    const IconComp = iconMap[iconName] || LayoutDashboard;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <aside className={`h-[calc(100vh-4rem)] glass-panel border-r border-white/10 flex flex-col justify-between transition-all duration-300 z-20 select-none bg-black/80 ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-3 border-b border-white/10">
        <div
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition group"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center border border-emerald-500/40 shadow-md group-hover:scale-105 transition-transform text-emerald-100 font-black">
              {getInitials(user?.displayName || user?.username || 'AgriVerse')}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center text-[8px] text-black font-bold">
              ✓
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-bold text-sm text-slate-100 truncate group-hover:text-emerald-300">
                  {user?.displayName || 'Sign In / Register'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium truncate">{user?.email || 'Click to Sign In'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.authMethod || 'Username & Password Auth'}</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter 50 modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3 custom-scrollbar">
        {TAB_CATEGORIES.map((cat) => {
          const filteredTabs = cat.tabs.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.desc.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (searchQuery && filteredTabs.length === 0) return null;

          const isExpanded = searchQuery ? true : expandedCategories[cat.id];

          return (
            <div key={cat.id} className="space-y-1">
              {!collapsed && (
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full px-2 py-1.5 flex items-center justify-between text-[11px] font-bold font-mono tracking-wider text-slate-400 hover:text-emerald-400 transition uppercase"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90 text-emerald-400' : ''}`} />
                </button>
              )}

              {(isExpanded || collapsed) && (
                <div className="space-y-0.5">
                  {filteredTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.name + ' - ' + tab.desc}
                        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-medium transition group relative ${isActive ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-indigo-500/10 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1 rounded-lg transition ${isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {getIconComponent(tab.icon)}
                          </div>
                          {!collapsed && <span className="truncate font-semibold">{tab.name}</span>}
                        </div>

                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-glow" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-2 border-t border-white/10 bg-black/40 text-[10px] font-mono text-slate-400 space-y-1">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-emerald-400 animate-pulse" /> AI Models: <strong className="text-emerald-400">12 Active</strong>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Local LLM
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>MCP: 18 Connected</span>
              <span className="text-emerald-400">Status: Optimal</span>
            </div>
          </>
        ) : (
          <div className="flex justify-center py-1 text-emerald-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
