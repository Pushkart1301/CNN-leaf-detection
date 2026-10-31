import React from 'react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import { useAuth } from '../../context/AuthContext';

const getInitials = (name = '') => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

export const CommunityTabs = ({ subTab }) => {
  const { user } = useAuth();

  if (subTab !== 'profile-account') {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <AIBadgePanel tabId="profile-account" tabName="Farmer Mastery Radar AI" defaultPrompt="Calculate farmer skill level score and AI token consumption." />
      <div className="glass-panel rounded-2xl p-6 border border-white/10 font-mono text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/30 to-teal-500/10 flex items-center justify-center text-emerald-100 font-black">
            {getInitials(user?.displayName || user?.username || 'AgriVerse')}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">{user?.displayName || 'Farmer'}</h4>
            <p className="text-[11px] text-slate-400">{user?.email || 'farmer@agriverse.ai'} • {user?.provider || 'Username & Password Auth'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">Tokens: {user?.aiTokens || '100,000 / 100,000'}</span>
        </div>
      </div>
    </div>
  );
};
