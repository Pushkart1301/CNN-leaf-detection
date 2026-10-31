import React, { useState } from 'react';
import { Sparkles, Bot, Zap, Download, Copy, Check, FileText, Table, Code, FileSpreadsheet, MessageSquare, Send } from 'lucide-react';
import { runTabAIAnalysis, runTabAIAnalysisStream } from '../../services/aiService';
import { FormattedAIReport } from './FormattedAIReport';
import { 
  exportPDFReport, 
  exportWordDocReport, 
  exportTextReport, 
  exportCSVReport, 
  exportJSONReport, 
  exportExcelReport, 
  exportMarkdownReport 
} from '../../utils/exportReport';

export const AIBadgePanel = ({ tabId, tabName, defaultPrompt, contextData }) => {
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Layer 2: Context Assistant State
  const [miniQuery, setMiniQuery] = useState('');
  const [miniAnswer, setMiniAnswer] = useState(null);
  const [miniLoading, setMiniLoading] = useState(false);

  const captureVisiblePageContext = () => {
    try {
      const mainEl = document.querySelector('main');
      if (!mainEl) return {};

      const cards = Array.from(mainEl.querySelectorAll('.glass-panel, [class*="rounded-xl"], [class*="rounded-2xl"]'))
        .map(el => el.innerText.replace(/\s+/g, ' ').trim())
        .filter(t => t.length > 10 && t.length < 200)
        .slice(0, 15);

      const tables = Array.from(mainEl.querySelectorAll('table')).map(t => {
        const rows = Array.from(t.querySelectorAll('tr')).slice(0, 5);
        return rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).join(' | ');
      });

      const inputs = Array.from(mainEl.querySelectorAll('input, select, textarea')).map(i => {
        const label = i.getAttribute('placeholder') || i.name || i.id || 'Input';
        return `${label}: ${i.value || 'default'}`;
      });

      return {
        visible_cards: cards,
        tables: tables,
        active_user_inputs: inputs,
        dom_captured_at: new Date().toISOString()
      };
    } catch (e) {
      return { error_capturing_dom: e.message };
    }
  };

  const handleRunAI = async () => {
    setLoading(true);
    setAiOutput("");
    try {
      const domTelemetry = captureVisiblePageContext();
      const payloadContext = {
        ...contextData,
        page_dom_telemetry: domTelemetry
      };

      await runTabAIAnalysisStream(
        tabId, 
        tabName, 
        payloadContext, 
        defaultPrompt,
        (accumulatedText) => {
          setAiOutput(accumulatedText);
        },
        () => {
          setLoading(false);
        }
      );
    } catch (err) {
      setAiOutput(`❌ Error connecting to AI Agent Gateway: ${err.message}`);
      setLoading(false);
    }
  };

  const handleAskMiniAI = async (e) => {
    e.preventDefault();
    if (!miniQuery.trim() || miniLoading) return;

    setMiniLoading(true);
    setMiniAnswer("");
    try {
      const domTelemetry = captureVisiblePageContext();
      const payloadContext = {
        ...contextData,
        page_dom_telemetry: domTelemetry
      };

      await runTabAIAnalysisStream(
        tabId, 
        tabName, 
        payloadContext, 
        `Answer user query specifically about current page data: ${miniQuery}`,
        (accumulatedText) => {
          setMiniAnswer(accumulatedText);
        },
        () => {
          setMiniLoading(false);
        }
      );
    } catch (err) {
      setMiniAnswer(`Error querying Mini AI: ${err.message}`);
      setMiniLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = (format) => {
    if (!aiOutput) return;
    const title = `${tabName} AI Intelligence Report`;
    const data = contextData || {};

    switch (format) {
      case 'pdf':
        exportPDFReport(title, data, aiOutput);
        break;
      case 'docx':
        exportWordDocReport(title, data, aiOutput);
        break;
      case 'txt':
        exportTextReport(title, data, aiOutput);
        break;
      case 'csv':
        exportCSVReport(title, data);
        break;
      case 'excel':
        exportExcelReport(title, data, aiOutput);
        break;
      case 'json':
        exportJSONReport(title, data, aiOutput);
        break;
      case 'markdown':
        exportMarkdownReport(title, data, aiOutput);
        break;
      default:
        exportPDFReport(title, data, aiOutput);
    }
    setShowExportMenu(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-indigo-950/30 space-y-3 mb-4 shadow-xl">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl ai-orb-glow flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-100 flex items-center gap-2">
              {tabName} AI Agent
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Live insights for this page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {aiOutput && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-white/20 shadow-2xl p-1.5 z-50 text-xs font-mono space-y-1 animate-in fade-in">
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-rose-400" /> Export PDF
                  </button>
                  <button onClick={() => handleExport('docx')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Export DOCX
                  </button>
                  <button onClick={() => handleExport('excel')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel
                  </button>
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <Table className="w-3.5 h-3.5 text-amber-400" /> Export CSV
                  </button>
                  <button onClick={() => handleExport('json')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <Code className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
                  </button>
                  <button onClick={() => handleExport('txt')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> Export TXT
                  </button>
                  <button onClick={() => handleExport('markdown')} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-500/20 rounded flex items-center gap-2 text-slate-200">
                    <Code className="w-3.5 h-3.5 text-purple-400" /> Export Markdown
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleRunAI}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Executing Local AI Inference...' : '⚡ Run Tab AI Analysis'}
          </button>
        </div>
      </div>

      {/* LAYER 1: ENTERPRISE FORMATTED TAB REPORT OUTPUT */}
      {aiOutput && (
        <div className="p-4 rounded-2xl bg-black/80 border border-emerald-500/40 text-xs text-slate-200 leading-relaxed font-sans space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-[10px] text-emerald-400 pb-2 border-b border-white/10 font-mono">
            <span className="flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> 
              Layer 1: Enterprise Formatted Report from qwen:latest & Telemetry
            </span>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          
          <FormattedAIReport rawText={aiOutput} tabName={tabName} />
        </div>
      )}

      {/* LAYER 2: EMBEDDED CONTEXT ASSISTANT ("Ask AI about this page") */}
      <div className="pt-2 border-t border-white/10">
        <form onSubmit={handleAskMiniAI} className="flex items-center gap-2">
          <div className="relative flex-1">
            <MessageSquare className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={miniQuery}
              onChange={(e) => setMiniQuery(e.target.value)}
              placeholder={`Ask ${tabName} AI specific questions about this page...`}
              className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={miniLoading || !miniQuery.trim()}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1 transition disabled:opacity-40"
          >
            <Send className={`w-3.5 h-3.5 ${miniLoading ? 'animate-spin' : ''}`} />
            {miniLoading ? 'Thinking...' : 'Ask Mini AI'}
          </button>
        </form>

        {miniAnswer && (
          <div className="mt-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200 font-sans space-y-2 animate-in fade-in">
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold font-mono">
              <Bot className="w-3 h-3" /> Layer 2 Mini AI Answer for "{miniQuery}"
            </div>
            <FormattedAIReport rawText={miniAnswer} tabName={`${tabName} Mini AI`} />
          </div>
        )}
      </div>
    </div>
  );
};
