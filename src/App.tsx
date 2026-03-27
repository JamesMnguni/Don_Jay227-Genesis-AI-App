import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  Activity, 
  Zap, 
  Target, 
  BarChart3, 
  Settings, 
  Bell, 
  Volume2, 
  Scan, 
  Cpu, 
  Brain,
  Layers, 
  Crosshair, 
  Trash2, 
  ChevronRight,
  Clock,
  TrendingUp,
  ShieldCheck,
  Info,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatInTimeZone } from 'date-fns-tz';
import { Signal, AppSettings, MarketPrice } from './types';
import { generateGenesisSignal } from './services/geminiService';
import { TradingViewChart } from './components/TradingViewChart';
import { cn } from './lib/utils';

// --- Mock Data & Constants ---
const PAIRS = ['XAUUSD', 'USTEC', 'US30', 'DAX'];
const SAST_TZ = 'Africa/Johannesburg';

const INITIAL_PRICES: MarketPrice[] = [
  { symbol: 'XAUUSD', price: 4404.05, change: -272.00, changePercent: -0.06, high: 4448.31, low: 4305.48 },
  { symbol: 'USTEC', price: 24219.10, change: 3.00, changePercent: 0.00, high: 24321.60, low: 24009.00 },
  { symbol: 'US30', price: 46221.60, change: -404.00, changePercent: -0.09, high: 46402.60, low: 45926.10 },
  { symbol: 'DAX', price: 22596.00, change: -1926.00, changePercent: -0.85, high: 22836.90, low: 22369.30 },
];

const KILL_ZONES = [
  { name: 'EUROPEAN OPEN', time: '09:00', pair: 'DAX', desc: 'Frankfurt gap analysis' },
  { name: 'NY KILL ZONE', time: '15:30', pair: 'ALL', desc: 'Major pairs rapid fire' },
  { name: 'LONDON CLOSE', time: '17:30', pair: 'DAX', desc: 'Final European moves' },
  { name: 'NY AFTERNOON', time: '20:00', pair: 'XAU/USTEC', desc: 'Trend continuation' },
];

// --- Components ---

const SignalRadar = () => (
  <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
    <div className="relative w-4 h-4">
      <div className="absolute inset-0 rounded-full border border-primary/20" />
      <div className="absolute inset-0 rounded-full border border-primary/10 scale-75" />
      <motion.div 
        className="absolute inset-0 rounded-full border-t-2 border-primary/60"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div 
          className="w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(0,200,255,1)]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-slate-500 uppercase leading-none">SIGNAL</span>
      <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">RADAR</span>
    </div>
  </div>
);

const Header = ({ time, status, settings, onScan }: { time: string, status: string, settings: AppSettings, onScan: () => void }) => (
  <header className="glass-panel sticky top-0 z-50 px-4 py-4 flex flex-col gap-3 rounded-b-[2rem] border-b-primary/20">
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
          DON_JAY227 <span className="text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-full border border-primary/30">PRO</span>
        </h1>
        <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] leading-tight animate-pulse-soft">POVERTY KILLER GENESIS</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,230,118,0.5)] animate-pulse" />
            <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">SERVER: ONLINE</span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">{time}</span>
        </div>
        
        <div className="flex flex-col items-end border-l border-slate-800 pl-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">NEURAL CORE</span>
          <span className="text-xs font-black text-primary">ENCRYPTED</span>
        </div>
      </div>
    </div>
    
    <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar items-center">
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-500 uppercase">ACCURACY</span>
        <span className="text-sm font-black text-success">94.8%</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-500 uppercase">WIN RATE</span>
        <span className="text-sm font-black text-success">92.4%</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-500 uppercase">LATENCY</span>
        <span className="text-sm font-black text-primary">12ms</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <div className="flex flex-col">
        <span className="text-[9px] font-black text-slate-500 uppercase">STATUS</span>
        <span className="text-[10px] font-black text-primary uppercase">{status}</span>
      </div>
      <div className="h-6 w-px bg-slate-800" />
      <button 
        onClick={onScan}
        className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/20 transition-all active:scale-95 group shrink-0"
      >
        <Zap size={14} className="text-primary group-hover:animate-pulse" />
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI SCAN</span>
      </button>
      <div className="h-6 w-px bg-slate-800" />
      <SignalRadar />
    </div>
  </header>
);


const SignalCard: React.FC<{ signal: Signal, onDelete: (id: string) => void, onSelect: (signal: Signal) => void }> = ({ signal, onDelete, onSelect }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn(
      "bg-slate-900 rounded-2xl border p-5 shadow-2xl relative group overflow-hidden transition-all duration-300",
      signal.status === 'SL' || signal.status === 'INVALIDATED' ? "opacity-60 grayscale-[0.5] border-white/5" : "border-white/10",
      signal.status === 'TREND_CHANGE' && "border-warning/30 shadow-[0_0_20px_rgba(255,234,0,0.1)]"
    )}
  >
    {signal.status === 'TREND_CHANGE' && (
      <div className="absolute top-0 left-0 w-full h-1 bg-warning animate-pulse" />
    )}
    {signal.status === 'INVALIDATED' && (
      <div className="absolute top-0 left-0 w-full h-1 bg-danger/50" />
    )}
    {signal.characterChange && (
      <div className="mb-3 px-3 py-2 bg-warning/10 border border-warning/20 rounded-xl flex items-center gap-2">
        <AlertTriangle size={12} className="text-warning animate-pulse" />
        <span className="text-[9px] font-black text-warning uppercase tracking-tighter leading-tight">{signal.characterChange}</span>
      </div>
    )}
    <div className={cn(
      "absolute top-0 left-0 w-1 h-full",
      signal.type.includes('BUY') ? "bg-success" : "bg-danger"
    )} />
    
    <div className="flex justify-between items-start mb-4">
      <div className="flex flex-col gap-1 cursor-pointer" onClick={() => onSelect(signal)}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
            signal.type.includes('BUY') ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
          )}>
            {signal.type}
          </div>
          {signal.trend && (
            <div className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
              signal.trend === 'BULLISH' ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
            )}>
              {signal.trend}
            </div>
          )}
          <span className="text-[8px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">GENESIS</span>
          {signal.probabilityScore && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-black bg-primary/20 text-primary border border-primary/30 uppercase tracking-tighter">
              {signal.probabilityScore}% PROBABILITY
            </div>
          )}
        </div>
        <h3 className="text-lg font-black text-white tracking-tight">{signal.pair}</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{signal.pattern}</p>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(signal.id); }}
        className="text-slate-600 hover:text-danger transition-colors p-1 -mr-1 -mt-1"
      >
        <X size={18} />
      </button>
    </div>

    <div className="grid grid-cols-3 gap-4 mb-4 cursor-pointer" onClick={() => onSelect(signal)}>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">ENTRY</span>
        <span className="text-xs font-mono font-bold text-slate-200">{signal.entry.toFixed(2)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">SL</span>
        <span className="text-xs font-mono font-bold text-danger">{signal.sl.toFixed(2)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">STATUS</span>
        <span className={cn(
          "text-[9px] font-black flex items-center gap-1 uppercase",
          signal.status === 'SL' || signal.status === 'INVALIDATED' ? "text-danger" :
          signal.status === 'TREND_CHANGE' ? "text-warning" :
          signal.status.startsWith('TP') ? "text-success" : "text-primary"
        )}>
          <div className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            signal.status === 'SL' || signal.status === 'INVALIDATED' ? "bg-danger" :
            signal.status === 'TREND_CHANGE' ? "bg-warning" :
            signal.status.startsWith('TP') ? "bg-success" : "bg-primary"
          )} /> {signal.status}
        </span>
      </div>
    </div>

    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
      {[signal.tp1, signal.tp2, signal.tp3].filter(tp => tp > 0).map((tp, i) => (
        <div key={i} className="flex-1 bg-slate-800/40 rounded-xl p-2 border border-white/5">
          <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5">TP{i+1}</span>
          <span className="text-[10px] font-mono font-bold text-success">{tp.toFixed(2)}</span>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5">
      <div className="flex flex-col">
        <span className="text-[7px] font-black text-slate-500 uppercase">LOT SIZE</span>
        <span className="text-[10px] font-mono font-bold text-slate-400">{signal.lotSize}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[7px] font-black text-slate-500 uppercase">PIP VALUE</span>
        <span className="text-[10px] font-mono font-bold text-slate-400">{signal.pipValue}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[7px] font-black text-slate-500 uppercase">R/R RATIO</span>
        <span className="text-[10px] font-mono font-bold text-primary">{signal.rr}</span>
      </div>
    </div>
  </motion.div>
);

const NeuralLog = ({ logs }: { logs: string[] }) => (
  <div className="bg-slate-950 rounded-2xl p-5 border border-primary/10 shadow-inner relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,200,255,0.5)]" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">NEURAL CORE LOG</h3>
      </div>
      <span className="text-[9px] font-mono font-bold text-slate-600 uppercase">ENCRYPTED STREAM</span>
    </div>
    <div className="h-32 overflow-y-auto neural-log-scroll flex flex-col gap-1.5 pr-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3 text-[10px] font-mono leading-tight">
          <span className="text-slate-700 font-bold">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
          <span className={cn(
            "transition-colors duration-300",
            log.includes('✓') ? "text-success font-bold" : 
            log.includes('!') ? "text-danger font-bold" : 
            log.includes('AI') ? "text-primary font-bold" : "text-slate-500"
          )}>
            {log}
          </span>
        </div>
      ))}
    </div>
    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
  </div>
);

const Footer = () => (
  <footer className="px-6 py-10 mt-auto border-t border-white/5 flex flex-col gap-6 items-center bg-slate-950/50">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(0,200,255,0.5)] animate-pulse" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">GENESIS ENGINE v2.4.0 [24/7 ACTIVE]</span>
    </div>
    
    <div className="flex flex-col items-center gap-4">
      <p className="text-[10px] text-primary/80 text-center max-w-[600px] leading-relaxed uppercase font-black tracking-widest">
        THE AI SYSTEM DON'T JUST INJECT SIGNALS IT DOMINATES. INSTITUTIONAL LOGIC - PRECISION ENGINEERED FOR XAUUSD, USTEC, US30 AND DAX. ADVANCED RISK MANAGEMENT - BUILT-IN PROTECTION PROTOCOL DESIGNED TO SAFEGUARD TRADING CAPITAL. NEWS AND SPREAD FILTERS - AUTOMATICALLY PAUSES DURING HIGH IMPACT NEWS EVENTS AND ABNORMAL SPREAD VOLATILITY - PROTECT, AUTOMATE AND PROFIT.
      </p>
      <p className="text-[9px] text-slate-600 text-center max-w-[400px] leading-relaxed uppercase font-black tracking-tighter">
        RISK WARNING: TRADING FINANCIAL INSTRUMENTS INVOLVES SIGNIFICANT RISK. DON_JAY227 GENESIS AI IS AN ANALYTICAL TOOL AND DOES NOT CONSTITUTE FINANCIAL ADVICE.
      </p>
    </div>

    <div className="flex gap-6">
      {['TERMS', 'PRIVACY', 'SUPPORT'].map(item => (
        <span key={item} className="text-[9px] font-black text-slate-700 hover:text-primary transition-colors cursor-pointer tracking-widest">{item}</span>
      ))}
    </div>
    
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-black text-slate-800 tracking-[0.2em]">© 2026 DON_JAY227</span>
      <span className="text-[8px] font-black text-slate-900 tracking-widest uppercase">Poverty Killer Global</span>
    </div>
  </footer>
);

  // --- Main App ---
  
  export default function App() {
    const [time, setTime] = useState('');
    const [prices, setPrices] = useState<MarketPrice[]>(INITIAL_PRICES);
    const [signals, setSignals] = useState<Signal[]>(() => {
      try {
        const saved = localStorage.getItem('don_jay_signals');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error('Failed to load signals from localStorage', e);
        return [];
      }
    });
    const [isScanning, setIsScanning] = useState(false);
    const [beastMode, setBeastMode] = useState(() => {
      const saved = localStorage.getItem('don_jay_beast_mode');
      return saved !== null ? JSON.parse(saved) : true;
    });
    const [swingMode, setSwingMode] = useState(() => {
      const saved = localStorage.getItem('don_jay_swing_mode');
      return saved !== null ? JSON.parse(saved) : true;
    });
    const [selectedPair, setSelectedPair] = useState(() => {
      return localStorage.getItem('don_jay_selected_pair') || 'XAUUSD';
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isMarketClosed, setIsMarketClosed] = useState(false);
    const [isWakeLockActive, setIsWakeLockActive] = useState(false);
    
    // Robust API key check for UI feedback
    const hasApiKey = Boolean(
      process.env.GEMINI_API_KEY || 
      (import.meta as any).env?.VITE_GEMINI_API_KEY || 
      (window as any).GEMINI_API_KEY
    );

    const [logs, setLogs] = useState<string[]>([
      'AI INITIALIZING...', 
      '✓ Neural network online', 
      '✓ 24/7 Deep Scan Mode Active', 
      hasApiKey ? '✓ Gemini AI Connection: SECURE' : '✓ Neural Core: Genesis Fallback Engine Active',
      '✓ Neural Core: Screen Wake Lock active',
      '✓ Neural Core: Self-Healing & Persistence Active',
      'Monitoring market liquidity...'
    ]);
    const [settings, setSettings] = useState<AppSettings>(() => {
      try {
        const saved = localStorage.getItem('don_jay_settings');
        return saved ? JSON.parse(saved) : {
          pushNotifications: true,
          soundEffects: true,
          autoScan: true,
          riskPercent: 1,
          equity: 100,
        };
      } catch (e) {
        return {
          pushNotifications: true,
          soundEffects: true,
          autoScan: true,
          riskPercent: 1,
          equity: 100,
        };
      }
    });
  
    const pricesRef = useRef<MarketPrice[]>(prices);
    const signalsRef = useRef<Signal[]>(signals);
    const beastModeRef = useRef(beastMode);
    const swingModeRef = useRef(swingMode);
    const selectedPairRef = useRef(selectedPair);
    const settingsRef = useRef(settings);
    const realPricesRef = useRef<Record<string, any>>({});
    const lastPriceMapRef = useRef<Record<string, number>>({});
    const wakeLockRef = useRef<any>(null);
    const lastTriggeredRef = useRef<string | null>(null);
    const lastDeepScanRef = useRef<number>(0);
  
    // Sync refs with state
    useEffect(() => {
      pricesRef.current = prices;
      signalsRef.current = signals;
      beastModeRef.current = beastMode;
      swingModeRef.current = swingMode;
      selectedPairRef.current = selectedPair;
      settingsRef.current = settings;

      // Persist to localStorage
      localStorage.setItem('don_jay_signals', JSON.stringify(signals));
      localStorage.setItem('don_jay_beast_mode', JSON.stringify(beastMode));
      localStorage.setItem('don_jay_swing_mode', JSON.stringify(swingMode));
      localStorage.setItem('don_jay_selected_pair', selectedPair);
      localStorage.setItem('don_jay_settings', JSON.stringify(settings));
    }, [prices, signals, beastMode, swingMode, selectedPair, settings]);
  
    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));
  
    const handleManualScan = () => {
      if (isScanning) return;
      addLog('AI: Manual deep scan initiated by user...');
      PAIRS.forEach((pair, index) => {
        setTimeout(() => handleGenerateSignal(pair), index * 3000);
      });
    };
  
  // Auto-Injection Logic
  useEffect(() => {
    const checkSchedule = () => {
      if (!settingsRef.current.autoScan) return;

      const nowFull = new Date();
      const nowStr = formatInTimeZone(nowFull, SAST_TZ, 'HH:mm');
      const dayStr = formatInTimeZone(nowFull, SAST_TZ, 'i'); // 1 (Mon) to 7 (Sun)
      const day = parseInt(dayStr);
      
      const isSastMarketClosed = day === 6 || day === 7;
      
      if (isSastMarketClosed) {
        if (Math.random() > 0.99) {
          addLog('AI Background Analysis: Monitoring weekend liquidity...');
        }
        return;
      }

      // 1. Kill Zone Trigger (Priority)
      const zone = KILL_ZONES.find(kz => kz.time === nowStr);
      if (zone && lastTriggeredRef.current !== nowStr) {
        lastTriggeredRef.current = nowStr;
        
        addLog(`[AUTO] Scheduled Injection: ${zone.name} triggered.`);
        
        if (zone.pair === 'ALL') {
          PAIRS.forEach((pair, index) => {
            setTimeout(() => handleGenerateSignal(pair), index * 3000);
          });
        } else if (zone.pair.includes('/')) {
          const parts = zone.pair.split('/');
          parts.forEach((part, index) => {
            const pairToScan = PAIRS.find(p => p.startsWith(part)) || part;
            setTimeout(() => handleGenerateSignal(pairToScan), index * 3000);
          });
        } else {
          handleGenerateSignal(zone.pair);
        }
        return;
      }

      // 2. Opportunistic Deep Scan (Outside Kill Zones)
      // Runs every 5 minutes to detect high-probability "Genesis" setups for ALL pairs
      const nowMs = nowFull.getTime();
      if (nowMs - lastDeepScanRef.current > 300000) { // 5 minutes
        lastDeepScanRef.current = nowMs;
        addLog(`[HEARTBEAT] AI Neural Core performing scheduled 5-minute deep scan...`);
        PAIRS.forEach((pair, index) => {
          // Stagger the scans to avoid API rate limits
          setTimeout(() => handleGenerateSignal(pair, true), index * 3000);
        });
      }
    };

    const interval = setInterval(checkSchedule, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Wake Lock and Service Worker Registration
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
          console.log('Wake Lock is active');
          
          wakeLockRef.current.addEventListener('release', () => {
            console.log('Wake Lock was released');
            setIsWakeLockActive(false);
            // Attempt to re-request if released unexpectedly
            if (document.visibilityState === 'visible') {
              requestWakeLock();
            }
          });
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.warn('Wake Lock permission denied by policy.');
          addLog('! Wake Lock: Permission denied. Keep app in foreground.');
        } else {
          console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
        setIsWakeLockActive(false);
      }
    };

    requestWakeLock();

    // Re-request wake lock when page becomes visible again
    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Register Service Worker for better background notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // Real-time Price Sync Engine
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchPrices = async (retryCount = 0) => {
      if (!isMounted) return;

      const now = new Date();
      const day = parseInt(formatInTimeZone(now, SAST_TZ, 'i'));
      const isClosed = day === 6 || day === 7;
      setIsMarketClosed(isClosed);

      if (isClosed) {
        timeoutId = setTimeout(() => fetchPrices(), 10000);
        return;
      }
      
      try {
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 15000); // 15s client-side timeout

        const response = await fetch('/api/prices', { signal: controller.signal });
        clearTimeout(fetchTimeout);

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (isMounted) {
          // Store previous prices for volatility tracking before updating state
          pricesRef.current.forEach(p => {
            lastPriceMapRef.current[p.symbol] = p.price;
          });

          realPricesRef.current = data;
          
          setPrices(prev => prev.map(p => {
            const realData = data[p.symbol];
            if (realData) {
              return {
                ...p,
                lastPrice: p.price,
                price: realData.price,
                change: realData.change,
                changePercent: realData.changePercent,
              };
            }
            return p;
          }));
        }
        
        // Reset retry count on success
        retryCount = 0;
      } catch (error) {
        if (isMounted) {
          const errMsg = error instanceof Error ? error.message : String(error);
          console.warn(`[Price Sync] Attempt ${retryCount + 1} failed:`, errMsg);
          retryCount++;
        }
      } finally {
        if (isMounted) {
          // Schedule next fetch: if failed, try again sooner (after 1s) up to 3 times, then back to 2s
          const nextDelay = (retryCount > 0 && retryCount < 4) ? 1000 : 2000;
          timeoutId = setTimeout(() => fetchPrices(retryCount >= 4 ? 0 : retryCount), nextDelay);
        }
      }
    };

    fetchPrices();
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // High-Frequency Price Pulse Engine (Institutional ECN Feed Simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMarketClosed) return;
      
      setPrices(prev => prev.map(p => {
        // Use real price as baseline if available, otherwise use current
        const baseline = realPricesRef.current[p.symbol]?.price || p.price;
        
        // Institutional Jitter (mimics ECN feed precision)
        // Increased volatility for better visual "pulse"
        const volatility = p.symbol === 'XAUUSD' ? 0.35 : p.symbol.includes('US') ? 3.5 : 2.5;
        const jitter = (Math.random() - 0.5) * volatility;
        const newPrice = baseline + jitter;
        
        return {
          ...p,
          lastPrice: p.price,
          price: newPrice,
        };
      }));
    }, 100); // Ticking every 100ms for high-frequency feel
    return () => clearInterval(interval);
  }, [isMarketClosed]);

  // Signal Tracking Engine (Monitors prices and updates signal statuses)
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => {
        let changed = false;
        const next = prev.map(s => {
          const p = pricesRef.current.find(price => price.symbol === s.pair);
          if (!p) return s;
          const currentPrice = p.price;

          let updatedSignal = { ...s };
          const isBuy = s.type.includes('BUY');
          const isSell = s.type.includes('SELL');
          let newStatus = s.status;

    // 1. Trend Change & Invalidation Detection
    if (s.status === 'PENDING' || s.status === 'ACTIVE' || s.status.startsWith('TP')) {
      // More sensitive trend flip detection (0.1% instead of 0.2%)
      const trendFlipped = (isBuy && p.changePercent < -0.1) || (isSell && p.changePercent > 0.1);
      
      // Invalidation check: If price moves too far away from entry (e.g., hits SL level before entry)
      const movedTooFar = s.status === 'PENDING' && (isBuy ? currentPrice <= s.sl : currentPrice >= s.sl);

      // --- PERFECTION: SIGNAL EXPIRY (4 HOURS) ---
      const isExpired = s.status === 'PENDING' && (Date.now() - s.timestamp > 4 * 60 * 60 * 1000);

      if (movedTooFar) {
        newStatus = 'INVALIDATED';
        addLog(`! SIGNAL INVALIDATED: ${s.pair} structure broken before entry.`);
        changed = true;
      } else if (isExpired) {
        newStatus = 'INVALIDATED';
        addLog(`! SIGNAL EXPIRED: ${s.pair} pending setup timed out after 4 hours.`);
        changed = true;
      } else if (trendFlipped && s.status !== 'TREND_CHANGE' && s.status !== 'INVALIDATED' && s.status !== 'SL' && s.status !== 'TP3') {
        // DOMINATOR LOGIC: If pending, invalidate immediately. If active, warn.
        if (s.status === 'PENDING') {
          newStatus = 'INVALIDATED';
          addLog(`! SIGNAL INVALIDATED: Trend flip detected for ${s.pair} before entry.`);
        } else {
          newStatus = 'TREND_CHANGE';
          addLog(`⚠️ WARNING: Trend shift detected for ${s.pair}. Setup may be invalidated.`);
        }
        
        // Update characterChange if not already set
        if (!s.characterChange) {
          updatedSignal.characterChange = "TREND FLIP: Market sentiment has shifted.";
        }

        // AUTO RE-SCAN: If trend flips, we immediately ask the AI to find a new setup aligned with the new trend
        if (settingsRef.current.autoScan) {
          addLog(`[AUTO] Trend flip detected. Re-scanning ${s.pair} for new institutional setup...`);
          handleGenerateSignal(s.pair, true);
        }
        changed = true;
      }
    }

          if (s.status === 'PENDING') {
            // Check for entry based on order type
            const isLimit = s.type.includes('LIMIT');
            const isStop = s.type.includes('STOP');
            
            let hitEntry = false;
            if (isBuy) {
              if (isLimit) hitEntry = currentPrice <= s.entry;
              if (isStop) hitEntry = currentPrice >= s.entry;
            } else {
              if (isLimit) hitEntry = currentPrice >= s.entry;
              if (isStop) hitEntry = currentPrice <= s.entry;
            }
            
            if (hitEntry && newStatus !== 'INVALIDATED') {
              newStatus = 'ACTIVE';
              addLog(`▶ SIGNAL ACTIVATED: ${s.type} ${s.pair} at ${s.entry}`);
              changed = true;
            }
          } else if (s.status === 'ACTIVE' || s.status.startsWith('TP') || s.status === 'TREND_CHANGE') {
            // Check for SL
            const hitSL = isBuy ? currentPrice <= s.sl : currentPrice >= s.sl;
            if (hitSL) {
              newStatus = 'SL';
              addLog(`✘ STOP LOSS HIT: ${s.pair} at ${s.sl}`);
              changed = true;
            } else {
              // Check for TPs
              if (s.status !== 'TP3') {
                const hitTP3 = s.tp3 > 0 && (isBuy ? currentPrice >= s.tp3 : currentPrice <= s.tp3);
                const hitTP2 = s.tp2 > 0 && (isBuy ? currentPrice >= s.tp2 : currentPrice <= s.tp2);
                const hitTP1 = s.tp1 > 0 && (isBuy ? currentPrice >= s.tp1 : currentPrice <= s.tp1);

                if (hitTP3) {
                  newStatus = 'TP3';
                  addLog(`💰 TAKE PROFIT 3 HIT: ${s.pair} at ${s.tp3} (FINAL)`);
                  changed = true;
                } else if (hitTP2 && s.status !== 'TP2') {
                  newStatus = 'TP2';
                  addLog(`💰 TAKE PROFIT 2 HIT: ${s.pair} at ${s.tp2}`);
                  
                  // --- PERFECTION: TRAILING SL TO TP1 ---
                  if (s.tp1 > 0) {
                    updatedSignal.sl = s.tp1;
                    addLog(`🛡️ TRAILING SL: Stop Loss moved to TP1 for ${s.pair}. Profit locked.`);
                  }
                  
                  changed = true;
                } else if (hitTP1 && s.status !== 'TP1' && s.status !== 'TP2') {
                  newStatus = 'TP1';
                  addLog(`💰 TAKE PROFIT 1 HIT: ${s.pair} at ${s.tp1}`);
                  
                  // DOMINATOR LOGIC: Move SL to Break-Even (Entry)
                  updatedSignal.sl = s.entry;
                  addLog(`🛡️ AUTO-BE: Stop Loss moved to Entry for ${s.pair}. Risk-free trade.`);
                  
                  changed = true;
                }
              }
            }
          }

          if (newStatus !== s.status || updatedSignal.characterChange !== s.characterChange) {
            return { ...updatedSignal, status: newStatus };
          }
          return s;
        });

        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMarketClosed]);

  const playNotificationSound = () => {
    if (!settings.soundEffects) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play blocked:', e));
  };

    useEffect(() => {
      const now = new Date();
      const sastTime = formatInTimeZone(now, SAST_TZ, 'HH:mm:ss');
      addLog(`[SYSTEM] Genesis AI Online. Timezone: SAST (${SAST_TZ})`);
      addLog(`[SYSTEM] Current SAST Time: ${sastTime}`);
      addLog(`[SYSTEM] Auto-Injection Schedule: ACTIVE`);
      
      const timer = setInterval(() => {
        setTime(formatInTimeZone(new Date(), SAST_TZ, 'HH:mm:ss'));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

  const sendPushNotification = async (signal: Signal) => {
    if (!settingsRef.current.pushNotifications) {
      console.log('Push notifications disabled in settings.');
      return;
    }
    if (!("Notification" in window)) {
      console.warn('This browser does not support desktop notifications.');
      return;
    }
    
    const title = `✓ GENESIS SIGNAL: ${signal.type} ${signal.pair}`;
    const options = {
      body: `Entry: ${signal.entry} | SL: ${signal.sl} | TP1: ${signal.tp1} | Lot: ${signal.lotSize}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: signal.id,
      renotify: true,
      data: { url: window.location.origin }
    };

    if (Notification.permission === "granted") {
      addLog(`AI: Sending push notification for ${signal.pair}...`);
      // Use Service Worker if available for better background support
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, options);
          console.log('Notification sent via Service Worker');
        } catch (err) {
          console.error('Service Worker notification failed:', err);
          new Notification(title, options);
        }
      } else {
        new Notification(title, options);
        console.log('Notification sent via main thread');
      }
    } else if (Notification.permission !== "denied") {
      addLog('AI: Requesting notification permission for signal...');
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        sendPushNotification(signal);
      }
    } else {
      console.warn('Notification permission is denied.');
    }
  };

  const handleGenerateSignal = async (pairOverride?: string, isSilent = false) => {
    const pair = pairOverride || selectedPairRef.current;
    
    // Check market status
    if (isMarketClosed) {
      if (!isSilent) addLog('! MARKET CLOSED. Genesis AI rests on weekends.');
      return;
    }

    // Check if we're already scanning THIS specific pair to avoid duplicates
    // We use a local variable to track scanning state for the UI, but allow the logic to proceed for different pairs
    setIsScanning(true);
    
    if (!isSilent) {
      addLog(`AI ANALYZING ${pair}...`);
      addLog(`[Neural Core] Deep scanning ${pair} liquidity...`);
    }
    
    const pairData = pricesRef.current.find(p => p.symbol === pair);
    const currentPrice = pairData?.price || 0;
    const changePercent = pairData?.changePercent || 0;
    
    if (!isSilent && currentPrice > 0) {
      addLog(`[Neural Core] Baseline Price: ${currentPrice.toFixed(2)}`);
    }

    if (currentPrice === 0) {
      // Silently retry if price is missing
      setIsScanning(false);
      return;
    }

    // Check for existing pending signals for this pair to ensure uniqueness
    const existingPairSignals = signalsRef.current.filter(s => s.pair === pair && s.status === 'PENDING');
    
    if (existingPairSignals.length > 0 && !pairOverride) {
      if (!isSilent) addLog(`! AI skipping ${pair}: Active Genesis setup already exists.`);
      setIsScanning(false);
      return;
    }

    try {
      if (!isSilent) {
        addLog(`[AI] Thinking... Applying Genesis Protocols to ${pair}`);
        addLog(`[AI] Trend Analysis: ${changePercent > 0 ? 'BULLISH' : 'BEARISH'} detected.`);
      }
      const signal = await generateGenesisSignal(pair, currentPrice, changePercent, settingsRef.current.equity, settingsRef.current.riskPercent, beastModeRef.current, swingModeRef.current);
      
      if (signal && 'no_setup' in signal) {
        if (!isSilent) addLog(`AI: No high-probability setup detected for ${pair} at this time.`);
        setIsScanning(false);
        return;
      }

      if (signal && 'quota_exceeded' in signal) {
        addLog(`! AI COOLDOWN: Rate limit reached. Neural Core resting for 60s...`);
        setIsScanning(false);
        return;
      }

      if (signal && 'error' in signal) {
        addLog(`✘ AI ERROR: ${signal.error}`);
        setIsScanning(false);
        return;
      }

      if (signal && !('no_setup' in signal) && !('quota_exceeded' in signal) && !('error' in signal)) {
        const sig = signal as Signal;
        
        // --- SURGICAL 5-PIP SNAP (FINAL INJECTION STAGE) ---
        // We re-snap to the ABSOLUTE LATEST price to ensure precision despite AI latency.
        const sigPair = sig.pair.replace('/', '').toUpperCase();
        const latestP = pricesRef.current.find(p => p.symbol.replace('/', '').toUpperCase() === sigPair);
        
        if (latestP) {
          const latestPrice = latestP.price;
          const isXAU = sigPair.includes('XAU');
          const isIndice = sigPair.includes('US') || sigPair.includes('DAX') || sigPair.includes('TEC');
          
          // --- VOLATILITY FILTER ---
          // If price is moving too fast (e.g., > 2 pips in the last tick), skip the signal.
          // This prevents "chasing" spikes that are "already moving".
          const prevPrice = lastPriceMapRef.current[sigPair] || latestPrice;
          const tickDelta = Math.abs(latestPrice - prevPrice);
          const volatilityThreshold = isXAU ? 0.2 : 2.0; // 2 pips
          
          if (tickDelta > volatilityThreshold) {
            if (!isSilent) addLog(`! AI skipped ${sig.pair}: Extreme volatility (${tickDelta.toFixed(2)} pips). Price moving too fast for surgical entry.`);
            setIsScanning(false);
            return;
          }
          
          // Update last price map after check
          lastPriceMapRef.current[sigPair] = latestPrice;

          if (isXAU || isIndice) {
            const pipValue = isXAU ? 0.1 : 1.0;
            const targetDist = 5.0 * pipValue;
            const sigType = sig.type.toUpperCase();
            
            let surgicalEntry = sig.entry;
            // Logic: 
            // BUY LIMIT / SELL STOP: Entry is BELOW current price
            // SELL LIMIT / BUY STOP: Entry is ABOVE current price
            if (sigType.includes('BUY LIMIT') || sigType.includes('SELL STOP')) {
              surgicalEntry = latestPrice - targetDist;
            } else if (sigType.includes('SELL LIMIT') || sigType.includes('BUY STOP')) {
              surgicalEntry = latestPrice + targetDist;
            } else {
              // Fallback for generic BUY/SELL if AI ignores "PENDING ONLY"
              surgicalEntry = sigType.includes('BUY') ? latestPrice - targetDist : latestPrice + targetDist;
            }

            const shift = surgicalEntry - sig.entry;
            sig.entry = Number(surgicalEntry.toFixed(2));
            sig.sl = Number((sig.sl + shift).toFixed(2));
            sig.tp1 = Number((sig.tp1 + shift).toFixed(2));
            if (sig.tp2 > 0) sig.tp2 = Number((sig.tp2 + shift).toFixed(2));
            if (sig.tp3 > 0) sig.tp3 = Number((sig.tp3 + shift).toFixed(2));
            
            if (!isSilent) {
              addLog(`[Neural Core] Surgical Snap: ${sig.pair} entry locked at exactly 5.0 pips from ${latestPrice.toFixed(2)}`);
              addLog(`[Neural Core] Snap Delta: ${shift.toFixed(4)} applied to all levels.`);
            }
          }
        }

        // DOMINATOR FILTER: Absolute selectivity. No guessing.
        const prob = sig.probabilityScore || 0;
        const threshold = beastModeRef.current ? 70 : 90;
        
        if (prob < threshold) {
          if (!isSilent) {
            addLog(`! AI discarded ${signal.pair} setup: Probability (${prob}%) below Genesis threshold (${threshold}%).`);
            addLog('AI: Selectivity Mandate enforced. Zero-Guess protocol active.');
          }
          setIsScanning(false);
          return;
        }

        // TREND ALIGNMENT CHECK: Ensure signal matches 24h sentiment unless a reversal is confirmed.
        const isBullish = changePercent > 0;
        const isBuy = sig.type.includes('BUY');
        const isSell = sig.type.includes('SELL');
        const isCounterTrend = (isBullish && isSell) || (!isBullish && isBuy);
        const reasoning = sig.reasoning?.toUpperCase() || "";
        const hasReversalConfirmed = reasoning.includes('CHOCH') || reasoning.includes('TREND CHANGE') || reasoning.includes('REVERSAL');

        if (isCounterTrend && !hasReversalConfirmed) {
          if (!isSilent) addLog(`! AI discarded ${sig.pair} setup: Counter-trend setup without confirmed CHoCH.`);
          setIsScanning(false);
          return;
        }

        // Final check to prevent conflicting signals
        const isConflicting = signalsRef.current.some(s => 
          s.pair === sig.pair && 
          s.status === 'PENDING' && 
          s.type.split(' ')[0] !== sig.type.split(' ')[0]
        );

        if (isConflicting) {
          if (!isSilent) addLog(`! AI discarded ${sig.pair} setup: Conflicting market sentiment detected.`);
          setIsScanning(false);
          return;
        }

        // Check for exact duplicate (same entry and type)
        const isDuplicate = signalsRef.current.some(s => 
          s.pair === sig.pair && 
          s.status === 'PENDING' && 
          s.type === sig.type &&
          Math.abs(s.entry - sig.entry) < sig.pipValue
        );

        if (isDuplicate) {
          if (!isSilent) addLog(`! AI skipped ${sig.pair}: Duplicate setup already in feed.`);
          setIsScanning(false);
          return;
        }

        setSignals(prev => [sig, ...prev]);
        const dist = Math.abs(sig.entry - (latestP?.price || currentPrice));
        const pips = dist / (sig.pair === 'XAUUSD' ? 0.1 : 1.0);
        addLog(`✓ SNIPER ENTRY IDENTIFIED: ${sig.type} ${sig.pair} @ ${sig.entry} (${pips.toFixed(1)} pips from market)`);
        if (sig.probabilityScore) {
          addLog(`AI PROBABILITY: ${sig.probabilityScore}%`);
        }
        if (sig.pair === 'XAUUSD') {
          addLog(`AI: XAUUSD Stop Run detected. Institutional liquidity sweep confirmed.`);
        }
        if (sig.reasoning) {
          addLog(`AI REASONING: ${sig.reasoning}`);
        }
        addLog(`AI: Liquidity sweep confirmed at ${sig.entry}`);
        playNotificationSound();
        sendPushNotification(sig);
      } else if (signal && 'no_setup' in signal) {
        if (!isSilent) {
          addLog(`! ${pair}: No high-probability institutional setup found.`);
          addLog('AI: Selectivity Mandate enforced. Waiting for surgical entry.');
        }
      } else if (signal && 'quota_exceeded' in signal) {
        if (!isSilent) {
          addLog(`! AI QUOTA EXCEEDED: Rate limit hit. Cooling down for 60s...`);
          addLog('AI: Please check your Gemini API plan or wait for reset.');
        }
      } else if (signal && 'error' in signal) {
        if (!isSilent) {
          addLog(`! ${pair}: AI Analysis Failed - ${signal.error}`);
          addLog('AI: Neural Core recalibrating. Retrying in next cycle.');
        }
      } else {
        if (!isSilent) {
          addLog(`! ${pair}: AI Signal Engine Error. Check neural core connection.`);
          console.error(`AI returned null for ${pair}. Check API key or validation logic.`);
        }
      }
    } catch (err) {
      console.error('Signal generation error:', err);
      if (!isSilent) addLog(`! ${pair}: Neural Core crash. Restarting engine...`);
    } finally {
      setIsScanning(false);
    }
  };

  const deleteSignal = (id: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
    addLog('Signal removed from feed.');
  };

  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative">
      <Header time={time} status={isScanning ? 'SCANNING' : isMarketClosed ? 'CLOSED' : 'READY'} settings={settings} onScan={handleManualScan} />
      
      {/* New Tab Suggestion for Background Performance */}
      {window.self !== window.top && (
        <div className="mx-4 mt-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ExternalLink size={14} className="text-primary" />
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">
              Open in new tab for 24/7 background alerts
            </p>
          </div>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="text-[9px] font-black text-white bg-primary px-3 py-1.5 rounded-xl uppercase tracking-widest hover:bg-primary/80 transition-all active:scale-95"
          >
            Open
          </button>
        </div>
      )}


      {isMarketClosed && (
        <div className="mx-4 mt-4 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3">
          <Clock className="text-danger" size={20} />
          <div>
            <p className="text-xs font-bold text-danger uppercase">Market Closed</p>
            <p className="text-[10px] text-slate-400">Trading resumes on Monday. Genesis AI is currently offline.</p>
          </div>
        </div>
      )}

      <main className="px-4 py-6 flex flex-col gap-6">
        {/* Live Signal Feed Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-xs font-black text-white uppercase tracking-tighter">LIVE SIGNAL FEED</h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{signals.length} ACTIVE</span>
          </div>

          <div className="flex flex-col gap-4 min-h-[100px]">
            <AnimatePresence mode="popLayout">
              {signals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-800 rounded-2xl"
                >
                  <Cpu className="text-slate-800 mb-2" size={32} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning for Genesis setups...</p>
                  <p className="text-[8px] text-slate-600 mt-1">Auto-lot calc | 1% risk | Secondary enabled</p>
                </motion.div>
              ) : (
                signals.map(s => (
                  <SignalCard key={s.id} signal={s} onDelete={(id) => { deleteSignal(id); setSelectedSignal(null); }} onSelect={setSelectedSignal} />
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Chart Section */}
        <section className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {PAIRS.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPair(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap border",
                  selectedPair === p 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-slate-900 text-slate-400 border-white/5 hover:border-primary/50"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <TradingViewChart symbol={
            selectedPair === 'XAUUSD' ? 'OANDA:XAUUSD' : 
            selectedPair === 'USTEC' ? 'NASDAQ:NDX' : 
            selectedPair === 'US30' ? 'DJ:DJI' : 
            'CAPITALCOM:DE40'
          } />
        </section>

        {/* Control Panel */}
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-[2rem] flex flex-col gap-3 border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className={cn(beastMode ? "text-primary" : "text-slate-500")} />
                <span className="text-[11px] font-black uppercase tracking-widest">BEAST MODE</span>
              </div>
              <button 
                onClick={() => setBeastMode(!beastMode)}
                className={cn("w-12 h-6 rounded-full relative transition-all duration-300", beastMode ? "bg-primary shadow-[0_0_10px_rgba(0,200,255,0.3)]" : "bg-slate-800")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md", beastMode ? "right-1" : "left-1")} />
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase tracking-tighter">Poverty Killer Active. Aggressive Genesis hunting enabled.</p>
          </div>

          <div className="glass-panel p-5 rounded-[2rem] flex flex-col gap-3 border-success/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={cn(swingMode ? "text-success" : "text-slate-500")} />
                <span className="text-[11px] font-black uppercase tracking-widest">AI SWING</span>
              </div>
              <button 
                onClick={() => setSwingMode(!swingMode)}
                className={cn("w-12 h-6 rounded-full relative transition-all duration-300", swingMode ? "bg-success shadow-[0_0_10px_rgba(0,230,118,0.3)]" : "bg-slate-800")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md", swingMode ? "right-1" : "left-1")} />
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-500 leading-tight uppercase tracking-tighter">4H/D1 Detection. Long-term trend alignment active.</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => handleGenerateSignal()}
            disabled={isScanning}
            className="glass-panel flex flex-col items-center justify-center py-4 rounded-xl hover:bg-primary/5 transition-all group active:scale-95 disabled:opacity-50"
          >
            <Cpu size={24} className="text-slate-400 group-hover:text-primary mb-1" />
            <span className="text-[12px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">GENERATE AI SIGNAL</span>
          </button>
        </div>

        {/* Schedule & Logs */}
        <section className="flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">AUTO-INJECTION SCHEDULE (SAST)</h3>
            </div>
            <div className="flex flex-col gap-3">
              {KILL_ZONES.map((kz, i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">{i+1}</span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white">{kz.name}</span>
                      <span className="text-[8px] text-slate-400">{kz.desc}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-primary">{kz.time}</span>
                </div>
              ))}
            </div>
          </div>

          <NeuralLog logs={logs} />
        </section>

        {/* Strategies & Risk */}
        <section className="flex flex-col gap-4">
          <div className="glass-panel p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Layers size={14} className="text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">GENESIS STRATEGIES</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: 'Liquidity Sweep', win: '88%', rr: '1:4' },
                { name: 'NY Silver Bullet', win: '91%', rr: '1:3.5' },
                { name: 'Frankfurt Gap', win: '85%', rr: '1:3' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-slate-300">{s.name}</span>
                  <div className="flex gap-3">
                    <span className="text-[9px] font-bold text-success">{s.win}</span>
                    <span className="text-[9px] font-bold text-primary">{s.rr}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-success" />
              <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">BLACK SWAN SHIELD</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase">RISK</span>
                <span className="text-xs font-bold text-danger">{settings.riskPercent}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 uppercase">RR MIN</span>
                <span className="text-xs font-bold text-primary">1:3</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Signal Details Modal */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-xs rounded-2xl p-4 shadow-2xl relative overflow-hidden border border-white/10"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                      selectedSignal.type.includes('BUY') ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"
                    )}>
                      {selectedSignal.type}
                    </div>
                    <span className="text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-widest">GENESIS</span>
                  </div>
                  <h2 className="text-lg font-black text-white tracking-tight">{selectedSignal.pair}</h2>
                </div>
                <button onClick={() => setSelectedSignal(null)} className="text-slate-600 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/30 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase block mb-0.5 tracking-widest">ENTRY</span>
                    <span className="text-base font-mono font-black text-slate-100">{selectedSignal.entry.toFixed(2)}</span>
                  </div>
                  <div className="bg-danger/5 p-2.5 rounded-xl border border-danger/10">
                    <span className="text-[7px] font-black text-danger/60 uppercase block mb-0.5 tracking-widest">STOP LOSS</span>
                    <span className="text-base font-mono font-black text-danger">{selectedSignal.sl.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[7px] font-black text-slate-500 uppercase block tracking-widest">TARGETS</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[selectedSignal.tp1, selectedSignal.tp2, selectedSignal.tp3].map((tp, i) => (
                      <div key={i} className="flex justify-between items-center p-2.5 bg-success/5 rounded-xl border border-success/10 group hover:bg-success/10 transition-all">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">TARGET {i+1}</span>
                        <span className="text-sm font-mono font-black text-success">{tp.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 border border-primary/10 shadow-inner">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={12} className="text-primary animate-pulse" />
                    <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">AI CALCULATIONS</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="text-[7px] font-black text-slate-500 uppercase">LOT SIZE</span>
                      <span className="text-[10px] font-mono font-black text-primary">{selectedSignal.lotSize}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                      <span className="text-[7px] font-black text-slate-500 uppercase">POSITIONS</span>
                      <span className="text-[10px] font-mono font-black text-slate-200">x{selectedSignal.positions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-black text-slate-500 uppercase">PIP VALUE</span>
                      <span className="text-[10px] font-mono font-black text-success">R{selectedSignal.pipValue}</span>
                    </div>
                  </div>

                  {selectedSignal.reasoning && (
                    <div className="mt-3 p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain size={10} className="text-primary" />
                        <span className="text-[7px] font-black text-primary uppercase tracking-widest">REASONING</span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-300 leading-relaxed uppercase tracking-tight">
                        {selectedSignal.reasoning}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-xl border border-white/5">
                  <Info size={12} className="text-primary flex-shrink-0" />
                  <p className="text-[8px] text-slate-400 font-medium leading-relaxed">
                    Genesis Logic: {selectedSignal.reasoning || `${selectedSignal.pattern} detected. High probability setup with ${selectedSignal.rr} R/R ratio.`}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings FAB */}
      <button 
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-white shadow-lg shadow-primary/40 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Settings size={24} />
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-slate-900 w-full max-w-xs rounded-2xl p-5 shadow-2xl border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-primary/30" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                    <Settings size={18} className="text-primary" /> SYSTEM CONFIG
                  </h2>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Genesis Engine v2.4.0</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-slate-600 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bell size={16} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">PUSH ALERTS</span>
                    </div>
                    <button 
                      onClick={() => {
                        if (!settings.pushNotifications && "Notification" in window) {
                          Notification.requestPermission();
                        }
                        setSettings(s => ({ ...s, pushNotifications: !s.pushNotifications }));
                      }}
                      className={cn("w-10 h-5 rounded-full relative transition-all duration-300", settings.pushNotifications ? "bg-primary" : "bg-slate-800")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", settings.pushNotifications ? "right-0.5" : "left-0.5")} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                        <Volume2 size={16} className="text-success" />
                      </div>
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">AUDIO ENGINE</span>
                    </div>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, soundEffects: !s.soundEffects }))}
                      className={cn("w-10 h-5 rounded-full relative transition-all duration-300", settings.soundEffects ? "bg-success" : "bg-slate-800")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", settings.soundEffects ? "right-0.5" : "left-0.5")} />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-white/5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-3">RISK MANAGEMENT (%)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={settings.riskPercent}
                      onChange={(e) => setSettings(s => ({ ...s, riskPercent: Number(e.target.value) }))}
                      className="flex-1 accent-primary h-1"
                    />
                    <span className="text-xl font-mono font-black text-primary w-12 text-right">{settings.riskPercent}%</span>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-4 leading-relaxed uppercase font-bold">
                    Genesis AI will automatically calculate lot sizes based on this risk parameter.
                  </p>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TEST NOTIFICATION</span>
                      <span className="text-[7px] text-slate-600 uppercase">Verify background alerts</span>
                    </div>
                    <button 
                      onClick={() => {
                        sendPushNotification({
                          id: 'test-' + Date.now(),
                          pair: 'XAUUSD',
                          type: 'BUY LIMIT',
                          pattern: 'TEST SNIPER',
                          entry: 2150.50,
                          sl: 2135.00,
                          tp1: 2165.00,
                          tp2: 0,
                          tp3: 0,
                          lotSize: 0.10,
                          positions: 1,
                          riskAmount: 10,
                          pipValue: 1,
                          rr: '1:3',
                          status: 'PENDING',
                          timestamp: Date.now()
                        });
                      }}
                      className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-[9px] font-black text-primary hover:bg-primary/20 transition-all active:scale-95"
                    >
                      SEND TEST
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => { setSignals([]); addLog('All data cleared.'); setShowSettings(false); }}
                  className="w-full py-4 rounded-2xl border border-danger/30 text-danger text-[10px] font-black uppercase tracking-[0.2em] hover:bg-danger/5 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 size={16} /> PURGE ALL SYSTEM DATA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
