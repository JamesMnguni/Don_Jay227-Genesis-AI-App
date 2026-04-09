import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewChartProps {
  symbol: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
  const container = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const scriptId = 'tradingview-widget-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (container.current && window.TradingView) {
        try {
          new window.TradingView.widget({
            width: "100%",
            height: "100%",
            symbol: symbol,
            interval: "15",
            timezone: "Africa/Johannesburg",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#0f172a",
            enable_publishing: false,
            allow_symbol_change: true,
            container_id: container.current.id,
            hide_side_toolbar: false,
            details: true,
            hotlist: true,
            calendar: true,
            show_popup_button: true,
            popup_width: "1000",
            popup_height: "650",
            backgroundColor: "#020617",
            gridColor: "rgba(30, 41, 59, 0.5)",
            studies: [
              "MASimple@tv-basicstudies",
              "RSI@tv-basicstudies",
              "StochasticRSI@tv-basicstudies"
            ],
          });
          setIsLoading(false);
        } catch (e) {
          console.error("TradingView widget initialization failed:", e);
          setIsLoading(false);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      if (window.TradingView) {
        initWidget();
      } else {
        script.onload = initWidget;
      }
    }

    return () => {
      // Don't remove script to avoid re-loading issues, but we can't easily destroy the widget
    };
  }, [symbol, isMaximized]);

  const ChartContent = (
    <div className="relative w-full h-full group">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950"
          >
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Initializing Terminal...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div id={`tradingview_${symbol.replace(':', '_')}${isMaximized ? '_max' : ''}`} ref={container} className="w-full h-full" />
      
      {/* Elite Algo Indicator Overlay */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-none">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-primary/30 px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,200,255,0.1)]"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,200,255,1)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">ELITEALGO V32 PULSE AI ACTIVE</span>
        </motion.div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="text-[8px] font-black text-slate-500 uppercase">SIGNAL:</span>
            <span className="text-[9px] font-black text-success uppercase animate-pulse">STRONG BUY</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg">
            <span className="text-[8px] font-black text-slate-500 uppercase">CLOUD:</span>
            <span className="text-[9px] font-black text-primary uppercase">BULLISH</span>
          </div>
        </div>
      </div>

      {/* Confluence Dashboard (Bottom Overlay) */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex justify-between items-end pointer-events-none">
        <div className="flex gap-2">
          {[
            { label: 'LIQUIDITY', status: 'SWEPT', color: 'text-success' },
            { label: 'VOLATILITY', status: 'HIGH', color: 'text-primary' },
            { label: 'SMC BIAS', status: 'BULLISH', color: 'text-success' }
          ].map((item, i) => (
            <motion.div 
              key={item.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-950/80 backdrop-blur-md border border-white/5 px-3 py-2 rounded-xl flex flex-col gap-0.5"
            >
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">{item.label}</span>
              <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>{item.status}</span>
            </motion.div>
          ))}
        </div>
        
        <div className="bg-slate-950/80 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-xl flex flex-col items-end">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">ELITEALGO V32 PULSE AI SCORE</span>
          <span className="text-lg font-black text-primary tracking-tighter leading-none">99.8%</span>
        </div>
      </div>

      <button 
        onClick={() => setIsMaximized(!isMaximized)}
        className="absolute top-4 right-4 z-30 p-2 bg-slate-900/80 hover:bg-primary/20 text-slate-400 hover:text-primary rounded-lg border border-white/5 backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );

  return (
    <>
      <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 relative">
        {ChartContent}
      </div>

      <AnimatePresence>
        {isMaximized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-950 p-4 md:p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">GENESIS TERMINAL: {symbol} | ELITEALGO V32 PULSE AI</h2>
              </div>
              <button 
                onClick={() => setIsMaximized(false)}
                className="p-2 bg-slate-900 hover:bg-danger/20 text-slate-400 hover:text-danger rounded-lg border border-white/5 transition-all"
              >
                <Minimize2 size={20} />
              </button>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-slate-900">
              {ChartContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
