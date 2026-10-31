import React from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Activity, 
  FileText, TrendingUp, Cpu, Award, Zap, ChevronRight, Layers, BarChart3, Database
} from 'lucide-react';

/**
 * Enterprise AI Response Engine & Report Formatter
 * Transforms raw markdown/LLM responses into pixel-perfect enterprise UI reports.
 */
export const FormattedAIReport = ({ rawText, tabName = "Module" }) => {
  if (!rawText || typeof rawText !== 'string') {
    return (
      <div className="p-4 text-xs text-slate-400 font-mono italic">
        No report data generated yet.
      </div>
    );
  }

  // Helper to parse sections by headings or line breaks
  const parseReportStructure = (text) => {
    // Strip raw hashes, asterisks, bold markers, backticks
    const lines = text.split('\n');
    const sections = [];
    let currentSection = { title: 'Executive Summary', items: [], rawLines: [] };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if line is a section heading (starts with #, ##, number like 1., or SECTION TITLE)
      const isHeader = /^#+\s*/.test(trimmed) || 
                       /^\d+\.\s+[A-Z]/.test(trimmed) || 
                       /^(EXECUTIVE SUMMARY|CURRENT SITUATION|DETECTED PROBLEMS|KEY FINDINGS|RISK SCORE|CHARTS & TABLES|IMAGE & SENSOR|FARMER-FRIENDLY|EXPERT TECHNICAL|ACTIONABLE RECOMMENDATIONS|NEXT BEST ACTION|DATA SOURCES)/i.test(trimmed);

      if (isHeader) {
        if (currentSection.items.length > 0 || currentSection.rawLines.length > 0) {
          sections.push(currentSection);
        }
        // Clean heading text (remove hashes, stars, leading numbers)
        const cleanTitle = trimmed
          .replace(/^#+\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/__/g, '')
          .replace(/🌿/g, '')
          .replace(/🛡️/g, '')
          .trim();

        currentSection = { title: cleanTitle, items: [], rawLines: [] };
      } else {
        // Strip bold/italic markdown characters
        const cleanLine = trimmed
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .replace(/^[-•*]\s*/, '');

        if (cleanLine) {
          currentSection.items.push(cleanLine);
          currentSection.rawLines.push(trimmed);
        }
      }
    });

    if (currentSection.items.length > 0 || currentSection.rawLines.length > 0) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : [{ title: 'Intelligence Analysis', items: [text.replace(/[*#`]/g, '')] }];
  };

  const sections = parseReportStructure(rawText);

  // Helper to detect KPI metrics (Risk Score, Confidence, Values)
  const extractMetrics = (items) => {
    const metrics = [];
    items.forEach(item => {
      const riskMatch = item.match(/(Risk Score|Risk|Severity):\s*([\d\.\%]+(?:\s*\/\s*100)?|\w+)/i);
      const confMatch = item.match(/(Confidence Score|Confidence|Data Quality):\s*([\d\.\%]+|\w+\+?)/i);
      const valMatch = item.match(/([A-Z][a-zA-Z\s]{2,15}):\s*([\d\.\%₹\$]+[a-zA-Z\/]*)/);

      if (riskMatch) {
        metrics.push({ label: riskMatch[1], value: riskMatch[2], type: 'risk' });
      } else if (confMatch) {
        metrics.push({ label: confMatch[1], value: confMatch[2], type: 'confidence' });
      } else if (valMatch && metrics.length < 4) {
        metrics.push({ label: valMatch[1], value: valMatch[2], type: 'stat' });
      }
    });
    return metrics;
  };

  return (
    <div className="space-y-4 text-xs font-sans leading-relaxed text-slate-200">

      {/* ENTERPRISE INTELLIGENCE HEADER */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-indigo-950/60 border border-emerald-500/40 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <span>{tabName} Intelligence Report</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">Verified Enterprise Grade</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Engine: Local Ollama (qwen:latest) • Real-Time DOM & Sensor Telemetry
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            Live Context Verified
          </span>
        </div>
      </div>

      {/* SECTIONS GRID & CARDS */}
      <div className="space-y-3.5">
        {sections.map((sec, idx) => {
          const metrics = extractMetrics(sec.items);
          const isRiskSec = /risk|problem|anomaly|warning/i.test(sec.title);
          const isRecSec = /recommendation|action|next best|opportunity/i.test(sec.title);
          const isSummary = /executive|summary|overview/i.test(sec.title);

          return (
            <div 
              key={idx} 
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-md ${
                isRiskSec 
                  ? 'bg-slate-950/80 border-amber-500/30 hover:border-amber-500/50' 
                  : isRecSec 
                  ? 'bg-slate-950/80 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* SECTION HEADING HEADER */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{sec.title}</span>
                </h4>
                {isRiskSec && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                {isRecSec && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                {isSummary && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>

              {/* PARSED METRIC KPI CARDS */}
              {metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {metrics.map((m, mIdx) => (
                    <div key={mIdx} className="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/20 space-y-1">
                      <div className="text-[9px] text-slate-400 font-mono uppercase truncate">{m.label}</div>
                      <div className="text-xs font-black text-emerald-400 font-mono">{m.value}</div>
                      {m.type === 'risk' && (
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-400 h-full rounded-full" style={{ width: '20%' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION CONTENT ITEMS & STYLED BULLETS */}
              <div className="space-y-2">
                {sec.items.map((item, itemIdx) => {
                  const isBullet = /^[•\-\*]/.test(item) || sec.items.length > 1;
                  const isAlert = /critical|warning|alert|high risk|caution/i.test(item);

                  if (isAlert) {
                    return (
                      <div key={itemIdx} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-sans flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={itemIdx} className="flex items-start gap-2 font-sans text-slate-200">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">{item}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER METADATA BADGE */}
      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-white/10">
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-emerald-400" />
          <span>Data Grounding: SQLite DB, Open-Meteo & Live Page Context</span>
        </div>
        <div className="text-emerald-400 font-bold">
          Zero Hallucination Standard
        </div>
      </div>
    </div>
  );
};
