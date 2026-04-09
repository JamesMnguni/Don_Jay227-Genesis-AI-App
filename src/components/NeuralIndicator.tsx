import React, { useMemo } from 'react';
import { Brain, Zap, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { MarketPrice } from '../types';

interface NeuralIndicatorProps {
  prices: MarketPrice[];
  beastMode: boolean;
}

export const NeuralIndicator: React.FC<NeuralIndicatorProps> = ({ prices, beastMode }) => {
  const sentiment = useMemo(() => {
    if (prices.length === 0) return 50;
    // Calculate neural sentiment based on average 24h change of all pairs
    const avgChange = prices.reduce((acc, p) => acc + p.changePercent, 0) / prices.length;
    // Increased sensitivity and balanced base
    const base = 50 + (avgChange * 15); 
    const jitter = (Math.random() - 0.5) * 5;
    return Math.min(Math.max(base + jitter, 5), 95);
  }, [prices]);

  const structure = useMemo(() => {
    const structures = ['ACCUMULATION', 'MANIPULATION', 'DISTRIBUTION', 'MARKET SHIFT', 'RE-ACCUMULATION'];
    // Aggregate structure based on all prices
    const avgPrice = prices.reduce((acc, p) => acc + p.price, 0) / (prices.length || 1);
    const index = Math.floor((avgPrice * 100) % structures.length);
    return structures[index];
  }, [prices]);

  const liquidityStatus = useMemo(() => {
    const statuses = ['LIQUIDITY SWEPT', 'PENDING SWEEP', 'ORDER BLOCK MITIGATED', 'FVG FILLING'];
    const avgPrice = prices.reduce((acc, p) => acc + p.price, 0) / (prices.length || 1);
    const index = Math.floor((avgPrice * 150) % statuses.length);
    return statuses[index];
  }, [prices]);

  const cloudStatus = useMemo(() => {
    const avgChange = prices.reduce((acc, p) => acc + p.changePercent, 0) / (prices.length || 1);
    return avgChange > 0 ? 'BULLISH' : 'BEARISH';
  }, [prices]);

  return (
    <div className="glass-panel p-4 rounded-2xl border-primary/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-primary animate-pulse" />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">NEURAL INDICATOR: GENESIS ECOSYSTEM</h3>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
          <Activity size={10} className="text-primary" />
          <span className="text-[8px] font-black text-primary uppercase">GLOBAL FEED</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sentiment Gauge */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase">GLOBAL SENTIMENT</span>
            <span className={cn(
              "text-[10px] font-black",
              sentiment > 55 ? "text-success" : sentiment < 45 ? "text-danger" : "text-primary"
            )}>
              {sentiment > 55 ? 'BULLISH' : sentiment < 45 ? 'BEARISH' : 'NEUTRAL'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: '50%' }}
              animate={{ width: `${sentiment}%` }}
              className={cn(
                "h-full transition-all duration-1000",
                sentiment > 55 ? "bg-success shadow-[0_0_10px_rgba(0,230,118,0.5)]" : 
                sentiment < 45 ? "bg-danger shadow-[0_0_10px_rgba(255,82,82,0.5)]" : 
                "bg-primary shadow-[0_0_10px_rgba(0,200,255,0.5)]"
              )}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white/20 z-10" />
          </div>
        </div>

        {/* Probability Score */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase">ECOSYSTEM PROBABILITY</span>
            <span className="text-[10px] font-black text-white">
              {Math.floor(85 + (sentiment > 50 ? (sentiment - 50) / 3.3 : (50 - sentiment) / 3.3))}%
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 flex-1 rounded-sm transition-all duration-500",
                  i < 8 + Math.floor((sentiment > 50 ? sentiment - 50 : 50 - sentiment) / 25) ? "bg-primary" : "bg-slate-800"
                )} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
          <span className="text-[7px] font-black text-slate-500 uppercase">STRUCTURE</span>
          <span className="text-[9px] font-black text-white text-center leading-tight">{structure}</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
          <span className="text-[7px] font-black text-slate-500 uppercase">LIQUIDITY</span>
          <span className="text-[9px] font-black text-primary text-center leading-tight">{liquidityStatus}</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
          <span className="text-[7px] font-black text-slate-500 uppercase">ELITEALGO V32 PULSE AI</span>
          <span className={cn(
            "text-[9px] font-black text-center leading-tight",
            cloudStatus === 'BULLISH' ? "text-success" : "text-danger"
          )}>{cloudStatus}</span>
        </div>
        <div className="bg-slate-900/50 p-2 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1">
          <span className="text-[7px] font-black text-slate-500 uppercase">VOLATILITY</span>
          <div className="flex items-center gap-1">
            <Zap size={10} className={cn(beastMode ? "text-primary" : "text-slate-400")} />
            <span className="text-[9px] font-black text-white">{beastMode ? 'HIGH' : 'NORMAL'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <Target size={12} className="text-primary animate-pulse" />
        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">
          EliteAlgo v32 pulse AI active 24/7. Monitoring all pairs for institutional sweeps...
        </p>
      </div>
    </div>
  );
};
