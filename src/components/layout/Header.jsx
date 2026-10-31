import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Bell, 
  Globe, 
  Cpu, 
  Check,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onOpenCommand, toggleAIDrawer, isAIDrawerOpen }) => {
  const { user, setShowAuthModal } = useAuth();
  const [lang, setLang] = useState('EN');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'High Pest Risk Warning', desc: 'Stem borer probability 84% in Field #2 (Paddy)', time: '10m ago', type: 'alert' },
    { id: 2, title: 'PM-KISAN 17th Installment', desc: '₹2,000 credited to SBI A/C ending 4892', time: '1h ago', type: 'success' },
    { id: 3, title: 'Optimal Irrigation Window', desc: 'Soil moisture drop to 42%. Irrigate 5 AM - 8 AM', time: '3h ago', type: 'info' }
  ];

  return (
    <header className="h-16 border-b border-white/10 glass-panel px-4 flex items-center justify-between z-30 sticky top-0 bg-black/40">
      {/* Left Branding */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-[1px] shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-black/80 rounded-[11px] flex items-center justify-center">
            <span className="text-xl animate-pulse">🌱</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
              AgriVerse AI
            </h1>

          </div>
          <p className="text-[11px] text-slate-400 font-medium">Smart Agriculture OS</p>
        </div>
      </div>

      {/* Center Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-xl mx-4 flex items-center gap-3">
        <button
          onClick={onOpenCommand}
          className="flex-1 h-10 px-4 rounded-xl glass-panel-interactive flex items-center justify-between text-slate-400 hover:text-slate-200 transition group text-sm"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-slate-400 group-hover:text-slate-300">Search crop, weather, chat, and schemes in AgriVerse AI...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-400 bg-white/5 rounded border border-white/10">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Assistant Quick Toggle Button */}
        <button
          onClick={toggleAIDrawer}
          className={`h-10 px-3.5 rounded-xl flex items-center gap-2 text-xs font-semibold transition border ${
            isAIDrawerOpen
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/20'
              : 'bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-emerald-900/40 border-white/10 text-slate-200 hover:border-emerald-500/30'
          }`}
        >
          <div className="w-4 h-4 rounded-full ai-orb-glow flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <span>AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl glass-panel-interactive flex items-center justify-center text-slate-300 hover:text-white relative"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-4 shadow-2xl z-50 border border-white/10 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
                <span className="font-semibold text-sm text-slate-200">Notifications & AI Alerts</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  3 New
                </span>
              </div>
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="h-10 px-2.5 rounded-xl glass-panel-interactive flex items-center gap-1.5 text-xs text-slate-300 font-medium"
          >
            <Globe className="w-4 h-4 text-slate-400" />
            <span>{lang}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-32 glass-panel rounded-xl py-2 shadow-2xl z-50 border border-white/10">
              {['EN (English)', 'TA (Tamil)', 'HI (Hindi)', 'TE (Telugu)', 'MR (Marathi)'].map((l) => (
                <button
                  key={l}
                  onClick={() => { setLang(l.split(' ')[0]); setShowLangDropdown(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 flex items-center justify-between"
                >
                  <span>{l}</span>
                  {lang === l.split(' ')[0] && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Identity Profile Card Button */}
        <button
          onClick={() => setShowAuthModal(true)}
          className="h-10 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-emerald-500/30 flex items-center gap-2 transition group"
          title={user ? `Logged in as ${user.displayName}` : "Sign In with Google"}
        >
          {user ? (
            <>
              <img 
                src={user.photoUrl} 
                alt={user.displayName}
                className="w-7 h-7 rounded-lg object-cover border border-emerald-500/50 group-hover:scale-105 transition-transform"
              />
              <span className="hidden sm:inline text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate max-w-[110px]">
                {user.displayName}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </>
          ) : (
            <span className="text-xs font-bold text-emerald-400">Sign In</span>
          )}
        </button>

      </div>
    </header>
  );
};
