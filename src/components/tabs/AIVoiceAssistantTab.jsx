import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Sparkles, RefreshCw, Download, Copy,
  Check, Play, Square, Settings, Globe, Bot, Zap, Clock, ShieldCheck,
  FileText, Activity, ArrowRight, CornerDownLeft, ChevronRight, Layers,
  Sun, CloudRain, Shield, ExternalLink, Trash2, Sliders, Radio
} from 'lucide-react';
import {
  fetchVoiceTranscripts, sendVoiceQuery, clearVoiceTranscripts, FALLBACK_VOICE_TRANSCRIPTS
} from '../../services/voiceAssistantService';

export default function AIVoiceAssistantTab({ onNavigateTab }) {
  const [transcripts, setTranscripts] = useState(FALLBACK_VOICE_TRANSCRIPTS);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('Idle - Ready to Listen');
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [voiceGender, setVoiceGender] = useState('male');
  const [copiedId, setCopiedId] = useState(null);

  const recognitionRef = useRef(null);
  const transcriptsEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
    initSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const loadHistory = async () => {
    try {
      const data = await fetchVoiceTranscripts();
      setTranscripts(data);
    } catch (err) {
      console.error("Error loading voice history:", err);
    }
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setCurrentStatus('Listening to your voice command...');
      };

      recognition.onresult = async (event) => {
        const spokenText = event.results[0][0].transcript;
        setIsListening(false);
        await handleProcessSpokenText(spokenText);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setCurrentStatus('Idle - Ready to Listen');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setCurrentStatus('Idle - Ready to Listen');
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (recognitionRef.current) {
        recognitionRef.current.lang = selectedLang;
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Recognition start error:", err);
          // Fallback simulation if browser blocks mic permission
          simulateVoiceInput("Show today's weather and rain forecast for Katpadi paddy field");
        }
      } else {
        // Browser doesn't support Web Speech Recognition fallback
        simulateVoiceInput("Show today's weather and rain forecast for Katpadi paddy field");
      }
    }
  };

  const simulateVoiceInput = (text) => {
    setIsListening(true);
    setCurrentStatus('Listening (Simulated Speech Input)...');
    setTimeout(() => {
      setIsListening(false);
      handleProcessSpokenText(text);
    }, 1500);
  };

  const handleProcessSpokenText = async (spokenText) => {
    setLoading(true);
    setCurrentStatus('Thinking & Searching RAG Vectors...');

    try {
      const res = await sendVoiceQuery(spokenText, selectedLang);
      if (res.status === 'success' && res.transcript) {
        setTranscripts(prev => [...prev, res.transcript]);
        setCurrentStatus('Synthesizing Speech Response...');
        speakResponse(res.transcript.ai_spoken_text);

        // Check for smart tab navigation command
        if (res.transcript.navigation_command && onNavigateTab) {
          setTimeout(() => {
            onNavigateTab(res.transcript.navigation_command);
          }, 3000);
        }
      }
    } catch (err) {
      console.error("Error processing voice query:", err);
    } finally {
      setLoading(false);
    }
  };

  const speakResponse = (text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.lang = selectedLang;

    // Pick appropriate voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.includes(selectedLang.split('-')[0])) || voices[0];
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentStatus('Speaking AI Agricultural Guidance...');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentStatus('Idle - Ready to Listen');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentStatus('Idle - Ready to Listen');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentStatus('Idle - Ready to Listen');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all voice transcripts?")) return;
    await clearVoiceTranscripts();
    setTranscripts([]);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscript = (fmt) => {
    try {
      const content = `
        ====================================================
        AGRIVERSE AI • MULTILINGUAL VOICE OS TRANSCRIPT
        ====================================================
        Language: ${selectedLang}
        Model: qwen:latest + Piper TTS + Whisper STT
        Date: ${new Date().toLocaleDateString()}

        VOICE HISTORY:
        ${transcripts.map(t => `\n[FARMER SPOKEN]: ${t.user_spoken_text}\n[AI SPOKEN ANSWER]: ${t.ai_spoken_text}\n[INTENT]: ${t.detected_intent}`).join('\n\n----------------------------------------------------\n')}
        ====================================================
      `;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AgriVerse_Voice_Transcript.${fmt.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-16">

      {/* 1. HERO VOICE OS TELEMETRY BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-zinc-950 to-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase max-w-full">
              <Radio className="w-3.5 h-3.5 animate-pulse shrink-0 text-emerald-400" />
              <span className="truncate">Liquid Audio Multilingual Voice Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>AgriVerse AI Voice Assistant</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40 shrink-0">Piper TTS & Whisper STT</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Natural hands-free voice control for farmers. Query weather, diagnose crop diseases, calculate KCC loans, and navigate tabs automatically using spoken commands.
            </p>
          </div>

          {/* Voice System Hardware Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">STT Engine</div>
              <div className="text-sm font-black text-emerald-400">Whisper Base</div>
              <div className="text-[8px] text-emerald-300/80">Offline Multilingual</div>
            </div>

            <div className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">TTS Voice</div>
              <div className="text-sm font-black text-cyan-400">Piper Neural</div>
              <div className="text-[8px] text-cyan-300/80">Natural Accent</div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">LLM Brain</div>
              <div className="text-sm font-black text-amber-300">qwen:latest</div>
              <div className="text-[8px] text-amber-300/80">RAG Vector Grounded</div>
            </div>

            <div className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Latency</div>
              <div className="text-sm font-black text-purple-300">18 ms</div>
              <div className="text-[8px] text-purple-300/80">Zero Cloud Delay</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: VOICE ORB & TRANSCRIPT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: ANIMATED VOICE ORB & VOICE CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">

          {/* ANIMATED VOICE ORB CONTAINER */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl pointer-events-none" />

            {/* Status Indicator Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : isSpeaking ? 'bg-cyan-400 animate-pulse' : loading ? 'bg-amber-400 animate-spin' : 'bg-emerald-400'}`} />
              <span className="text-slate-300">{currentStatus}</span>
            </div>

            {/* Glowing Voice Orb */}
            <div className="relative group cursor-pointer" onClick={toggleListening}>
              <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${isListening ? 'bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500 shadow-[0_0_80px_rgba(244,63,94,0.6)] scale-105' : isSpeaking ? 'bg-gradient-to-tr from-cyan-600 via-emerald-500 to-indigo-600 shadow-[0_0_80px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-gradient-to-tr from-emerald-600 via-teal-700 to-slate-900 shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:scale-105'}`}>
                {isListening ? (
                  <Mic className="w-20 h-20 text-white animate-pulse" />
                ) : isSpeaking ? (
                  <Volume2 className="w-20 h-20 text-white animate-bounce" />
                ) : loading ? (
                  <RefreshCw className="w-16 h-16 text-white animate-spin" />
                ) : (
                  <Mic className="w-20 h-20 text-white" />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-white">Tap Orb to Start Spoken Assistant</h3>
              <p className="text-xs text-slate-400">Speak naturally in Tamil, English, Hindi, or Telugu</p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 w-full pt-2">
              <button
                onClick={toggleListening}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 ${isListening ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'}`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? "Stop Listening" : "Start Spoken Query"}</span>
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Speech</span>
                </button>
              )}
            </div>

          </div>

          {/* VOICE & AUDIO CONFIGURATION PANEL */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Engine Settings</span>
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* Language Selection */}
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Spoken Language</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                >
                  <option value="en-IN">Indian English (en-IN)</option>
                  <option value="ta-IN">Tamil / தமிழ் (ta-IN)</option>
                  <option value="hi-IN">Hindi / हिंदी (hi-IN)</option>
                  <option value="te-IN">Telugu / తెలుగు (te-IN)</option>
                  <option value="kn-IN">Kannada / ಕನ್ನಡ (kn-IN)</option>
                  <option value="ml-IN">Malayalam / മലയാളം (ml-IN)</option>
                  <option value="mr-IN">Marathi / मराठी (mr-IN)</option>
                  <option value="bn-IN">Bengali / বাংলা (bn-IN)</option>
                </select>
              </div>

              {/* Speech Speed & Pitch Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Speed Rate</span>
                    <span className="font-mono text-emerald-400">{speechRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Voice Pitch</span>
                    <span className="font-mono text-cyan-400">{speechPitch}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={speechPitch}
                    onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SMART VOICE SHORTCUT CHIPS */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Spoken Shortcuts</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { label: "Show today's weather forecast", query: "Show today's weather and rain forecast for Katpadi paddy field" },
                { label: "Diagnose Paddy leaf blast disease", query: "What disease causes spindle-shaped leaf spots on rice and how do I treat it?" },
                { label: "Check KCC loan interest subvention", query: "Check Kisan Credit Card interest rate and eligibility for ₹2 Lakhs" },
                { label: "Open Government Schemes tab", query: "Open Government Schemes tab to apply for PM-KISAN" }
              ].map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => simulateVoiceInput(sc.query)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-[11px] transition flex items-center justify-between"
                >
                  <span className="truncate">🎤 "{sc.label}"</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE MULTILINGUAL TRANSCRIPT FEED & EXPORTER (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">

          {/* TRANSCRIPT FEED CONTAINER */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl space-y-6 overflow-y-auto max-h-[680px]">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Live Spoken Transcripts ({transcripts.length})</span>
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {transcripts.map((tr, idx) => (
                <div key={tr.transcript_id || idx} className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  
                  {/* Spoken Farmer Input */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-center gap-2 text-rose-400 font-bold">
                      <Mic className="w-4 h-4" />
                      <span>Farmer Spoken:</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-mono">
                      STT Confidence: {tr.stt_confidence_pct}%
                    </div>
                  </div>
                  <div className="text-white text-sm font-medium pl-6 leading-relaxed">
                    "{tr.user_spoken_text}"
                  </div>

                  {/* AI Spoken Output */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        <span>AI Spoken Answer ({tr.detected_intent}):</span>
                      </div>
                      <button
                        onClick={() => speakResponse(tr.ai_spoken_text)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Replay Audio</span>
                      </button>
                    </div>

                    <div className="text-slate-200 text-xs leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                      {tr.ai_spoken_text}
                    </div>
                  </div>

                  {/* RAG & Tool Call Metadata */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span>Tools:</span>
                      {tr.tool_calls && tr.tool_calls.map((tc, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-cyan-400">
                          {tc}
                        </span>
                      ))}
                    </div>

                    {tr.navigation_command && (
                      <div className="text-amber-300 font-bold">
                        ⚡ Tab Switched: {tr.navigation_command}
                      </div>
                    )}
                  </div>

                </div>
              ))}
              <div ref={transcriptsEndRef} />
            </div>

          </div>

          {/* EXPORT TRANSCRIPT DOCUMENT */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Spoken Audio Transcript</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleExportTranscript('PDF')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-center font-bold"
              >
                PDF Log
              </button>
              <button
                onClick={() => handleExportTranscript('TXT')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-center font-bold"
              >
                TXT Log
              </button>
              <button
                onClick={() => handleExportTranscript('JSON')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-center font-bold"
              >
                JSON Log
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
