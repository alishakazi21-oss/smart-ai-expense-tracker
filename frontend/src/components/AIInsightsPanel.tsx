import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Brain,
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  Upload,
  Mic,
  MicOff,
  Check,
  AlertTriangle,
  Lightbulb,
  FileText,
  Bookmark,
  ChevronRight,
  TrendingDown,
  Loader2,
  Plus
} from "lucide-react";

interface AIInsightsPanelProps {
  onRefreshExpenses: () => void;
}

export default function AIInsightsPanel({ onRefreshExpenses }: AIInsightsPanelProps) {
  // AI States
  const [analysis, setAnalysis] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [memory, setMemory] = useState<any>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Receipt Scan States
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Entry States
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  
  // Custom Speech Recognition (Browser Web API)
  const recognitionRef = useRef<any>(null);

  const fetchAIData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const [analysisRes, predictRes, savingsRes, memoryRes] = await Promise.all([
        axios.get("/api/ai/analyze", config),
        axios.get("/api/ai/predict", config),
        axios.get("/api/ai/savings", config),
        axios.get("/api/ai/memory", config)
      ]);

      setAnalysis(analysisRes.data);
      setPrediction(predictRes.data);
      setSavings(savingsRes.data);
      setMemory(memoryRes.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load AI financial metrics. Make sure backend is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set to Indian English for Rupees context

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setVoiceInput(text);
        handleVoiceParse(text);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Google Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setVoiceInput("");
      setVoiceResult(null);
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleVoiceParse = async (textToParse: string) => {
    const text = textToParse || voiceInput;
    if (!text || !text.trim()) return;
    
    setVoiceParsing(true);
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const res = await axios.post("/api/ai/voice-entry", { text }, config);
      if (res.data.success && res.data.parsed) {
        setVoiceResult(res.data.parsed);
      } else {
        alert("Voice analysis error: " + (res.data._error || "Could not understand"));
      }
    } catch (err) {
      alert("Failed to reach voice entry route");
    } finally {
      setVoiceParsing(false);
    }
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScannedResult(null);

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    };

    try {
      const res = await axios.post("/api/ai/upload-receipt", formData, config);
      if (res.data.success && res.data.extracted) {
        setScannedResult(res.data.extracted);
      } else {
        alert("OCR Scan error: " + (res.data._error || "Failed to scan"));
      }
    } catch (err) {
      alert("Failed to scan receipt");
    } finally {
      setScanning(false);
    }
  };

  const saveExtractedExpense = async (data: any) => {
    const token = localStorage.getItem("token");
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      await axios.post("/api/expenses", {
        title: data.title || data.shop_name,
        amount: parseFloat(data.amount),
        category: data.category || "Other",
        date: data.date,
        note: `Extracted via SpendWise AI (${data.confidence ? Math.round(data.confidence*100) : 100}% confidence)`
      }, config);
      
      alert("Expense added successfully!");
      setScannedResult(null);
      setVoiceResult(null);
      setVoiceInput("");
      onRefreshExpenses();
      fetchAIData(true);
    } catch (err) {
      alert("Failed to save transaction");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
        <p className="text-white/60 text-lg font-medium animate-pulse">Consulting your AI Financial Advisor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Brain className="text-indigo-400 w-6 h-6 animate-pulse" />
            SpendWise AI Hub
          </h3>
          <p className="text-sm text-white/40">Multi-agent intelligence working together to optimize your financial habits.</p>
        </div>
        <button
          onClick={() => fetchAIData(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
        >
          {refreshing && <Loader2 className="animate-spin w-4 h-4" />}
          Refresh Insights
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Grid containing Quick Entry tools (OCR & Voice) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* OCR Receipt Scanner */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
            <FileText className="text-indigo-400 w-5 h-5" />
            OCR Receipt Scanner
          </h4>
          <p className="text-xs text-white/40 mb-6">Scan grocery bills, food receipts, or shop invoices. AI extracts amounts and tags automatically.</p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUploadReceipt}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="w-full py-5 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/20 transition-all flex items-center justify-center gap-3"
          >
            {scanning ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Scanning Bill...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload Receipt Image
              </>
            )}
          </button>

          {/* OCR Scanned Preview / Approval */}
          {scannedResult && (
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1">
                <Check size={14} /> Scan Completed ({Math.round((scannedResult.confidence || 0.8) * 100)}% Match)
              </span>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-white/40 text-xs">Merchant</span>
                  <p className="font-bold text-white">{scannedResult.shop_name}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Amount</span>
                  <p className="font-bold text-rose-400">₹{scannedResult.amount}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Category</span>
                  <p className="font-bold text-indigo-400">{scannedResult.category}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Date</span>
                  <p className="font-bold text-white">{scannedResult.date}</p>
                </div>
              </div>
              <button
                onClick={() => saveExtractedExpense(scannedResult)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-[#030303] font-black rounded-xl text-sm transition-all"
              >
                Approve and Add Expense
              </button>
            </div>
          )}
        </div>

        {/* Voice Expense Entry */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Mic className="text-rose-400 w-5 h-5" />
            Voice Expense Entry
          </h4>
          <p className="text-xs text-white/40 mb-6">Talk naturally to add expenses. Say things like "Spent three hundred rupees for pasta today".</p>

          <div className="flex gap-3">
            <button
              onClick={toggleRecording}
              className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${
                isRecording
                  ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <input
              type="text"
              placeholder="Or type: Spent 250 for snacks"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVoiceParse("")}
            />
          </div>

          {voiceParsing && (
            <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
              <Loader2 className="animate-spin w-4 h-4" />
              Parsing spoken phrase...
            </div>
          )}

          {/* Voice Scanned Preview / Approval */}
          {voiceResult && (
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <span className="text-xs text-rose-400 font-bold tracking-wider uppercase flex items-center gap-1">
                <Sparkles size={14} /> Natural Language Parsed
              </span>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-white/40 text-xs">Expense Item</span>
                  <p className="font-bold text-white">{voiceResult.title}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Amount</span>
                  <p className="font-bold text-rose-400">₹{voiceResult.amount}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Category</span>
                  <p className="font-bold text-indigo-400">{voiceResult.category}</p>
                </div>
                <div>
                  <span className="text-white/40 text-xs">Date</span>
                  <p className="font-bold text-white">{voiceResult.date}</p>
                </div>
              </div>
              <button
                onClick={() => saveExtractedExpense(voiceResult)}
                className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-sm transition-all"
              >
                Approve and Add Expense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main AI Insights Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: AI Spending Analysis & Memory */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Category Analysis Card */}
          {analysis && (
            <div className="bg-white/5 border border-white/10 p-8 rounded-[36px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px]" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="font-black text-lg">AI Category Analysis</h4>
                  <span className="text-xs text-white/40">Powered by AnalysisAgent</span>
                </div>
              </div>

              {/* AI Natural Language Text */}
              <div className="p-5 rounded-2xl bg-indigo-600/5 border border-indigo-500/10 text-white/80 leading-relaxed text-sm mb-6 whitespace-pre-line font-medium italic">
                "{analysis.summary}"
              </div>

              {/* Category Growth list */}
              <div className="space-y-4">
                <h5 className="font-bold text-xs text-white/40 uppercase tracking-widest">Growth Trends vs Last Month</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.comparison?.slice(0, 4).map((item: any) => {
                    const isUp = item.change_pct > 0;
                    return (
                      <div key={item.category} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">{item.category}</p>
                          <p className="text-xs text-white/40">₹{item.current} current</p>
                        </div>
                        <div className={`flex items-center gap-1 font-bold text-xs ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {isUp ? '+' : ''}{item.change_pct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Long-term memory store */}
          {memory && memory.memories && Object.keys(memory.memories).length > 0 && (
            <div className="bg-white/5 border border-white/10 p-8 rounded-[36px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/10 text-amber-400 flex items-center justify-center">
                  <Bookmark size={20} />
                </div>
                <div>
                  <h4 className="font-black text-lg">Long-Term Memory Bank</h4>
                  <span className="text-xs text-white/40">Stored context informing AI recommendations</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(memory.memories).map(([key, val]: any) => {
                  const title = key.replace("_", " ").toUpperCase();
                  return (
                    <div key={key} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
                      <span className="text-white/30 text-[10px] tracking-widest font-black uppercase block mb-1">{title}</span>
                      <p className="text-sm font-semibold text-white/80">{val}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Month-End Predictions & Savings Agent */}
        <div className="space-y-8">
          
          {/* Monthly Predictions Card */}
          {prediction && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-rose-600/10 text-rose-400 flex items-center justify-center">
                  <Target size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Predictive Analysis</h4>
                  <span className="text-[10px] text-white/40">PredictionAgent</span>
                </div>
              </div>

              {/* Forecast stat */}
              <div className="mb-4">
                <span className="text-xs text-white/40 font-medium">Projected Month-End Expenses</span>
                <p className="text-3xl font-black text-rose-400 tracking-tight mt-1">₹{prediction.projected_total?.toLocaleString()}</p>
                <div className="flex justify-between text-xs text-white/30 mt-2 font-medium">
                  <span>Daily Avg: ₹{prediction.daily_average?.toFixed(0)}</span>
                  <span>Days Left: {prediction.days_remaining}</span>
                </div>
              </div>

              {/* Narrative Prompt output */}
              <p className="text-xs text-white/60 bg-white/[0.02] border border-white/5 p-4 rounded-xl italic leading-relaxed mb-4">
                "{prediction.narrative}"
              </p>

              {/* Alert Items */}
              {prediction.alerts && prediction.alerts.length > 0 && (
                <div className="space-y-2">
                  {prediction.alerts.map((alert: string, idx: number) => (
                    <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Savings Advisor Agent Card */}
          {savings && (
            <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Savings Advisor</h4>
                  <span className="text-[10px] text-white/40">SavingsAdvisorAgent</span>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-xs text-white/40 font-medium">Potential Monthly Savings</span>
                <p className="text-3xl font-black text-emerald-400 tracking-tight mt-1">₹{savings.potential_savings?.toLocaleString()}</p>
              </div>

              {/* Savings Tips List */}
              <div className="space-y-3 mt-4">
                {savings.tips?.split("\n").filter(Boolean).map((tip: string, idx: number) => (
                  <div key={idx} className="p-3 bg-emerald-500/5 border border-emerald-500/10 text-emerald-300 text-xs rounded-xl flex gap-2 items-start font-medium">
                    <Zap size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{tip.replace(/^\d+\.\s*/, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
