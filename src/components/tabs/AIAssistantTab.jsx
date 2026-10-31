import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Image as ImageIcon, Mic, Paperclip, Sparkles, RefreshCw, Download, Copy,
  Check, ThumbsUp, ThumbsDown, Pin, Trash2, PlusCircle, Search, Filter,
  ShieldCheck, Brain, Zap, Clock, ChevronRight, ChevronDown, Layers,
  FileText, Activity, AlertTriangle, HelpCircle, HardDrive, Cpu, Terminal,
  Landmark, Sun, CloudRain, Shield, ExternalLink, Eye, ArrowRight, CornerDownLeft, X
} from 'lucide-react';
import {
  fetchChatSessions, createChatSession, fetchSessionMessages, sendAiChatQuery,
  uploadRagDocument, deleteChatSession, FALLBACK_CHAT_SESSIONS, FALLBACK_CHAT_MESSAGES
} from '../../services/aiAssistantService';

export default function AIAssistantTab() {
  const [sessions, setSessions] = useState(FALLBACK_CHAT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState('SESSION-2026-MAIN');
  const [messages, setMessages] = useState(FALLBACK_CHAT_MESSAGES);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedReasoningId, setExpandedReasoningId] = useState(null);

  // RAG File & Image Upload State
  const [attachedFile, setAttachedFile] = useState(null); // { name, type, preview, data }
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    try {
      const s = await fetchChatSessions();
      setSessions(s);
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    }
  };

  const loadMessages = async (sessionId) => {
    setLoading(true);
    try {
      const msgs = await fetchSessionMessages(sessionId);
      setMessages(msgs);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    const title = `AgriVerse Session ${sessions.length + 1}`;
    try {
      const res = await createChatSession(title);
      if (res.status === 'success') {
        const updated = await fetchChatSessions();
        setSessions(updated);
        setActiveSessionId(res.session_id);
      }
    } catch (err) {
      alert(`Session creation failed: ${err.message}`);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this AI chat session?")) return;
    await deleteChatSession(sessionId);
    const updated = sessions.filter(s => s.session_id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId && updated.length > 0) {
      setActiveSessionId(updated[0].session_id);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        preview: file.type.startsWith('image/') ? event.target.result : null,
        data: event.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!prompt.trim() && !attachedFile) || loading) return;

    const userQuery = prompt || (attachedFile ? `Please analyze attached document: ${attachedFile.name}` : '');
    const currentFile = attachedFile;

    setPrompt('');
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLoading(true);

    // Optimistic user message addition
    const tempUserMsg = {
      message_id: `MSG-TEMP-${Date.now()}`,
      session_id: activeSessionId,
      sender: 'user',
      content: currentFile ? `📎 Attached RAG File: ${currentFile.name}\n${userQuery}` : userQuery,
      tool_calls: [],
      retrieved_sources: [],
      reasoning_steps: []
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await sendAiChatQuery(activeSessionId, userQuery, currentFile ? currentFile.data : null, currentFile ? currentFile.name : null);
      if (res.status === 'success' && res.ai_message) {
        setMessages(prev => [...prev, res.ai_message]);
      }
    } catch (err) {
      console.error("Error sending query:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPromptClick = (quickText) => {
    setPrompt(quickText);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = (fmt) => {
    try {
      const content = `
        ====================================================
        AGRIVERSE AI • AUTONOMOUS AGRICULTURAL OS TRANSCRIPT
        ====================================================
        Session Title: ${sessions.find(s => s.session_id === activeSessionId)?.title || 'AgriVerse Session'}
        Model: qwen:latest (AMD Ryzen CPU Acceleration)
        Date: ${new Date().toLocaleDateString()}

        CHAT HISTORY & EVIDENCE TRANSCRIPT:
        ${messages.map(m => `\n[${m.sender.toUpperCase()}]:\n${m.content}\n${m.retrieved_sources?.length ? `Sources: ${m.retrieved_sources.map(s => s.title).join(', ')}` : ''}`).join('\n\n----------------------------------------------------\n')}
        ====================================================
      `;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AgriVerse_AI_Transcript.${fmt.toLowerCase()}`;
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

      {/* Hidden File Input for RAG Document & Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,.pdf,.docx,.txt,.csv,.xlsx"
        className="hidden"
      />

      {/* 1. HERO SYSTEM TELEMETRY HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-zinc-950 to-slate-900 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0 w-full">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase max-w-full">
              <Bot className="w-3.5 h-3.5 animate-pulse shrink-0 text-emerald-400" />
              <span className="truncate">Local-First Autonomous Agricultural AI Operating System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3">
              <span>AgriVerse Central AI Assistant</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40 shrink-0">Ollama qwen:latest</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Integrated local RAG knowledge engine, 20 independent autonomous agents, real-time MCP tool calling, and instant document/leaf OCR indexing.
            </p>
          </div>

          {/* System Hardware & Model Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Model Engine</div>
              <div className="text-sm font-black text-emerald-400">qwen:latest</div>
              <div className="text-[8px] text-emerald-300/80">Local 7B LLM</div>
            </div>

            <div className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">RAG Vectors</div>
              <div className="text-sm font-black text-cyan-400">28 Manuals</div>
              <div className="text-[8px] text-cyan-300/80">ICAR / TNAU / User Uploads</div>
            </div>

            <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Hardware</div>
              <div className="text-sm font-black text-amber-300">Ryzen 5 5500H</div>
              <div className="text-[8px] text-amber-300/80">14% RAM Load</div>
            </div>

            <div className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-3 text-center">
              <div className="text-[9px] text-slate-400 uppercase font-bold">Latency</div>
              <div className="text-sm font-black text-purple-300">18 ms</div>
              <div className="text-[8px] text-purple-300/80">Streaming Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT PANEL: CHAT SESSIONS & QUICK PROMPTS (3 COLS) */}
        <div className="lg:col-span-3 space-y-6">

          {/* SESSIONS MANAGER */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Chat Sessions ({sessions.length})</span>
              </h3>
              <button
                onClick={handleCreateSession}
                className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {sessions.map(s => (
                <div
                  key={s.session_id}
                  onClick={() => setActiveSessionId(s.session_id)}
                  className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between group ${activeSessionId === s.session_id ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300'}`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.active_agent}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSession(s.session_id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Prompt Chips</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                "Diagnose blast disease on paddy crop",
                "Calculate KCC subsidized EMI for ₹2 Lakhs",
                "Check 10-day rainfall forecast for Katpadi",
                "Verify DigiLocker Land Patta Chitta extract",
                "Predict Paddy yield & net profit per acre"
              ].map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPromptClick(qp)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-300 text-[11px] transition flex items-center justify-between"
                >
                  <span className="truncate">{qp}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER PANEL: LIVE CHAT FEED & PROMPT INPUT WITH RAG FILE UPLOAD (6 COLS) */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between min-h-[600px]">

          {/* CHAT MESSAGES DISPLAY */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl flex-1 space-y-6 overflow-y-auto max-h-[580px]">
            {messages.map((msg, idx) => (
              <div
                key={msg.message_id || idx}
                className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-3 max-w-[88%] ${msg.sender === 'user' ? 'bg-emerald-500 text-slate-950 font-medium p-4 rounded-3xl rounded-tr-none shadow-lg' : 'bg-slate-950 border border-slate-800 p-5 rounded-3xl rounded-tl-none space-y-3 text-slate-200'}`}>
                  
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* AI Metadata: Tool Calls & Sources */}
                  {msg.sender === 'ai' && (
                    <div className="space-y-2 pt-2 border-t border-slate-900 text-[11px]">
                      
                      {/* Tool Calls Chips */}
                      {msg.tool_calls && msg.tool_calls.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">Tools Invoked:</span>
                          {msg.tool_calls.map((tool, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[10px]">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* RAG Source Citation Cards */}
                      {msg.retrieved_sources && msg.retrieved_sources.length > 0 && (
                        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-300 flex items-center justify-between">
                            <span>Retrieved RAG Evidence ({msg.retrieved_sources.length} Citations)</span>
                            <span className="text-emerald-400">{msg.confidence_pct}% Confidence</span>
                          </div>
                          {msg.retrieved_sources.map((src, sIdx) => (
                            <div key={sIdx} className="text-[10px] text-slate-300 flex justify-between font-mono">
                              <span>• {src.title} ({src.ref})</span>
                              <span className="text-slate-400">{src.body}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reasoning Timeline Accordion */}
                      {msg.reasoning_steps && msg.reasoning_steps.length > 0 && (
                        <div className="border-t border-slate-900/80 pt-1.5">
                          <button
                            onClick={() => setExpandedReasoningId(expandedReasoningId === msg.message_id ? null : msg.message_id)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                          >
                            <span>Reasoning Timeline ({msg.reasoning_steps.length} Steps)</span>
                            {expandedReasoningId === msg.message_id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          {expandedReasoningId === msg.message_id && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-900 font-mono text-[10px] text-slate-300 space-y-1">
                              {msg.reasoning_steps.map((step, stIdx) => (
                                <div key={stIdx}>→ {step}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Actions */}
                      <div className="flex items-center justify-end gap-3 pt-1 text-[10px] text-slate-400">
                        <button
                          onClick={() => handleCopyText(msg.message_id, msg.content)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === msg.message_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* PROMPT INPUT FORM WITH ATTACHMENT PREVIEW */}
          <div className="space-y-2">
            
            {/* Attachment Preview Bar */}
            {attachedFile && (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-xs text-emerald-300 font-mono">
                <div className="flex items-center gap-2 truncate">
                  {attachedFile.preview ? (
                    <img src={attachedFile.preview} alt="Attachment" className="w-8 h-8 rounded-lg object-cover border border-emerald-500/50" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="truncate">{attachedFile.name} (RAG Vector Indexing Ready)</span>
                </div>
                <button
                  onClick={handleRemoveAttachment}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative rounded-3xl bg-slate-900/90 border border-emerald-500/40 p-3 backdrop-blur-xl shadow-xl flex items-center gap-2">
              
              {/* Attachment Triggers */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                title="Upload Document or Leaf Image for RAG Vector Indexing"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
                title="Upload Leaf Scan Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask anything or attach leaf photos, land patta certificates, soil test PDFs for RAG indexing..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none h-12 py-3 px-2"
              />

              <button
                type="submit"
                disabled={loading || (!prompt.trim() && !attachedFile)}
                className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/20 shrink-0"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT PANEL: AUTONOMOUS AGENT TEAM & REPORT EXPORTER (3 COLS) */}
        <div className="lg:col-span-3 space-y-6">

          {/* AUTONOMOUS AGENT MONITOR */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Agent Team (20)</span>
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { name: "Crop Doctor & OCR Agent", status: "Active", color: "text-emerald-400" },
                { name: "KCC Financial Planning Agent", status: "Active", color: "text-emerald-400" },
                { name: "PMFBY Insurance Agent", status: "Active", color: "text-emerald-400" },
                { name: "Weather & Irrigation Agent", status: "Active", color: "text-emerald-400" },
                { name: "Yield & Market Intelligence Agent", status: "Standby", color: "text-amber-400" }
              ].map((ag, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-white text-[11px] truncate">{ag.name}</span>
                  <span className={`text-[10px] font-mono font-bold ${ag.color}`}>{ag.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TODAY'S AI FARM RECOMMENDATIONS */}
          <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/30 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Today's Farm Action Plan</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-white">Katpadi Paddy Field:</div>
                <div>Spray Tricyclazole 75% WP @ 0.6g/L to prevent secondary blast spread.</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">KCC Subsidized Limit:</div>
                <div>₹3,00,000 available at 4% interest rate via SBI Vellore branch.</div>
              </div>
            </div>
          </div>

          {/* OFFICIAL TRANSCRIPT EXPORTER */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Conversation</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleExportChat('PDF')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-center font-bold"
              >
                PDF Log
              </button>
              <button
                onClick={() => handleExportChat('JSON')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-center font-bold"
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
