import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  Paperclip, 
  Sparkles, 
  Bot, 
  Cpu, 
  CheckCircle2, 
  Volume2,
  RefreshCw,
  Search
} from 'lucide-react';
import { queryLocalOllama, executeWebSearchMCP } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';

export const AIDrawer = ({ isOpen, onClose, activeTab }) => {
  const { user } = useAuth();
  const displayName = user?.displayName || 'Farmer';
  const farmLocation = user?.farmLocation || 'Vellore, Tamil Nadu';
  const farmSize = user?.farmSize || '12.45 Acres';
  const cropPrimary = user?.cropPrimary || 'Paddy (Rice - ADT 54)';

  const [selectedModel, setSelectedModel] = useState('qwen:latest (Local Ollama)');
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello ${displayName}! I am AgriVerse AI Copilot powered by your local Ollama **qwen:latest** model. Attached to module: **${activeTab.toUpperCase()}**.`,
      time: 'Just now',
      model: 'qwen:latest'
    },
    {
      id: 2,
      sender: 'ai',
      text: `💡 **Contextual Tip**: Your paddy crop in Field #2 requires 50kg Urea/acre after 3 days. Local weather is clear for spraying tomorrow morning.`,
      time: 'Just now',
      model: 'Agri-Expert Swarm'
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputMessage.trim() || isTyping) return;
    const userPrompt = inputMessage;
    const userMsg = { id: Date.now(), sender: 'user', text: userPrompt, time: 'Just now' };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    let systemContext = `Current active module is ${activeTab}. User farm: ${farmSize} in ${farmLocation}. Primary crop: ${cropPrimary}.`;
    
    // Check if query needs MCP web search
    if (userPrompt.toLowerCase().includes('search') || userPrompt.toLowerCase().includes('news') || userPrompt.toLowerCase().includes('mandi')) {
      const searchResults = await executeWebSearchMCP(userPrompt);
      systemContext += ` Live Web Search MCP Results: ${JSON.stringify(searchResults)}`;
    }

    const aiText = await queryLocalOllama(userPrompt, 'qwen:latest', systemContext);

    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      text: aiText,
      time: 'Just now',
      model: selectedModel
    };

    setChatMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] z-50 glass-panel border-l border-white/10 shadow-2xl flex flex-col justify-between backdrop-blur-2xl bg-black/90 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl ai-orb-glow flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              AgriVerse AI Copilot
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                Ollama Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Module: {activeTab}</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Model Selector Ribbon */}
      <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>Engine:</span>
        </div>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-black/80 border border-white/10 text-emerald-300 font-mono text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="qwen:latest (Local Ollama)">qwen:latest (Local Ollama 2.3GB)</option>
          <option value="facebook/deit-small (Local HF)">deit-small (Local HF Vision)</option>
          <option value="trocr-small (Local HF OCR)">trocr-small (Local HF OCR)</option>
          <option value="all-MiniLM-L6-v2 (RAG)">all-MiniLM-L6-v2 (Local Vector RAG)</option>
        </select>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              {msg.sender === 'ai' && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <Bot className="w-3 h-3" />
                  <span>{msg.model}</span>
                </div>
              )}
              <span className="text-[10px] text-slate-500">{msg.time}</span>
            </div>
            
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[90%] border ${
                msg.sender === 'user'
                  ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-100 rounded-tr-none'
                  : 'bg-white/5 border-white/10 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              <div className="space-y-2 whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Ollama qwen:latest generating real-time response...</span>
          </div>
        )}
      </div>

      {/* Quick Context Prompt Chips */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar border-t border-white/10 bg-black/40">
        {[
          'Diagnose Crop Health',
          'Search Mandi Prices',
          'Irrigation Timing',
          'Govt Subsidy Help'
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => setInputMessage(chip)}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-[11px] font-medium whitespace-nowrap border border-white/10 hover:border-emerald-500/30 transition"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-white/10 bg-black/80">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask qwen:latest local model anything..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full h-11 pl-4 pr-24 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition">
              <Mic className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-white/10 transition">
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={handleSend}
              disabled={isTyping}
              className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
