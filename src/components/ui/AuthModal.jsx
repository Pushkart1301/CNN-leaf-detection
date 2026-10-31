import React, { useEffect, useState } from 'react';
import { X, Shield, LogOut, CheckCircle2, User, Key, UserPlus, LogIn, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const getInitials = (name = '') => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AV';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
};

export const AuthModal = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, login, register, logout, updateProfile } = useAuth();
  const [activeMode, setActiveMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingName, setEditingName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditingName(user?.displayName || '');
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = activeMode === 'register'
        ? await register(usernameInput, emailInput, passwordInput)
        : await login(usernameInput || emailInput, passwordInput);

      if (!result.success) {
        setErrorMsg(result.error || 'Authentication failed.');
        return;
      }

      onClose();
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = () => {
    if (editingName.trim()) {
      updateProfile({ displayName: editingName.trim(), fullName: editingName.trim(), username: editingName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-emerald-500/30 p-6 shadow-2xl bg-slate-950/90 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-[1px]">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>AgriVerse Authentication</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                MongoDB User Auth
              </span>
            </h3>
            <p className="text-xs text-slate-400">Username & Password Login / Account Register</p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20 flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl border-2 border-emerald-500/50 shadow-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/10 flex items-center justify-center text-emerald-200 font-black">
                  {getInitials(user?.displayName)}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] text-black font-bold">
                  ✓
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-2 py-1 rounded bg-black/60 border border-emerald-500/40 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-100 truncate">{user?.displayName}</h4>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[10px] text-emerald-400 underline ml-2"
                    >
                      Edit
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Authenticated ({user?.provider})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block text-[10px]">FARM LOCATION</span>
                <strong className="text-slate-200">{user?.farmLocation}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                <span className="text-slate-500 block text-[10px]">PRIMARY CROP</span>
                <strong className="text-emerald-400">{user?.cropPrimary}</strong>
              </div>
            </div>

            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-bold text-rose-300 transition"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => { setActiveMode('login'); setErrorMsg(''); }}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${activeMode === 'login' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveMode('register'); setErrorMsg(''); }}
                className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${activeMode === 'register' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {activeMode === 'register' ? 'Choose Username' : 'Username or Email'}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder={activeMode === 'register' ? 'e.g. farmer_sathya' : 'Enter username or email...'}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {activeMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. farmer@agriverse.ai"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Enter password..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full h-11 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition mt-4 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Connecting...</span>
                ) : activeMode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" /> Create Account
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" /> Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
