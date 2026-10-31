import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, X, Command } from 'lucide-react';
import { TAB_CATEGORIES } from '../../constants/tabs';

export const CommandPalette = ({ isOpen, onClose, onSelectTab }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allTabs = TAB_CATEGORIES.flatMap(c => c.tabs.map(t => ({ ...t, category: c.name })));
  
  const filtered = allTabs.filter(t => 
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.desc.toLowerCase().includes(query.toLowerCase()) ||
    t.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/40">
          <Search className="w-5 h-5 text-emerald-400" />
          <input
            type="text"
            placeholder="Search core agriculture features (Ctrl + K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              No matching modules found for "{query}"
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTab(t.id);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-emerald-400 group-hover:bg-emerald-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                    {t.category}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-300">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-slate-300">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
