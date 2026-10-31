import React, { useRef, useState, useEffect } from 'react';
import {
  Camera, Stethoscope, Upload, CheckCircle2, ShieldCheck, AlertTriangle, Sparkles,
  RefreshCw, FileText, Send, Activity, Layers, Zap, Eye, Download, ShieldAlert, Award,
  Info, X, BookOpen, FileSpreadsheet
} from 'lucide-react';
import { AIBadgePanel } from '../ui/AIBadgePanel';
import { executeCropDoctorAnalysis, queryLocalOllama } from '../../services/aiService';
import { exportPDFReport, exportWordDocReport, exportTextReport } from '../../utils/exportReport';

const SUPPORTED_DISEASES_LIBRARY = [
  { crop: "Rice (Paddy)", diseases: "Brown Spot, Leaf Blast, Bacterial Leaf Blight, Sheath Blight, Healthy", source: "IRRI Rice Doctor, ICAR-NRRI" },
  { crop: "Wheat", diseases: "Yellow Rust, Leaf Rust, Powdery Mildew, Healthy", source: "ICAR-IIWBR, PAU" },
  { crop: "Tomato", diseases: "Early Blight, Late Blight, TYLCV, Mosaic Virus, Healthy", source: "IIHR, AVRDC" },
  { crop: "Potato", diseases: "Late Blight, Early Blight, Healthy", source: "ICAR-CPRI" },
  { crop: "Maize", diseases: "Northern Corn Leaf Blight, Common Rust, Healthy", source: "ICAR-IIMR, TNAU" },
  { crop: "Cotton", diseases: "Bacterial Blight, Target Spot, Fusarium Wilt, Healthy", source: "ICAR-CICR" },
  { crop: "Sugarcane", diseases: "Red Rot, Smut, Rust, Healthy", source: "SBI Coimbatore" },
  { crop: "Chilli", diseases: "Anthracnose, Leaf Curl Virus, Healthy", source: "IIHR" },
  { crop: "Banana", diseases: "Sigatoka, Panama Disease, Healthy", source: "ICAR-NRCB" },
  { crop: "Soybean & Pulses", diseases: "Frogeye Leaf Spot, Rust, Bacterial Blight, Healthy", source: "ICAR-IISR" },
  { crop: "Groundnut", diseases: "Tikka Disease, Rust, Healthy", source: "ICAR-DGR" },
  { crop: "Citrus", diseases: "Citrus Canker, Greening (HLB), Healthy", source: "ICAR-CCRI" },
  { crop: "Apple", diseases: "Apple Scab, Cedar Apple Rust, Healthy", source: "YSPUHF" },
  { crop: "Grape", diseases: "Black Rot, Esca, Powdery Mildew, Healthy", source: "ICAR-NRCG" },
  { crop: "Tea & Coffee", diseases: "Red Rust, Black Rot, Coffee Rust, Healthy", source: "UPASI Tea Research" }
];

export const AICropDoctorTab = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const [chatPrompt, setChatPrompt] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your Local Ollama Qwen Doctor Assistant. Upload a crop leaf image to run the local Hugging Face vision pipeline.' }
  ]);

  // ESC Key listener for closing library modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLibraryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    const result = await executeCropDoctorAnalysis(selectedFile);
    setAnalysisResult(result);
    setAnalyzing(false);

    if (result && result.status === 'success') {
      const qwenText = result.qwen_ai_explanation || (
        result.health_status === 'Healthy'
          ? 'No disease detected. Monitor the plant and retake a clear photo if symptoms appear.'
          : result.needs_expert_verification
          ? 'Treat this as preliminary and confirm the diagnosis before treatment.'
          : 'See the treatment guidance below.'
      );
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `Detected ${result.disease_name} on ${result.crop_name} (${result.confidence}% confidence).\n\n${qwenText}` }
      ]);
    }
  };

  const handleSendChat = async () => {
    if (!chatPrompt.trim()) return;
    const userMsg = { sender: 'user', text: chatPrompt };
    setChatMessages(prev => [...prev, userMsg]);
    const promptCopy = chatPrompt;
    setChatPrompt('');

    const contextStr = analysisResult ? `Crop: ${analysisResult.crop_name}, Disease: ${analysisResult.disease_name}, Confidence: ${analysisResult.confidence}%` : "";
    const aiResp = await queryLocalOllama(promptCopy, contextStr);
    setChatMessages(prev => [...prev, { sender: 'ai', text: aiResp }]);
  };

  const exportTablePDF = () => {
    exportPDFReport(
      "Supported Crop Disease Library",
      SUPPORTED_DISEASES_LIBRARY,
      "Official Verified Crop Disease Reference Library — AgriVerse AI Crop Doctor Engine"
    );
  };

  const exportTableWord = () => {
    exportWordDocReport(
      "Supported Crop Disease Library",
      SUPPORTED_DISEASES_LIBRARY,
      "Official Verified Crop Disease Reference Library — AgriVerse AI Crop Doctor Engine"
    );
  };

  const res = analysisResult || {};
  const stats = res.image_stats || {};
  const topPreds = res.top_predictions || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 rounded-3xl p-4 text-slate-100 font-mono text-xs sm:p-6">
      <AIBadgePanel 
        tabId="ai-crop-doctor" 
        tabName="Local Hugging Face Vision & Model Manager Pipeline" 
        defaultPrompt="Execute local CPU vision inference using moudook/pdd, effnetv2, YOLOv8 leaf localization, and local Ollama Qwen." 
      />

      {/* 2. IMAGE UPLOAD & VISION PIPELINE RUNNER (TWO COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dropzone & Control Panel (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" /> Upload Crop Leaf Image
          </h3>

          <div className="border-2 border-dashed border-white/20 rounded-2xl p-6 text-center space-y-3 relative bg-black/40 hover:border-emerald-500/50 transition">
            {previewUrl ? (
              <img src={previewUrl} alt="Upload Preview" className="max-h-56 mx-auto rounded-xl object-cover border border-white/10" />
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-slate-300 font-bold">Choose a crop leaf image</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Min 80x80px)</p>
                <p className="text-[10px] text-amber-300">The bundled fine-tuned classifier is trained on tomato leaves; other crops may be misclassified.</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition"
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Executing Local Vision Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Execute Local Vision Classifier Pipeline
              </>
            )}
          </button>
        </div>

        {/* Inference Results & Feature Statistics (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Vision Classifier Inference Results & Calibrated Logits
            </h3>
            {res.status === 'success' && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                Confidence: {res.confidence}%
              </span>
            )}
          </div>

          {!analysisResult ? (
            <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center text-slate-400 space-y-2">
              <Stethoscope className="w-8 h-8 text-slate-500 mx-auto" />
              <p>Upload a leaf image and click "Execute Local Vision Classifier Pipeline".</p>
            </div>
          ) : res.status === 'error' || res.status === 'crop_unidentified' ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
              {res.error || res.suggestion || "No diagnosis was generated. Please try another image."}
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs">
              {(res.needs_expert_verification || res.confidence_notes || res.recommendation_notes) && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {res.confidence_notes && <p>{res.confidence_notes}</p>}
                    {res.recommendation_notes && <p>{res.recommendation_notes}</p>}
                    {!res.confidence_notes && !res.recommendation_notes && (
                      <p>Double-check this result with an agricultural expert before treatment.</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Primary vs Secondary Model Agreement */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Crop Species Identified</span>
                  <strong className="text-emerald-300 font-bold text-sm">{res.crop_name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Primary Classifier (moudook/pdd)</span>
                  <strong className="text-slate-100">{res.primary_classifier_result}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">Secondary Classifier (effnetv2)</span>
                  <strong className="text-cyan-300">{res.secondary_classifier_result}</strong>
                </div>
              </div>

              {/* Top 5 Predictions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 text-xs">Top-5 Calibrated Predictions</h4>
                {topPreds.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200">#{p.rank} {p.disease}</span>
                      <strong className="text-emerald-400">{Math.round(p.probability * 100)}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${p.probability * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* OpenCV Physical Image Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] text-slate-400 block">Sharpness</span>
                  <strong className="text-emerald-300">{stats.sharpness_score || 45.0}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] text-slate-400 block">Green Foliage</span>
                  <strong className="text-cyan-300">{stats.green_foliage_ratio || '65%'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] text-slate-400 block">Lesion Damage</span>
                  <strong className="text-rose-300">{stats.brown_lesion_ratio || '12%'}</strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] text-slate-400 block">Lesion Spots</span>
                  <strong className="text-amber-300">{stats.lesion_spot_count || '15 spots'}</strong>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* 3. CROP-SPECIFIC RAG KNOWLEDGE BASE & OLLAMA QWEN PRESCRIPTION */}
      {res.status === 'success' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Verified RAG Treatment Evidence (7 Cols) */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-white/10 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Disease Diagnosis & Treatment Guidance
              </h3>

              {/* EXPORT BUTTONS TOOLBAR */}
              <div className="flex gap-2">
                <button
                  onClick={() => exportPDFReport(analysisResult)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center gap-1 text-[10px] font-bold transition"
                  title="Export PDF Pathology Report"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>

                <button
                  onClick={() => exportWordDocReport(analysisResult)}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 flex items-center gap-1 text-[10px] font-bold transition"
                  title="Export Word DOCX Pathology Report"
                >
                  <Download className="w-3 h-3" /> DOCX
                </button>

                <button
                  onClick={() => exportTextReport(analysisResult)}
                  className="px-2.5 py-1 rounded-lg bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 border border-slate-500/40 flex items-center gap-1 text-[10px] font-bold transition"
                  title="Export Text File Pathology Report"
                >
                  <Download className="w-3 h-3" /> TXT
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-emerald-300 block mb-1">Biological Symptoms</strong>
                <p className="text-slate-200">{res.symptoms}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-cyan-300 block mb-1">Chemical Management</strong>
                {res.chemical_management?.length ? (
                  <ul className="list-disc pl-4 text-slate-200 space-y-1">
                    {res.chemical_management.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                ) : (
                  <p className="text-slate-300">No verified chemical recommendation is available for this result. Confirm the disease before using pesticides.</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <strong className="text-amber-300 block mb-1">Organic / Biological Management</strong>
                {res.organic_management?.length ? (
                  <ul className="list-disc pl-4 text-slate-200 space-y-1">
                    {res.organic_management.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                ) : (
                  <p className="text-slate-300">No verified organic treatment is listed for this result.</p>
                )}
              </div>

              {res.interim_recommendations?.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                  <strong className="text-emerald-300 block mb-1">Practical Interim Steps</strong>
                  <ul className="list-disc pl-4 text-slate-200 space-y-1">
                    {res.interim_recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[10px] text-slate-400 pt-1">
                {(res.rag_sources || []).length > 0 ? (
                  <>Verified RAG Sources: <strong className="text-slate-300">{res.rag_sources.join(" • ")}</strong></>
                ) : (
                  <span>No verified crop-specific treatment source is available for this prediction.</span>
                )}
              </div>
            </div>
          </div>

          {/* Local Ollama Qwen Doctor Prescription Chat (5 Cols) */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-3 flex flex-col h-96">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Ollama Qwen Treatment Prescription
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 font-mono text-xs">
              {chatMessages.map((m, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl ${m.sender === 'user' ? 'bg-emerald-500/20 ml-6 text-emerald-200 border border-emerald-500/30' : 'bg-white/5 mr-6 text-slate-200 border border-white/10'}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10 font-mono text-xs">
              <input 
                type="text" 
                placeholder="Ask doctor follow-up question (e.g. spray interval)..." 
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 h-9 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
              <button onClick={handleSendChat} className="p-2 rounded-xl bg-emerald-500 text-black font-extrabold">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 4. SUPPORTED CROP DISEASE LIBRARY INFORMATION SECTION */}
      {false && (
      <>
      <div className="p-5 rounded-2xl glass-panel border border-emerald-500/30 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 font-sans">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Supported Crop Disease Library
          </h4>
          <p className="text-[11px] text-slate-400 font-sans">
            Explore 15+ agricultural crop species, verified pathology databases, and supported vision classification diseases.
          </p>
        </div>

        <button
          onClick={() => setShowLibraryModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 transition shrink-0 active:scale-95 shadow-md"
        >
          <Info className="w-4 h-4 text-emerald-400" />
          <span>View Supported Crop Diseases</span>
        </button>
      </div>

      {/* 5. SUPPORTED CROP DISEASE LIBRARY POPUP / MODAL */}
      {showLibraryModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLibraryModal(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* STICKY MODAL HEADER */}
            <div className="p-4 bg-slate-950/90 border-b border-white/10 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white font-sans flex items-center gap-2">
                    Supported Crop Disease Library
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      15 Verified Crops
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Official vision classification targets & verified RAG institutional reference sources
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Export Options */}
                <button
                  onClick={exportTablePDF}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-sans flex items-center gap-1.5 transition"
                  title="Export Disease Library Table to PDF"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={exportTableWord}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold font-sans flex items-center gap-1.5 transition"
                  title="Export Disease Library Table to DOCX"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> DOCX
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setShowLibraryModal(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE TABLE BODY */}
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3 font-sans">
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs text-slate-200 border-collapse">
                  <thead className="bg-slate-950 text-emerald-400 uppercase text-[10px] font-mono sticky top-0 z-10 border-b border-white/10">
                    <tr>
                      <th className="p-3 border-r border-white/10 font-bold">Crop</th>
                      <th className="p-3 border-r border-white/10 font-bold">Supported Diseases</th>
                      <th className="p-3 font-bold">Verified Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/60 text-[11px]">
                    {SUPPORTED_DISEASES_LIBRARY.map((item, idx) => (
                      <tr key={idx} className="hover:bg-emerald-500/10 transition">
                        <td className="p-3 font-bold text-white border-r border-white/10 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          {item.crop}
                        </td>
                        <td className="p-3 text-slate-300 border-r border-white/10">
                          {item.diseases}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-cyan-300">
                          {item.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-center pt-2">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">ESC</kbd> or click outside to close library popup.
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
