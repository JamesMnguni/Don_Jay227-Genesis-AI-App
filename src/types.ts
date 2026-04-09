export interface Signal {
  id: string;
  pair: string;
  type: 'BUY LIMIT' | 'SELL LIMIT' | 'BUY STOP' | 'SELL STOP';
  pattern: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  lotSize: number;
  positions: number;
  riskAmount: number;
  pipValue: number;
  timestamp: number;
  status: 'PENDING' | 'ACTIVE' | 'TP1' | 'TP2' | 'TP3' | 'SL' | 'INVALIDATED' | 'TREND_CHANGE';
  rr: string;
  setupType?: 'MOMENTUM BREAKOUT' | 'RANGE REVERSAL' | 'LIQUIDITY VOID' | 'INSTITUTIONAL SWEEP';
  executionStyle?: 'SCALP' | 'INTRADAY' | 'SWING' | 'POSITION';
  marketStructure?: 'REVERSAL' | 'CONTINUATION';
  timeframe?: string;
  isSecondary?: boolean;
  reasoning?: string;
  trend?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  probabilityScore?: number;
  characterChange?: string;
  eliteAlgoCloud?: 'BULLISH' | 'BEARISH';
  liquiditySweepConfirmed?: boolean;
}

export interface AppSettings {
  pushNotifications: boolean;
  soundEffects: boolean;
  autoScan: boolean;
  riskPercent: number;
  equity: number;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  lastPrice?: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
}
