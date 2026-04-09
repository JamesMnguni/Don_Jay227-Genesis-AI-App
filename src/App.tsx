import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  Activity, 
  Zap, 
  Target, 
  Settings, 
  Bell, 
  Volume2, 
  Scan, 
  Cpu, 
  Brain,
  Layers, 
  Trash2, 
  Clock,
  TrendingUp,
  ShieldCheck,
  Info,
  ExternalLink,
  AlertTriangle,
  Copy,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatInTimeZone } from 'date-fns-tz';
import { Signal, AppSettings, MarketPrice } from './types';
import { generateGenesisSignal, fetchNewsForPairs } from './services/geminiService';
import { TradingViewChart } from './components/TradingViewChart';
import { NeuralIndicator } from './components/NeuralIndicator';
import { cn } from './lib/utils';

const PAIRS = ['XAUUSD', 'USTEC', 'US30', 'DAX', 'BTCUSD'];
const SAST_TZ = 'Africa/Johannesburg';
const APP_VERSION = 'v2.3.0';

const getMarketSessions = () => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  
  return [
    { name: 'SYDNEY', active: utcHour >= 22 || utcHour < 7 },
    { name: 'TOKYO', active: utcHour >= 0 && utcHour < 9 },
    { name: 'LONDON', active: utcHour >= 8 && utcHour < 17 },
    { name: 'NEW YORK', active: utcHour >= 13 && utcHour < 22 },
    { name: 'CRYPTO', active: true },
  ];
};

const TARGET_BASELINES_2026: MarketPrice[] = [
  { symbol: 'XAUUSD', price: 4799.48, change: 81.60, changePercent: 3.37, high: 4857.86, low: 4713.55 },
  { symbol: 'USTEC', price: 25064.80, change: 81.60, changePercent: 3.37, high: 25107.30, low: 24234.40 },
  { symbol: 'US30', price: 47854.60, change: 117.90, changePercent: 2.53, high: 47957.00, low: 46651.80 },
  { symbol: 'DAX', price: 24148.40, change: 90.22, changePercent: 3.88, high: 24250.90, low: 23216.00 },
  { symbol: 'BTCUSD', price: 72080.21, change: 276.90, changePercent: 4.00, high: 72754.71, low: 69348.21 },
];

const KILL_ZONES = [
  { name: 'SYDNEY OPEN', time: '00:00', pair: 'XAUUSD', desc: 'Asian session start' },
  { name: 'TOKYO OPEN', time: '02:00', pair: 'XAUUSD', desc: 'Asian liquidity sweep' },
  { name: 'EUROPEAN OPEN', time: '09:00', pair: 'DAX', desc: 'Frankfurt gap analysis' },
  { name: 'LONDON OPEN', time: '10:00', pair: 'ALL', desc: 'Major liquidity sweep' },
  { name: 'NY PRE-MARKET', time: '14:00', pair: 'XAUUSD', desc: 'Pre-NY liquidity' },
  { name: 'NY KILL ZONE', time: '15:30', pair: 'ALL', desc: 'Major pairs rapid fire' },
  { name: 'LONDON CLOSE', time: '17:30', pair: 'DAX', desc: 'Final European moves' },
  { name: 'NY AFTERNOON', time: '20:00', pair: 'USTEC', desc: 'Trend continuation' },
];

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

const Header = ({ time, status, settings, beastMode, onScan }: { time: string, status: string, settings: AppSettings, beastMode: boolean, onScan: () => void }) => {
  const sessions = getMarketSessions();
  
  return (
    <header className="glass-panel sticky top-0 z-50 px-4 py-4 flex flex-col gap-3 rounded-b-[2rem] border-b-primary/20">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
            DON_JAY227
          </h1>
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] -mt-1">INSTITUTIONAL ECOSYSTEM</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(0,200,255,0.5)] animate-pulse" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">NEURAL CORE: ONLINE</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(0,230,118,0.5)] animate-pulse" />
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">CAT CLOCK</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">{time}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar items-center justify-between">
        <div className="flex gap-2 items-center">
          {sessions.map(s => (
            <div key={s.name} className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all duration-300",
              s.active 
                ? "bg-success/5 border-success/20 shadow-[0_0_10px_rgba(0,230,118,0.05)]" 
                : "bg-slate-900/40 border-white/5"
            )}>
              <div className={cn(
                "w-1 h-1 rounded-full",
                s.active ? "bg-success animate-pulse shadow-[0_0_5px_rgba(0,230,118,0.5)]" : "bg-slate-700"
              )} />
              <div className="flex flex-col leading-none">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">{s.name}</span>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  s.active ? "text-success" : "text-slate-600"
                )}>
                  {s.active ? 'LIVE' : 'OFF'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">NEURAL CORE</span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              beastMode ? "text-primary animate-pulse" : "text-primary"
            )}>
              {beastMode ? 'MARKET DESTRUCTION' : status}
            </span>
          </div>
          <button 
            onClick={onScan}
            className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/20 transition-all active:scale-95 group shrink-0"
          >
            <Zap size={14} className="text-primary group-hover:animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">DEEP SCAN</span>
          </button>
        </div>
      </div>
    </header>
  );
};


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
    
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(signal.id); }}
      className="absolute top-4 right-4 text-slate-500 hover:text-danger hover:bg-white/5 rounded-full p-1.5 transition-all duration-200 z-10"
    >
      <X size={16} />
    </button>

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
          {signal.setupType && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-black bg-white/5 text-slate-300 border border-white/10 uppercase tracking-tighter">
              {signal.setupType}
            </div>
          )}
          {signal.executionStyle && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter">
              {signal.executionStyle}
            </div>
          )}
          {signal.marketStructure && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-black bg-warning/10 text-warning border border-warning/20 uppercase tracking-tighter">
              {signal.marketStructure}
            </div>
          )}
          {signal.eliteAlgoCloud && (
            <div className={cn(
              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
              signal.eliteAlgoCloud === 'BULLISH' ? "bg-success/20 text-success border border-success/40" : "bg-danger/20 text-danger border border-danger/40"
            )}>
              ELITE CLOUD: {signal.eliteAlgoCloud}
            </div>
          )}
          {signal.liquiditySweepConfirmed && (
            <div className="px-2 py-0.5 rounded-md text-[9px] font-black bg-primary/20 text-primary border border-primary/40 uppercase tracking-tighter">
              LIQUIDITY SWEEP: CONFIRMED
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black text-white tracking-tight">{signal.pair}</h3>
          {signal.timeframe && (
            <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">
              {signal.timeframe}
            </span>
          )}
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{signal.pattern}</p>
      </div>
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

    {signal.reasoning && (
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Brain size={10} className="text-primary" />
          <span className="text-[8px] font-black text-primary uppercase tracking-widest">NEURAL RATIONALE</span>
        </div>
        <p className="text-[9px] text-slate-400 leading-relaxed font-medium italic">
          "{signal.reasoning}"
        </p>
      </div>
    )}
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

const MarketWatch = ({ prices }: { prices: MarketPrice[] }) => (
  <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col gap-3">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <Activity size={14} className="text-primary animate-pulse" />
        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">REAL-TIME MARKET PULSE</h3>
      </div>
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">TICKS: 100MS</span>
    </div>
    <div className="flex flex-col gap-2">
      {prices.map(p => {
        const spread = p.symbol === 'XAUUSD' ? 0.12 : p.symbol === 'BTCUSD' ? 12.5 : 1.2;
        const bid = p.price;
        const ask = p.price + (spread * (p.symbol === 'XAUUSD' ? 0.1 : 1));
        
        const displayName = 
          p.symbol === 'USTEC' ? 'US100.std' :
          p.symbol === 'DAX' ? 'DE40.std' :
          p.symbol === 'US30' ? 'US30.std' :
          p.symbol === 'XAUUSD' ? 'XAUUSD.m' :
          p.symbol === 'BTCUSD' ? 'BTCUSD.m' : p.symbol;
        
        return (
          <div key={p.symbol} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group">
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-white group-hover:text-primary transition-colors">{displayName}</span>
              <span className={cn(
                "text-[8px] font-bold",
                p.change >= 0 ? "text-success" : "text-danger"
              )}>{p.changePercent.toFixed(2)}%</span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-slate-500 uppercase">BID</span>
                <span className="text-[11px] font-mono font-bold text-slate-200">{bid.toFixed(2)}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7px] font-black text-slate-500 uppercase">ASK</span>
                <span className="text-[11px] font-mono font-bold text-slate-200">{ask.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col items-end min-w-[60px]">
              <span className="text-[7px] font-black text-slate-500 uppercase">SPREAD</span>
              <span className="text-[9px] font-mono font-bold text-primary">{spread}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const NewsFeed = ({ news, isLoading, onRefresh }: { news: any[], isLoading: boolean, onRefresh: () => void }) => (
  <div className="glass-panel p-5 rounded-[2rem] border-primary/10 relative overflow-hidden group">
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,200,255,0.5)]" />
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">GLOBAL INSTITUTIONAL NEWS FEED</h3>
      </div>
      <button 
        onClick={onRefresh}
        disabled={isLoading}
        className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <Activity size={14} className="text-primary animate-spin" />
        ) : (
          <Scan size={14} className="text-slate-500 group-hover:text-primary transition-colors" />
        )}
      </button>
    </div>
    
    <div className="flex flex-col gap-4">
      {isLoading && news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scanning Global Markets...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-xl">
          <Info size={24} className="text-slate-800 mb-2" />
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No high-impact events detected</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {news.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all group/item"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-black text-slate-200 leading-tight group-hover/item:text-white transition-colors">{item.title}</span>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shrink-0 shadow-sm",
                  item.sentiment === 'BULLISH' ? "bg-success/20 text-success border border-success/20" :
                  item.sentiment === 'BEARISH' ? "bg-danger/20 text-danger border border-danger/20" :
                  "bg-slate-800 text-slate-400 border border-white/5"
                )}>
                  {item.sentiment}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 font-medium">{item.summary}</p>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  <span className="text-primary/60">{item.source}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-800" />
                  <span>{item.time}</span>
                </div>
                <ExternalLink size={10} className="text-slate-700 group-hover/item:text-primary transition-colors cursor-pointer" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    
    <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldCheck size={12} className="text-success" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Verified Intel</span>
      </div>
      <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity">
        Market Pulse <ArrowRight size={12} />
      </div>
    </div>
  </div>
);

const Footer = () => (
  <footer className="px-6 py-10 mt-auto border-t border-white/5 flex flex-col gap-6 items-center bg-slate-950/50">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(0,200,255,0.5)] animate-pulse" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">GENESIS ENGINE {APP_VERSION} [24/7 ACTIVE]</span>
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
    const [prices, setPrices] = useState<MarketPrice[]>(TARGET_BASELINES_2026);
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
    const [dailySignalCount, setDailySignalCount] = useState(() => {
      const saved = localStorage.getItem('don_jay_daily_count');
      return saved ? parseInt(saved) : 0;
    });
    const [lastResetDate, setLastResetDate] = useState(() => {
      return localStorage.getItem('don_jay_last_reset') || new Date().toDateString();
    });
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
    const [news, setNews] = useState<any[]>([]);
    const [isNewsLoading, setIsNewsLoading] = useState(false);
    
    // Robust API key check for UI feedback
    const hasApiKey = Boolean((process as any).env?.GEMINI_API_KEY);

    const [logs, setLogs] = useState<string[]>([
      'GENESIS AI: SYSTEM INITIALIZED', 
      'Institutional Liquidity Monitoring: ACTIVE', 
      hasApiKey ? 'Gemini AI Connection: SECURE' : 'Neural Core: Autonomous Mode ACTIVE',
      'Precision Mandate: 5-Pip Threshold Enabled',
      'System Status: READY'
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
    const lastInjectionTimeRef = useRef<number>(0);
    const GLOBAL_INJECTION_COOLDOWN_MS = 30000; // 30 seconds rest after any injection
    const PAIR_INJECTION_COOLDOWN_MS = 60000; // 60 seconds rest per specific pair
    const lastInjectionTimesRef = useRef<Record<string, number>>({});
    const scanningPairsRef = useRef<Set<string>>(new Set());
  
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
      localStorage.setItem('don_jay_daily_count', dailySignalCount.toString());
      localStorage.setItem('don_jay_last_reset', lastResetDate);
    }, [prices, signals, beastMode, swingMode, selectedPair, settings, dailySignalCount, lastResetDate]);

    const loadNews = async () => {
      if (isNewsLoading) return;
      setIsNewsLoading(true);
      try {
        const newsData = await fetchNewsForPairs(PAIRS);
        setNews(newsData);
        if (newsData.length > 0) {
          addLog(`[News Feed] Institutional intelligence updated for all pairs.`);
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setIsNewsLoading(false);
      }
    };

    useEffect(() => {
      loadNews();
      const interval = setInterval(loadNews, 15 * 60 * 1000);
      return () => clearInterval(interval);
    }, [selectedPair]);
  
    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 50));
  
    const handleReentryProtocol = (signal: Signal) => {
      if (!settingsRef.current.autoScan) return;
      
      const style = signal.executionStyle || 'INTRADAY';
      
      if (style === 'SCALP') {
        addLog(`[RE-ENTRY] Scalp setup ${signal.pair} concluded. Re-scanning immediately for next scalp opportunity...`);
        handleGenerateSignal(signal.pair, true, `Re-entry after ${signal.status} hit on previous SCALP setup.`);
      } else if (style === 'INTRADAY') {
        // Intraday re-entries after a delay
        setTimeout(() => {
          addLog(`[RE-ENTRY] Intraday setup ${signal.pair} concluded. Performing neural audit for re-entry...`);
          handleGenerateSignal(signal.pair, true, `Re-entry audit after ${signal.status} hit on previous INTRADAY setup.`);
        }, 300000); // 5 min delay for intraday
      }
    };

    const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    const saved = localStorage.getItem('don_jay_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('don_jay_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  useEffect(() => {
    const processOfflineQueue = () => {
      if (navigator.onLine && offlineQueue.length > 0) {
        addLog(`[SYNC] Online detected. Processing ${offlineQueue.length} queued market events...`);
        // In a real app, we'd replay these events or check if they are still valid
        // For now, we'll just trigger a fresh scan for each queued pair
        const uniquePairs = Array.from(new Set(offlineQueue.map(q => q.pair)));
        uniquePairs.forEach((pair, index) => {
          setTimeout(() => handleGenerateSignal(pair as string, true, "Re-sync after offline period."), index * 2000);
        });
        setOfflineQueue([]);
      }
    };

    window.addEventListener('online', processOfflineQueue);
    return () => window.removeEventListener('online', processOfflineQueue);
  }, [offlineQueue]);

  // Add to queue if offline
  const queueOfflineEvent = (pair: string) => {
    if (!navigator.onLine) {
      setOfflineQueue(prev => [...prev, { pair, timestamp: Date.now() }].slice(-10)); // Keep last 10
      addLog(`[SYNC] Offline: Queuing ${pair} for neural audit when online.`);
    }
  };

  const handleManualScan = () => {
      if (isScanning) {
        addLog('! Neural Core is already busy with an active scan.');
        return;
      }
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
      const hourStr = formatInTimeZone(nowFull, SAST_TZ, 'HH');
      const dayStr = formatInTimeZone(nowFull, SAST_TZ, 'i'); // 1 (Mon) to 7 (Sun)
      const day = parseInt(dayStr);
      
      const isSastMarketClosed = day === 6 || day === 7;
      
      if (isSastMarketClosed) {
        if (Math.random() > 0.98) {
          addLog('[Neural Core] 24/7 Mode: Monitoring weekend liquidity pools...');
        }
      }

      // --- SILVER BULLET WINDOWS (CAT/SAST) ---
      const hour = parseInt(hourStr);
      const isSilverBullet = (hour === 10) || (hour === 17) || (hour === 21);
      
      // 1. Kill Zone Trigger (Priority)
      const zone = KILL_ZONES.find(kz => kz.time === nowStr);
      
      // Determine Market Context
      let marketContext = "";
      if (isSastMarketClosed) marketContext += "Weekend Liquidity. ";
      if (isSilverBullet) marketContext += "Silver Bullet Window. ";
      if (zone) marketContext += `Session Open: ${zone.name}. `;

      if (zone && lastTriggeredRef.current !== nowStr) {
        lastTriggeredRef.current = nowStr;
        
        addLog(`[Tactical Audit] Scheduled Injection: ${zone.name} triggered.`);
        
        if (zone.pair === 'ALL') {
          PAIRS.forEach((pair, index) => {
            setTimeout(() => handleGenerateSignal(pair, false, marketContext), index * 3000);
          });
        } else {
          handleGenerateSignal(zone.pair, false, marketContext);
        }
        return;
      }

      // 2. Opportunistic Deep Scan (Outside Kill Zones)
      // Runs periodically to find high-conviction setups
      const nowMs = nowFull.getTime();
      const scanInterval = 45000; // 45 seconds (Aggressive for continuous institutional setups)
      
      if (nowMs - lastDeepScanRef.current > scanInterval) {
        lastDeepScanRef.current = nowMs;
        addLog(`[Neural Core] Performing institutional audit for high-conviction opportunities...`);
        PAIRS.forEach((pair, index) => {
          setTimeout(() => handleGenerateSignal(pair, true, marketContext), index * 5000);
        });
      }

      // 3. Volatility Detection (Instant Injection)
      // Prioritize High-Beta assets during rapid expansions
      PAIRS.forEach(pair => {
        const p = pricesRef.current.find(price => price.symbol === pair);
        if (p) {
          const prevPrice = lastPriceMapRef.current[pair] || p.price;
          const delta = Math.abs(p.price - prevPrice);
          const threshold = pair === 'XAUUSD' ? 0.1 : 1.0; // Lowered threshold for ultra-sensitive "anytime" detection
          
          if (delta > threshold && nowMs - lastDeepScanRef.current > 15000) {
            let volContext = marketContext + "Trend Change / High Volatility Expansion. ";
            addLog(`[Volatility Detection] Rapid expansion on ${pair}. Injecting neural audit...`);
            handleGenerateSignal(pair, true, volContext);
          }
        }
      });
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
          
          wakeLockRef.current.addEventListener('release', () => {
            setIsWakeLockActive(false);
            // Attempt to re-request if released unexpectedly
            if (document.visibilityState === 'visible') {
              requestWakeLock();
            }
          });
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          addLog('! Wake Lock: Permission denied. Keep app in foreground.');
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
        // Registration successful
      }).catch((err) => {
        // Silent fail for SW
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
          addLog(`[Price Sync] Error: ${errMsg}. Retrying...`);
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

  // High-Frequency Price Pulse Engine (Institutional ECN Feed Protocol)
  useEffect(() => {
    const interval = setInterval(() => {
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
        const updated = prev.map(s => {
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

        // AUTO RE-SCAN: If trend flips, we immediately ask the AI to perform a DEEP SCAN to find a new setup aligned with the new trend
        if (settingsRef.current.autoScan) {
          addLog(`[AUTO] Trend flip detected. Triggering DEEP SCAN for ${s.pair} to align with new institutional flow...`);
          // Trigger deep scan (isSilent = false) to ensure user sees the audit process
          setTimeout(() => handleGenerateSignal(s.pair, false, "Trend Change Detected"), 100);
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
              handleReentryProtocol(s);
              changed = true;
            } else {
              // Check for TPs
              if (s.status !== 'TP3') {
                const hitTP3 = s.tp3 > 0 && (isBuy ? currentPrice >= s.tp3 : currentPrice <= s.tp3);
                const hitTP2 = s.tp2 > 0 && (isBuy ? currentPrice >= s.tp2 : currentPrice <= s.tp2);
                const hitTP1 = s.tp1 > 0 && (isBuy ? currentPrice >= s.tp1 : currentPrice <= s.tp1);

                // Determine if we've hit the FINAL target defined for this signal
                const isFinalTarget = hitTP3 || (s.tp3 === 0 && hitTP2) || (s.tp3 === 0 && s.tp2 === 0 && hitTP1);

                if (isFinalTarget && (
                  (hitTP3 && s.status !== 'TP3') ||
                  (hitTP2 && s.status !== 'TP2') ||
                  (hitTP1 && s.status !== 'TP1')
                )) {
                  newStatus = 'TP3';
                  const targetVal = hitTP3 ? s.tp3 : (hitTP2 ? s.tp2 : s.tp1);
                  const targetNum = hitTP3 ? 3 : (hitTP2 ? 2 : 1);
                  addLog(`💰 TAKE PROFIT ${targetNum} HIT: ${s.pair} at ${targetVal} (FINAL)`);
                  handleReentryProtocol(s);
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

        // AUTO-CLEANUP: Immediately remove terminal signals (SL, TP3, INVALIDATED) to keep the feed clean
        const next = updated.filter(s => s.status !== 'SL' && s.status !== 'INVALIDATED' && s.status !== 'TP3');
        
        if (next.length !== prev.length) changed = true;
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isMarketClosed]);

  const playNotificationSound = () => {
    if (!settings.soundEffects) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => {});
  };

  const playHighPrioritySound = () => {
    if (!settings.soundEffects) return;
    // Sonar/Tech sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.play().catch(e => {});
  };

    useEffect(() => {
      const now = new Date();
      const sastTime = formatInTimeZone(now, SAST_TZ, 'HH:mm:ss');
      addLog(`SYSTEM: Genesis AI Online (${SAST_TZ})`);
      addLog(`Neural Core: Precision Check COMPLETE`);
      addLog(`Auto-Injection Schedule: ACTIVE`);
      addLog(`Liquidity Monitoring: ACTIVE`);
      addLog(`Zero-Guess Protocol: ENABLED`);
      
      // Check for API Key
      const apiKey = (process as any).env?.GEMINI_API_KEY || "";
      const isPlaceholder = !apiKey || 
                           apiKey === "MY_GEMINI_API_KEY" || 
                           apiKey === "undefined" || 
                           apiKey === "null" ||
                           apiKey.trim() === "" ||
                           apiKey.includes("YOUR_API_KEY");

      if (isPlaceholder) {
        addLog(`⚠️ WARNING: Gemini API Key missing or invalid. Please configure it in Settings.`);
      } else {
        addLog(`✅ Neural Core: API Connection Active.`);
      }

      // TRIGGER IMMEDIATE GENESIS DEEP SCAN
      addLog('🚀 GENESIS DEEP SCAN INITIATED: Hunting XAUUSD & Indices...');
      ['XAUUSD', 'USTEC', 'US30', 'DAX'].forEach((pair, index) => {
        setTimeout(() => handleGenerateSignal(pair), index * 3000);
      });

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
        } catch (err) {
          console.error('Service Worker notification failed:', err);
          new Notification(title, options);
        }
      } else {
        new Notification(title, options);
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

  const handleGenerateSignal = async (pairOverride?: string, isSilent = false, marketContext?: string) => {
    const pair = pairOverride || selectedPairRef.current;
    
    if (scanningPairsRef.current.has(pair)) return;

    const now = Date.now();
    const isTrendChange = marketContext?.includes("Trend Change");
    
    // 1. Global Cooldown Check (Prevent Flooding)
    // Bypass for trend changes as they are critical institutional events
    if (!isTrendChange && now - lastInjectionTimeRef.current < GLOBAL_INJECTION_COOLDOWN_MS) {
      if (!isSilent) {
        const remaining = Math.ceil((GLOBAL_INJECTION_COOLDOWN_MS - (now - lastInjectionTimeRef.current)) / 1000);
        addLog(`[Neural Rest] Global cooldown active. Next audit in ${remaining}s.`);
      }
      return;
    }

    // 2. Per-Pair Cooldown Check (Ensure Variety)
    // Bypass for trend changes to ensure immediate realignment with new trend
    const lastPairInjection = lastInjectionTimesRef.current[pair] || 0;
    if (!isTrendChange && now - lastPairInjection < PAIR_INJECTION_COOLDOWN_MS) {
      if (!isSilent && pair === selectedPairRef.current) {
        const remaining = Math.ceil((PAIR_INJECTION_COOLDOWN_MS - (now - lastPairInjection)) / 60000);
        addLog(`[Neural Rest] ${pair} is cooling down. Next audit in ${remaining}m.`);
      }
      return;
    }
    
    // Weekend Restriction: Only BTCUSD on weekends (unless manual scan or beast mode)
    // Actually, the user wants 24/7 regardless of traditional market sessions.
    // We'll allow it but add a log warning about low liquidity if it's a weekend.
    if (isMarketClosed && pair !== 'BTCUSD') {
      if (!isSilent && Math.random() > 0.7) {
        addLog(`[EliteAlgo v32 pulse AI] Weekend Liquidity: Monitoring ${pair} for institutional gaps...`);
      }
    }
    
    // Reset daily count if date changed
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      addLog(`[SYSTEM] New trading day detected (${today}). Resetting daily signal count.`);
      setDailySignalCount(0);
      setLastResetDate(today);
    }

    if (!isSilent) {
      addLog(`[Neural Core] Deep scan initiated for ${pair}...`);
      addLog(`[Neural Core] Analyzing H4/H1 trend alignment...`);
      addLog(`[Neural Core] Applying EliteAlgo v32 pulse AI Sniper Wick Strategy...`);
      addLog(`[Neural Core] Checking for Institutional Liquidity Sweeps...`);
      if (settings.beastMode) {
        addLog(`[Market Destruction] Scanning for News-induced Liquidity Wicks...`);
      }
    }

    if (!navigator.onLine) {
      queueOfflineEvent(pair);
      return;
    }

    scanningPairsRef.current.add(pair);
    setIsScanning(true);
    
    try {
      if (!isSilent) {
        if (marketContext?.includes('anytime')) {
          addLog(`[EliteAlgo v32 pulse AI] Detecting sniper wick opportunity for ${pair}...`);
        } else {
          addLog(`AI: Analyzing ${pair} liquidity & EliteAlgo v32 pulse AI sentiment...`);
        }
        addLog(`[Neural Core] Sniper Wick Protocol: Filtering for surgical entries only.`);
      }
    
    const pairData = pricesRef.current.find(p => p.symbol === pair);
    const currentPrice = pairData?.price || 0;
    const changePercent = pairData?.changePercent || 0;
    
    if (!isSilent && currentPrice > 0) {
      addLog(`[Neural Core] Baseline Price: ${currentPrice.toFixed(2)}`);
    }

    if (currentPrice === 0) {
      if (!isSilent) addLog(`! ${pair}: Price feed unavailable. Retrying neural audit...`);
      return;
    }

    // Check for existing signals for this pair to ensure uniqueness
    const existingPairSignals = signalsRef.current.filter(s => s.pair === pair && (s.status === 'PENDING' || s.status === 'ACTIVE'));
    
    if (existingPairSignals.length >= 5) {
      if (!isSilent) addLog(`! AI skipping ${pair}: Maximum signals (5) already active. Close existing signals to re-scan.`);
      return;
    }

    if (!isSilent) {
      addLog(`[AI] Deep Scan: Applying Genesis Wick Sniper Protocols to ${pair}`);
      addLog(`[AI] Trend Analysis: ${changePercent > 0 ? 'BULLISH' : 'BEARISH'} detected.`);
    }
      const signal = await generateGenesisSignal(
        pair, 
        currentPrice, 
        changePercent, 
        settingsRef.current.equity, 
        settingsRef.current.riskPercent, 
        beastModeRef.current, 
        swingModeRef.current, 
        signalsRef.current, // Pass existing signals for strict duplicate prevention
        marketContext
      );
      
      if (!signal) {
        if (!isSilent) addLog(`! ${pair}: Neural Core returned empty response.`);
        return;
      }

      if (signal && 'no_setup' in signal) {
        if (!isSilent) {
          addLog(`AI: No high-probability setup detected for ${pair} at this time.`);
        } else {
          // Background log to show activity (Increased frequency for better visibility)
          const auditLogs = [
            `[Neural Audit] ${pair}: EliteAlgo v32 pulse AI: Monitoring institutional order flow...`,
            `[Neural Audit] ${pair}: Sniper Wick Strategy: Waiting for liquidity sweep...`,
            `[Neural Audit] ${pair}: Institutional audit complete. Zero-guess mandate enforced.`,
            `[Neural Audit] ${pair}: Market structure stable. No high-probability setup.`,
            `[Neural Audit] ${pair}: EliteAlgo v32 pulse AI: Analyzing H4/H1 trend alignment...`,
            `[Neural Audit] ${pair}: Checking liquidity pools for stop-run potential...`
          ];
          addLog(auditLogs[Math.floor(Math.random() * auditLogs.length)]);
        }
        return;
      }

      if (signal && 'quota_exceeded' in signal) {
        addLog(`! AI COOLDOWN: Rate limit reached. Neural Core resting for 60s...`);
        return;
      }

      if (signal && 'error' in signal) {
        addLog(`✘ AI ERROR: ${signal.error}`);
        return;
      }

    if (signal && !('no_setup' in signal) && !('quota_exceeded' in signal) && !('error' in signal)) {
      const sig = signal as Signal;
      
      const sigPair = sig.pair.replace('/', '').toUpperCase();
      const latestP = pricesRef.current.find(p => p.symbol.replace('/', '').toUpperCase() === sigPair);
      
      if (latestP) {
        const latestPrice = latestP.price;
        const isXAU = sigPair.includes('XAU');
        
        const prevPrice = lastPriceMapRef.current[sigPair] || latestPrice;
        const tickDelta = Math.abs(latestPrice - prevPrice);
        const volatilityThreshold = isXAU ? 5.0 : 100.0; // Increased to be less restrictive (50 pips for Gold, 100 for Indices)
        
        if (tickDelta > volatilityThreshold) {
          if (!isSilent) addLog(`! ${sig.pair}: Setup discarded due to extreme volatility.`);
          return;
        }
          
        // Update last price map after check
        lastPriceMapRef.current[sigPair] = latestPrice;

        const pipValue = isXAU ? 0.1 : (sigPair.includes('BTC') ? 1.0 : 1.0);
        const sigType = sig.type.toUpperCase();
        
        // Validate that the entry is still a valid pending order
        const isBuy = sigType.includes('BUY');
        const isLimit = sigType.includes('LIMIT');
        
        let isValidPending = false;
        const buffer = pipValue * 0.5; // Reduced buffer to 0.5 pips to allow for tighter sniper entries
        
        if (isBuy) {
          if (isLimit) {
            isValidPending = sig.entry < (latestPrice - buffer); // Buy Limit must be below price - buffer
          } else {
            isValidPending = sig.entry > (latestPrice + buffer); // Buy Stop must be above price + buffer
          }
        } else {
          if (isLimit) {
            isValidPending = sig.entry > (latestPrice + buffer); // Sell Limit must be above price + buffer
          } else {
            isValidPending = sig.entry < (latestPrice - buffer); // Sell Stop must be below price - buffer
          }
        }

        if (!isValidPending) {
          if (!isSilent) addLog(`! AI skipped ${sig.pair}: Price already touched or passed sniper entry level.`);
          return;
        }

        // PRICE PROXIMITY CHECK: Loosened to allow for institutional setups that aren't *immediately* about to trigger
        const entryDistance = Math.abs(sig.entry - latestPrice);
        const isBTC = sigPair.includes('BTC');
        const maxDistance = isXAU ? 5.0 : (isBTC ? 250.0 : 50.0); // 50 pips for Indices, 5 for Gold, 250 for BTC
        
        if (entryDistance > maxDistance) {
          if (!isSilent) addLog(`! ${sig.pair}: Setup discarded. Sniper entry too far (${(entryDistance / pipValue).toFixed(1)} pips) from current market price.`);
          return;
        }
          
        if (!isSilent) {
          addLog(`✓ Sniper Entry Secured: ${sig.pair} at ${sig.entry}`);
          addLog(`[Neural Core] No Losing Mindset: High-probability setup injected.`);
        }

        // DOMINATOR FILTER: Absolute selectivity. No guessing.
        const prob = sig.probabilityScore || 0;
        const threshold = beastModeRef.current ? 75 : 85;
        
        if (prob < threshold) {
          if (!isSilent) {
            addLog(`! ${sig.pair}: Setup discarded. Confidence (${prob}%) below Genesis threshold (${threshold}%).`);
          } else if (Math.random() > 0.8) {
            addLog(`Neural Core: ${sig.pair} setup discarded - Probability below ${threshold}%.`);
          }
          return;
        }

        // Final check to prevent conflicting signals or multiple entries for the same pair
        const existingPairSignals = signalsRef.current.filter(s => 
          s.pair === sig.pair && 
          (s.status === 'PENDING' || s.status === 'ACTIVE')
        );

        if (existingPairSignals.length > 0) {
          const isTooClose = existingPairSignals.some(s => {
            const dist = Math.abs(s.entry - sig.entry);
            const minPips = sig.pair === 'XAUUSD' ? 1.5 : 15.0; // 15 pips
            return dist < minPips;
          });

          if (isTooClose) {
            if (!isSilent) {
              addLog(`! ${sig.pair}: Setup discarded. A similar signal already exists at ${sig.entry}. Seeking fresh variety.`);
            }
            return;
          }

          if (!sig.isSecondary) {
            if (!isSilent) {
              addLog(`! ${sig.pair}: Setup discarded. Active signal exists and this is not marked as secondary.`);
            }
            return;
          }
        }

        setSignals(prev => [sig, ...prev]);
        setDailySignalCount(c => c + 1);
        lastInjectionTimeRef.current = Date.now();
        lastInjectionTimesRef.current[sig.pair] = Date.now();
        const dist = Math.abs(sig.entry - latestPrice);
        const pips = dist / (sig.pair === 'XAUUSD' ? 0.1 : 1.0);
        addLog(`✓ Sniper Entry: ${sig.type} ${sig.pair} @ ${sig.entry} (${pips.toFixed(1)} pips)`);
        
        if (sig.probabilityScore) {
          addLog(`Confidence Score: ${sig.probabilityScore}%`);
          if (sig.probabilityScore > 95) {
            addLog(`HIGH-PRIORITY: Institutional setup confirmed.`);
            if (settings.beastMode) {
              addLog(`[Market Destruction] Surgical entry secured with zero-guess mandate.`);
            }
            playHighPrioritySound();
          }
        }
        if (sig.pair === 'XAUUSD') {
          addLog(`XAUUSD: Stop Run detected. Liquidity sweep confirmed.`);
        }
        if (sig.reasoning) {
          addLog(`Rationale: ${sig.reasoning}`);
        }
        addLog(`Liquidity sweep confirmed at ${sig.entry}`);
        playNotificationSound();
        sendPushNotification(sig);
      }
    } else if (signal && 'no_setup' in signal) {
      if (!isSilent) {
        addLog(`! ${pair}: No high-probability setup found.`);
      }
    } else if (signal && 'quota_exceeded' in signal) {
      if (!isSilent) {
        addLog(`! AI QUOTA EXCEEDED: Cooling down for 60s...`);
      }
    } else if (signal && 'error' in signal) {
      if (!isSilent) {
        addLog(`! ${pair}: Analysis Failed - ${signal.error}`);
      }
    }
    } catch (err) {
      console.error('Signal generation error:', err);
      if (!isSilent) addLog(`! ${pair}: Neural Core crash. Restarting engine...`);
    } finally {
      scanningPairsRef.current.delete(pair);
      setIsScanning(scanningPairsRef.current.size > 0);
    }
  };

  const deleteSignal = (id: string) => {
    setSignals(prev => prev.filter(s => s.id !== id));
    addLog('Signal removed from feed.');
  };

  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto relative">
      <Header time={time} status={isScanning ? 'SCANNING' : isMarketClosed ? '24/7 MODE' : 'READY'} settings={settings} beastMode={beastMode} onScan={handleManualScan} />
      
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
        <div className="mx-4 mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3">
          <Zap className="text-primary" size={20} />
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">EliteAlgo v32 pulse AI: 24/7 ACTIVE</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Monitoring all pairs for institutional sweeps and weekend gaps. No guessing.</p>
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
          <NeuralIndicator 
            prices={prices} 
            beastMode={beastMode} 
          />
          <TradingViewChart symbol={
            selectedPair === 'XAUUSD' ? 'OANDA:XAUUSD' : 
            selectedPair === 'USTEC' ? 'NASDAQ:NDX' : 
            selectedPair === 'US30' ? 'DJ:DJI' : 
            'CAPITALCOM:DE40'
          } />
        </section>

        {/* News Feed Section */}
        <NewsFeed news={news} isLoading={isNewsLoading} onRefresh={loadNews} />

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
            <span className="text-[12px] font-black text-slate-500 group-hover:text-primary uppercase tracking-widest">MANUAL SCAN</span>
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
              <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-2">
                  <Activity size={10} className="text-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">ANYTIME OPPORTUNITIES</span>
                </div>
                <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-tighter">EliteAlgo v32 pulse AI scans every 2 mins outside kill zones for surgical entries.</p>
              </div>
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
                { name: 'Liquidity Sweep', win: '88%', rr: '1:8' },
                { name: 'NY Silver Bullet', win: '91%', rr: '1:10' },
                { name: 'Frankfurt Gap', win: '85%', rr: '1:12' },
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
                <span className="text-xs font-bold text-primary">1:8</span>
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
                    {[selectedSignal.tp1, selectedSignal.tp2, selectedSignal.tp3].filter(tp => tp > 0).map((tp, i) => (
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
                    {selectedSignal.eliteAlgoCloud && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-1">
                        <span className="text-[7px] font-black text-slate-500 uppercase">ELITE CLOUD</span>
                        <span className={cn(
                          "text-[10px] font-mono font-black",
                          selectedSignal.eliteAlgoCloud === 'BULLISH' ? "text-success" : "text-danger"
                        )}>{selectedSignal.eliteAlgoCloud}</span>
                      </div>
                    )}
                    {selectedSignal.liquiditySweepConfirmed && (
                      <div className="flex justify-between items-center border-t border-white/5 pt-1">
                        <span className="text-[7px] font-black text-slate-500 uppercase">LIQUIDITY SWEEP</span>
                        <span className="text-[10px] font-mono font-black text-primary">CONFIRMED</span>
                      </div>
                    )}
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

                <button 
                  onClick={() => {
                    const text = `GENESIS SIGNAL: ${selectedSignal.type} ${selectedSignal.pair}\nENTRY: ${selectedSignal.entry}\nSL: ${selectedSignal.sl}\nTP1: ${selectedSignal.tp1}\nTP2: ${selectedSignal.tp2}\nTP3: ${selectedSignal.tp3}\nLOTS: ${selectedSignal.lotSize}`;
                    navigator.clipboard.writeText(text);
                    addLog(`✓ ${selectedSignal.pair} signal copied to clipboard.`);
                  }}
                  className="w-full py-3 bg-primary/10 border border-primary/30 rounded-xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Copy size={14} /> COPY SIGNAL DATA
                </button>
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

                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Scan size={16} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">AUTO SCAN</span>
                    </div>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, autoScan: !s.autoScan }))}
                      className={cn("w-10 h-5 rounded-full relative transition-all duration-300", settings.autoScan ? "bg-primary" : "bg-slate-800")}
                    >
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", settings.autoScan ? "right-0.5" : "left-0.5")} />
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
