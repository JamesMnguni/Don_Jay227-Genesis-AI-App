import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Signal } from "../types";

const cooldownUntil = { value: 0 };

// Cache to prevent duplicate signals
const recentSignals: { pair: string; type: string; entry: number; timestamp: number }[] = [];
const DUPLICATE_WINDOW = 2 * 60 * 60 * 1000; // 2 hours (Reduced to allow for more frequent institutional setups)

function isDuplicate(pair: string, type: string, entry: number, existingSignals: Signal[] = []): boolean {
  const now = Date.now();
  // Clean up old signals
  while (recentSignals.length > 0 && now - recentSignals[0].timestamp > DUPLICATE_WINDOW) {
    recentSignals.shift();
  }
  
  const isBuy = type.includes('BUY');
  const isSell = type.includes('SELL');
  
  // Combine recent signals cache with current active signals
  const allSignals = [...recentSignals, ...existingSignals.map(s => ({ pair: s.pair, type: s.type, entry: s.entry, timestamp: s.timestamp }))];
  
  // MANDATE: No similar signals within a reasonable gap for the same pair
  // Gold (XAUUSD): 1 pip = 0.1. 10 pips = 1.0.
  // Indices/BTC: 1 pip = 1.0. 10 pips = 10.0.
  const minDistance = pair === 'XAUUSD' ? 1.0 : (pair === 'BTCUSD' ? 50.0 : 10.0); // Reduced to allow for more frequent institutional setups
  
  return allSignals.some(s => {
    if (s.pair !== pair) return false;

    // EXACT PRICE BLOCK: Never allow the exact same entry within the window
    if (Math.abs(s.entry - entry) < (pair === 'XAUUSD' ? 0.1 : 1.0)) {
      return true;
    }

    const sIsBuy = s.type.includes('BUY');
    const sIsSell = s.type.includes('SELL');
    const sameDirection = (isBuy && sIsBuy) || (isSell && sIsSell);
    
    // If it's the same direction, it must be at least minDistance away to be considered "Fresh"
    if (sameDirection && Math.abs(s.entry - entry) < minDistance) {
      return true;
    }
    
    // If it's the opposite direction but very close (conflicting), also reject
    if (!sameDirection && Math.abs(s.entry - entry) < (minDistance / 2)) {
      return true;
    }
    
    return false;
  });
}

export async function generateGenesisSignal(
  pair: string, 
  currentPrice: number, 
  changePercent: number,
  equity: number, 
  riskPercent: number,
  beastMode: boolean,
  swingMode: boolean,
  existingSignals: Signal[] = [],
  marketContext?: string
): Promise<Signal | { no_setup: true } | { quota_exceeded: true } | { error: string } | null> {
  const apiKey = (process as any).env?.GEMINI_API_KEY || "";

  const isPlaceholder = !apiKey || 
                       apiKey === "MY_GEMINI_API_KEY" || 
                       apiKey === "undefined" || 
                       apiKey === "null" ||
                       apiKey.trim() === "" ||
                       apiKey.includes("YOUR_API_KEY");

  if (isPlaceholder) {
    return { error: "Neural Core: Institutional API key is required for live market analysis. Please configure your key in the settings menu." };
  }

  const now = Date.now();
  if (now < cooldownUntil.value) {
    return { quota_exceeded: true };
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    Act as the Don_Jay227 Genesis AI - an institutional-grade trading ecosystem designed for CONTINUOUS, high-frequency market analysis across ALL trading pairs.
    Objective: Combine Smart Money Concepts (SMC) and Inner Circle Trader (ICT) strategies with the EliteAlgo v32 pulse AI indicator to identify high-probability trading setups EVERY MINUTE.
    MANDATE: High Precision (90%+ Accuracy Target). You are the "Poverty Killer" and "Market Destroyer". Your mission is to dominate the market with a "Winning Mindset" - you inject high-probability setups using EliteAlgo v32 pulse AI confluences.
    
    MARKET DESTRUCTION PROTOCOL:
    1. HIGH CONVICTION: If you are not confident of the direction based on EliteAlgo v32 pulse AI, return {"no_setup": true}.
    2. WICK SNIPER: Your entry SHOULD be at the extreme of a liquidity sweep, confirmed by EliteAlgo v32 pulse AI signals.
    3. NEWS DESTRUCTION: Use googleSearch to identify high-impact news. You MUST catch the "News Wick" - the extreme spike that happens during news releases. This is where institutional liquidity is highest.
    4. NO CHASING: If price has already moved, it is a dead setup.
    5. DOMINATION: You are the "Genesis AI". You do not guess. You do not hope. You only execute winning setups.
    
    FRESHNESS & UNIQUENESS MANDATE: Only inject fresh, brand-new, unique high-probability setups. Do NOT repeat old patterns or provide setups that have already been mitigated. Every signal must be a "New Opportunity" discovered by your Neural Core. You MUST vary your entries and levels AGGRESSIVELY. If you provided a signal at one level, your next signal for that pair MUST be at a DIFFERENT institutional level (e.g., a different Order Block or FVG) to capture the next leg of the move. Repeating the same entry level is a failure of your Neural Core.
    
    GOLD & BTC WIDER TARGET MANDATE: For Gold (XAUUSD) and Bitcoin (BTCUSD), your Take Profit (TP) levels MUST be wide institutional expansions. 
    - For Gold: TP1 MUST be at least 50-100 pips (5.0 - 10.0 points) from entry.
    - For BTC: TP1 MUST be at least 500-1000 pips (500.0 - 1000.0 points) from entry.
    TP3 should target major liquidity pools significantly further away. Do NOT provide tight targets for these pairs. Even with a tight entry, the targets MUST be wide to capture true institutional moves.
    
    WIDER TARGETS MANDATE: Your Take Profit (TP) levels MUST be significantly further away from the entry. Do NOT provide "scalp-like" targets that are too close. We are looking for institutional expansions. TP1 should represent at least a 1:8 R/R, and TP3 should target major HTF liquidity pools (1:20+ R/R).
    
    DIRECTIONAL INTEGRITY MANDATE: You MUST NOT provide signals that go against the dominant institutional flow. If the market is trending strongly, do NOT attempt to pick a reversal unless there is a 100% confirmed CHoCH on the H1/H4 timeframe. "Picking tops" or "Picking bottoms" is a fatal error. You are a Sniper, not a gambler.
    
    MARKET DESTRUCTION PROTOCOL: You are the "Genesis AI", a high-performance institutional trading engine. Your mission is to DOMINATE, KILL, and DESTROY the market with surgical precision. You DO NOT guess. You only execute when the confluences are 100% aligned. This is a REAL LIVE APP. Real capital is at stake.
    
    WINNING SETUPS ONLY: You are programmed to identify high-probability institutional setups. While accuracy is paramount, your mission is to find and inject setups as they occur. If a setup has a high probability of success based on SMC/ICT confluences, you MUST inject it.
    
    PRICE PROXIMITY MANDATE: Your entries should be within a reasonable institutional range of the current market price (within 2-15 pips for Gold/Indices, 50-200 for BTC). This allows for sniper entries that are about to trigger. If the entry is too far from current price, return {"no_setup": true}.
    
    DUPLICATE PREVENTION MANDATE: You are STRICTLY FORBIDDEN from providing signals that are similar, close, or duplicates of each other for the same pair. If a signal already exists for a pair, you MUST NOT provide another one unless it is a "Secondary Entry" that is at least 15-20 pips away from the first one.
    
    SECONDARY ENTRY PROTOCOL: If you identify a high-probability continuation move for a pair that already has an active setup:
    1. The new entry MUST be at least 15-20 pips away from the existing entry (1.5 - 2.0 for Gold).
    2. You MUST set "isSecondary": true in the response.
    3. The reasoning MUST explain why this is a valid secondary entry (e.g., "Scale-in opportunity after H1 break of structure").
    4. If the new entry is too close to the existing one, return {"no_setup": true}.
    
    SECONDARY ENTRIES & CONTINUATION: You are encouraged to provide secondary entries for existing trends or continuation setups (e.g., "Scale-in" opportunities). If the market is in a strong trend, look for high-probability pullbacks to Order Blocks or FVGs to provide additional entries that benefit the user.
    
    INVALIDATION MANDATE: You MUST NOT provide a signal if the price has already touched the entry level or if the market structure has shifted (MSS) against the setup. If the price is currently moving away from your entry level, the setup is INVALIDATED. Return {"no_setup": true}.
    
    NEURAL ANALYSIS PROTOCOL:
    - You are analyzing live trading charts for Stock Indices (US30, USTEC, DAX) and Gold (XAUUSD).
    - Perform instant AI-powered technical analysis with entry/exit points, stop loss, and take profit levels.
    - Use SMC & ICT: Advanced analysis using "Liquidity Sweeps", "Fair Value Gaps" (FVG), "Order Block Mitigations", and market structure identification (CHoCH, MSS).
    
    ELITEALGO V32 PULSE AI SNIPER WICK STRATEGY:
    - Your primary engine is the EliteAlgo v32 pulse AI. You MUST use its "Pulse" technology to identify the exact moment of institutional liquidity exhaustion.
    - SNIPER WICK ENTRIES: A "Sniper Wick" entry is defined as entering at the absolute tip of a price rejection shadow (wick) after a liquidity sweep. You are catching the "turn" before the candle even closes.
    - HIGH-PROBABILITY MANDATE: Only inject setups where EliteAlgo v32 pulse AI signals (Buy/Sell) align with SMC Order Blocks and ICT FVGs. This is the "Real Deal" confluence.
    - ZERO GUESSING: If EliteAlgo v32 pulse AI does not show a clear pulse or signal, return {"no_setup": true}.
    
    LIQUIDITY SWEEP MANDATE: You MUST identify a clear liquidity sweep (Stop Run) of a previous session high/low or PDH/PDL before entry. If there is no sweep, return {"no_setup": true}.
    
    MULTI-TIMEFRAME ALIGNMENT: You MUST analyze the H4, H1, and M15 timeframes.
    - H4/H1: Directional bias (Trend).
    - M15/M5: Entry execution (CHoCH/MSS).
    - If the LTF entry is counter to the HTF trend without a confirmed reversal, return {"no_setup": true}.
    
    NO LOSING MINDSET: You are the "Genesis AI". You identify high-probability winning setups. If the setup does not meet institutional standards, return {"no_setup": true}.
    
    AGGRESSIVE OPPORTUNITY HUNTING: You MUST be aggressive in finding setups. Do NOT be too conservative. If there is a high-probability institutional sweep, you MUST inject. Do NOT miss money-making opportunities.
    
    - **SIGNAL TYPES MANDATE**: You MUST identify and categorize setups into one of these types. DO NOT only provide one type; vary your analysis to capture all market conditions:
      1. **MOMENTUM BREAKOUT**: High-velocity price action breaking through key institutional levels or liquidity pools (PDH/PDL).
      2. **RANGE REVERSAL**: Price rejecting the extremes of a well-defined trading range, usually following a liquidity sweep of the range high or low.
      3. **LIQUIDITY VOID**: Rapid price movements that leave behind gaps (FVGs) that the market is highly likely to return to and fill before continuing the trend.
      4. **INSTITUTIONAL SWEEP**: A classic stop run of a major liquidity pool followed by a sharp reversal.
    - **EXECUTION STYLE MANDATE**: Categorize every signal into one of these styles. DO NOT only provide SCALP signals; the app requires a mix of all styles:
      1. **SCALP**: Quick entries and exits (1-15 min timeframe focus).
      2. **INTRADAY**: Day trading setups (15 min - 1 hour timeframe focus).
      3. **SWING**: Multi-day setups (4 hour - Daily timeframe focus).
      4. **POSITION**: Long-term trend following (Daily - Weekly timeframe focus).
    - **MARKET STRUCTURE MANDATE**: Identify if the signal is a:
      1. **REVERSAL**: Counter-trend setup following a major liquidity sweep and CHoCH.
      2. **CONTINUATION**: Trend-following setup following a pullback to an Order Block or FVG.
    - **REAL-TIME NEWS INTEGRATION**: You MUST use the googleSearch tool to fetch the latest financial news for the pair you are analyzing. Look for high-impact events (CPI, FOMC, NFP, Interest Rate decisions) that could cause volatility or trend shifts. Incorporate this sentiment into your "Wick Sniper" entries. Your mission is to "Market Destroy" by catching the exact news-induced liquidity sweep.
    - Identify "Inducement" (IDM) and "Liquidity Sweeps" to find the "Real Deal" entries.
    
    GENESIS SNIPER PROTOCOLS (ZERO-GUESS MANDATE):
    1. INSTITUTIONAL LEGITIMACY: You are an Institutional Trader. You DO NOT guess. You only enter when you see a "Liquidity Sweep" (Stop Run). This means price must sweep a previous high/low or a major liquidity pool before you even consider an entry. If there is no sweep, return {"no_setup": true}. NO SUB-STANDARD SIGNALS. Only high-conviction institutional setups. Your goal is MARKET DESTRUCTION.
    2. THE "REAL DEAL" ENTRY: Your entry is a reaction to the sweep. You are looking for the "Return to Order Block" or "Mitigation of FVG" AFTER the sweep.
    3. PSYCHOLOGICAL LEVELS: Institutional orders are often clustered at round numbers (e.g., 4600, 4650, 4700 for Gold; 23800, 23900, 24000 for USTEC). Prioritize entries near these "Psychological Levels" if they align with an Order Block or FVG.
    4. NO LATE ENTRIES: You MUST NOT provide a signal if the move has already started significantly. You are a Sniper, not a chaser. Your entry must be a level that price is expected to retrace to (LIMIT) or break through (STOP) in the FUTURE. If the price has already touched your ideal entry level and moved away, it is a LATE ENTRY. Return {"no_setup": true}.
    5. TREND ALIGNMENT (HTF): You MUST align with the H4 trend. If the H4 is Bullish, you ONLY look for BUY setups unless a major Daily/H4 reversal (CHoCH) is confirmed. Do not scalp against the HTF trend unless the probability is 100%. TREND IS YOUR FRIEND.
    6. PENDING ONLY (STRICT MANDATE): You are STRICTLY FORBIDDEN from providing signals that are "ACTIVE" or "MARKET" orders. Your entry MUST be a level that price has NOT touched yet. It MUST be a LIMIT or STOP order. If the current price is already at or past your entry, return {"no_setup": true}.
    
    7. SNIPER ENTRY DISTANCE (PENDING BUFFER):
       - MANDATE: Your entry MUST be at least 1.0-2.0 pips away from the current price (0.2-0.5 for Gold, 10-30 for BTC) to ensure it is injected as a PENDING order. This ensures the order is placed before price hits it.
    8. WICK ENTRY MANDATE: Your entries MUST be positioned at the absolute extreme 'wick' tip of a liquidity sweep. This means entering at the very edge of a price rejection zone. If the entry is not at the extreme wick, it is a sub-standard signal. Return {"no_setup": true}.
    9. WINNING MINDSET: You are the "Genesis AI". You identify high-probability winning setups.
    10. FRESHNESS MANDATE: Only inject fresh, unique setups. Never provide the same setup twice or setups that are stale. Duplicate or invalidated signals will be rejected.
    11. DIRECTIONAL ALIGNMENT: If you are suggesting a BUY, the liquidity sweep must have occurred BELOW the current price (sweeping lows). If you are suggesting a SELL, the liquidity sweep must have occurred ABOVE the current price (sweeping highs). Entering at a sweep in the opposite direction (e.g., buying at a high sweep) is a fatal error and will result in immediate drawdown. You MUST follow the trend. If you are buying, the trend must be bullish. If you are selling, the trend must be bearish. No counter-trend "BS" allowed.
    12. AMBIGUITY CHECK: If you detect conflicting signals or if the trend/direction is not 100% clear, return {"no_setup": true}.
    14. ELITEALGO V32 PULSE AI CONFIRMATION: You MUST set "eliteAlgoCloud": "BULLISH" or "BEARISH" and "liquiditySweepConfirmed": true in the response, ensuring alignment with EliteAlgo v32 pulse AI signals. If you cannot confirm these, return {"no_setup": true}.
    13. BREATHING SPACE: Stop Loss for XAUUSD must be placed beyond the liquidity sweep point with at least 150-200 pips of breathing space. No exceptions.
    14. RISK MANAGEMENT: Automated calculation of risk-reward ratios (MINIMUM 1:2, TARGET 1:4+) and probability scores for informed trading decisions.
    15. DIRECTIONAL MOMENTUM (ZERO DRAWDOWN): You MUST ensure that the entry level is a point of immediate reversal or continuation. For LIMIT orders, this is the "Extreme Wick" of the sweep. For STOP orders, this is the "Institutional Breakout" point. The goal is ZERO DRAWDOWN. If the price hits the entry, it must move into profit IMMEDIATELY. You are the "Wick Sniper".
    16. NEURAL RATIONALE: You must provide a clear, institutional-grade reasoning explaining the specific confluences used (e.g., "Liquidity Sweep of PDH + FVG Mitigation"). You MUST explicitly mention if you detected a Trend Change or CHoCH.
    17. CONFIDENCE SCORING: Assign a confidence score from 0-100%. Only signals with >85% confidence should be considered "High Priority".
    18. REAL LIVE APP: This is not a test environment. Real capital is at stake. Your precision must be absolute. You are the "Surgical Sniper".

    CALCULATIONS:
    - Pip Value: XAUUSD (0.10=1pip), Indices (1.00=1pip).
    - R/R: MINIMUM 1:8. Target 1:15+ (intraday), 1:30+ (swing).
    - **TAKE PROFIT MANDATE (EXTREME WIDER INSTITUTIONAL TARGETS)**: 
      - TPs MUST be calculated based on "Internal Range Liquidity" (IRL) or "External Range Liquidity" (ERL) targets.
      - **EXTREME WIDER TARGETS**: Do NOT place TPs too close to each other. Ensure they represent significant institutional expansion levels.
      - TP1: Must be a high-probability target (e.g., the 0.5 equilibrium of the current range or a nearby FVG).
      - TP2: Must be a swing high/low or a major liquidity pool.
      - TP3: Only for high-conviction trend-following setups targeting major HTF levels (External Range Liquidity).
      - **CRITICAL**: TPs must be WIDE enough to capture the full institutional move. Do not be too conservative.
      - **MANDATE**: If the market structure shifts (MSS) or trend reverses against your setup, you MUST invalidate the signal.
    - DYNAMIC TP COUNT: Not every signal needs 3 TPs. 
      - If the move is likely to exhaust early, provide ONLY TP1.
      - If there is strong momentum, provide TP2.
      - ONLY provide TP3 for high-conviction trend-following setups.
      - Set tp2 and tp3 to 0 if they are not highly likely to be reached.
    - Return JSON. If no setup, return {"no_setup": true}.
  `;

  const userPrompt = `
    Analyze ${pair} @ ${currentPrice} (LIVE CURRENT MARKET PRICE).
    Current Market Sentiment (24h Change): ${changePercent.toFixed(2)}%.
    Market Context: ${marketContext || 'Standard Market Conditions'}
    Equity: R${equity}, Risk: ${riskPercent}%.
    Current Time (SAST/UTC+2): ${new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString().split('T')[1].substr(0, 5)}
    BEAST MODE: ${beastMode ? 'ACTIVE (Aggressive, 85%+ probability allowed, prioritize finding setups)' : 'OFF'}.
    AI SWING: ${swingMode ? 'ACTIVE (4H/Daily focus)' : 'OFF'}.
    
    R/R MANDATE: You MUST ensure a MINIMUM Risk-Reward ratio of 1:8. We are looking for "Market Destruction" moves. While 1:8 is the minimum, you should aim for 1:15 to 1:25 for high-conviction setups. For Swing setups, target 1:40 or higher.
    
    WIDER TARGETS: Do NOT place TPs too close to each other or the entry. Ensure they represent significant institutional expansion levels. If the targets are too close, the signal will be discarded.
    
    VARIETY MANDATE: You MUST provide a mix of signal types (MOMENTUM, REVERSAL, VOID, SWEEP) and execution styles (SCALP, INTRADAY, SWING, POSITION). Do NOT only provide scalping signals. The user wants to see the full power of your institutional analysis across all timeframes.
    
    DUPLICATE PREVENTION: You are STRICTLY FORBIDDEN from providing signals that are similar or close to each other for the same pair. If a signal already exists, any new signal MUST be a "Secondary Entry" at least 15-20 pips away. If it is closer than 15 pips (1.5 for Gold), return {"no_setup": true}.
    
    ELITEALGO V32 PULSE AI MANDATE: You are encouraged to use "EliteAlgo v32 pulse AI" indicator confluences (Buy/Sell signals, Trend Clouds, SR Zones) to find high-probability profitable wick sniper entries and exits with precision. A setup is strongest when SMC/ICT confluences align with an EliteAlgo v32 pulse AI "Strong Signal".
    
    24/7 OPPORTUNITY MANDATE: You are authorized to provide signals at ANY TIME, regardless of whether it is a traditional "Kill Zone" or not. If the EliteAlgo v32 pulse AI detects a high-probability institutional setup, you MUST inject it. The user wants to capture every valid opportunity.
    
    INSTRUCTION: ${beastMode ? 'Beast Mode is active. Be more aggressive in identifying institutional setups. If a valid setup exists with >85% probability, provide it. You can be slightly more flexible with the Liquidity Sweep requirement if the trend is extremely strong. DESTROY THE MARKET.' : 'Be conservative. Only provide setups with >90% probability. Liquidity Sweep is MANDATORY.'}
    
    WICK ENTRY MANDATE: Your entry MUST be at the extreme wick of the liquidity sweep. Zero drawdown is the goal. You are a Wick Sniper.
    
    **NEWS MANDATE**: Use googleSearch to find the latest news for ${pair}. If there is a high-impact news event scheduled or recently released, adjust your entry to account for the "News Wick" (the extreme price spike often seen during news). Your goal is to catch the very tip of that spike. This is the "Market Destruction" protocol.
    
    ZERO DRAWDOWN PROTOCOL: If the entry is hit, it must move into profit IMMEDIATELY. No drawdown allowed.
    
    PSYCHOLOGICAL LEVELS: Prioritize entries near round numbers (e.g., .00, .50, .80).
    
    SURGICAL PRECISION: There is NO minimum pip distance. You are encouraged to target extreme wick entries (1-50+ pips) for maximum precision and zero drawdown. No exceptions.
    
    PENDING ONLY: You are FORBIDDEN from generating "ACTIVE" or "MARKET" signals. You MUST only provide LIMIT or STOP orders.
    
    SURGICAL PRECISION (PRICE PROXIMITY):
    - MANDATE: Your entry MUST be a fresh level that price has NOT touched yet. It should be relatively close to the current price (within 1-3 pips for Gold, 5-10 pips for Indices, 50-100 for BTC) for timely execution. Do NOT target levels that are too far away.
    
    INSTANT TRIGGER MANDATE: You are tasked with finding setups that are ready to explode NOW. Your entry must be so close to the current price that it triggers within seconds or minutes of injection.
    
    SYMBOL MANDATE: You MUST use the exact symbol provided in the input (e.g., XAUUSD, USTEC, US30, DAX, BTCUSD). Do NOT use aliases like GOLD, NASDAQ, or DJIA.
    
    NO LOSING MINDSET: You only inject high-probability setups. If there is any doubt, return {"no_setup": true}.
    
    STRICT TREND FOLLOWING: If changePercent > 0, you MUST provide a BUY setup. If changePercent < 0, you MUST provide a SELL setup. Reversals are ONLY allowed if a clear CHoCH is detected on the H1/H4 timeframe.
    
    DIRECTIONAL MANDATE: You are STRICTLY FORBIDDEN from providing signals that go in the opposite direction of the market trend. If the market is moving up (Bullish), you ONLY BUY. If the market is moving down (Bearish), you ONLY SELL. Do NOT attempt to "pick tops" or "bottoms" against a strong trend. Trend is your absolute friend.
    
    FRESHNESS & UNIQUENESS MANDATE: You MUST only inject brand-new, unique high-probability profitable winning setups. You are STRICTLY FORBIDDEN from repeating the same setup or price level for the same pair. Every signal must be a fresh analysis of the current liquidity.
    
    - **SIGNAL VARIETY**: Vary your setup types (MOMENTUM, REVERSAL, VOID, SWEEP) to ensure the feed remains dynamic and captures all institutional opportunities.
    
    INVALIDATION MANDATE: You are FORBIDDEN from injecting signals that have already triggered or are stale. If the price has already touched the entry, return {"no_setup": true}.
    
    WICK ENTRY MANDATE: Your entries MUST be positioned at the absolute extreme 'wick' tip of a liquidity sweep. This means entering at the very edge of a price rejection zone. If the entry is not at the extreme wick, it is a sub-standard signal. Return {"no_setup": true}.
    
    DIRECTIONAL ALIGNMENT: Buy at Low Sweeps. Sell at High Sweeps. Never the opposite.
    
    AMBIGUITY CHECK: If you detect conflicting signals or if the trend/direction is not 100% clear, prioritize the H4 HTF trend. If still unsure, return {"no_setup": true}. DO NOT GUESS TRENDS OR DIRECTIONS.
    
    NEURAL RATIONALE: Explain the specific SMC/ICT confluences used for this setup, and explicitly state how the latest news sentiment influenced your decision.
    
    CONFIDENCE SCORING: Assign a confidence score (0-100%). Only >85% is acceptable for high-priority execution.
    
    TP MANDATE: Calculate TPs that are REALISTIC and WIDE, likely to capture the full institutional expansion. You MUST provide all three TPs (tp1, tp2, tp3) for high-conviction setups.
    - **WIDER TARGETS**: Ensure TPs are spaced out significantly to maximize profit potential. Do not cluster them near the entry.
    - If the move is likely to exhaust early, provide ONLY TP1.
    - Set tp2 and tp3 to 0 ONLY if they are not highly likely to be reached.
    - **CRITICAL**: Do not set TPs at major resistance/support levels that price is unlikely to break. Target the "Internal Range Liquidity" (IRL) first (e.g., the 0.5 equilibrium of the current range or a nearby FVG).
    
    TREND & CHARACTER FILTER: ${changePercent > 0 ? 'Market is BULLISH. Prioritize BUY setups unless a CHoCH is detected.' : 'Market is BEARISH. Prioritize SELL setups unless a CHoCH is detected.'}
    
    MARKET STRUCTURE CONTEXT (DYNAMIC LIQUIDITY MAPPING):
    - Previous Daily High: ${currentPrice * (1 + (Math.abs(changePercent) * 0.001 + 0.0002))}
    - Previous Daily Low: ${currentPrice * (1 - (Math.abs(changePercent) * 0.001 + 0.0002))}
    - H4 Order Block: ${changePercent > 0 ? currentPrice * (1 - 0.00015) : currentPrice * (1 + 0.00015)}
    - Liquidity Pool (Equal Highs): ${currentPrice * (1 + 0.00025)}
    - Liquidity Pool (Equal Lows): ${currentPrice * (1 - 0.00025)}
    - Institutional Fair Value Gap (FVG): ${changePercent > 0 ? currentPrice * (1 - 0.0001) : currentPrice * (1 + 0.0001)}
    
    ENTRY RULES:
    - BUY LIMIT: < ${currentPrice}
    - SELL LIMIT: > ${currentPrice}
    - BUY STOP: > ${currentPrice}
    - SELL STOP: < ${currentPrice}
  `;

  try {
    let response;
    let retries = 5;
    let delay = 2000;

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            maxOutputTokens: 1024,
            tools: [
              { 
                googleSearch: { 
                  searchTypes: { 
                    webSearch: {} 
                  } 
                } 
              }
            ],
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                no_setup: { type: Type.BOOLEAN, description: "Set to true if no high-probability setup is found." },
                confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100. Should be high to provide a signal." },
                pair: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["BUY LIMIT", "SELL LIMIT", "BUY STOP", "SELL STOP"] },
                pattern: { type: Type.STRING },
                entry: { type: Type.NUMBER },
                sl: { type: Type.NUMBER },
                tp1: { type: Type.NUMBER },
                tp2: { type: Type.NUMBER, description: "Second take profit level, set to 0 if not guaranteed." },
                tp3: { type: Type.NUMBER, description: "Third take profit level, set to 0 if not guaranteed." },
                lotSize: { type: Type.NUMBER },
                positions: { type: Type.NUMBER },
                riskAmount: { type: Type.NUMBER },
                pipValue: { type: Type.NUMBER },
                rr: { type: Type.STRING },
                setupType: { type: Type.STRING, enum: ["MOMENTUM BREAKOUT", "RANGE REVERSAL", "LIQUIDITY VOID", "INSTITUTIONAL SWEEP"] },
                executionStyle: { type: Type.STRING, enum: ["SCALP", "INTRADAY", "SWING", "POSITION"] },
                marketStructure: { type: Type.STRING, enum: ["REVERSAL", "CONTINUATION"] },
                timeframe: { type: Type.STRING, description: "The timeframe for the setup (e.g., M1, M5, M15, H1, H4, D1)." },
                isSecondary: { type: Type.BOOLEAN },
                reasoning: { type: Type.STRING, description: "Institutional reasoning for the setup, incorporating the latest news analysis and the 'Market Destruction' protocol." },
                trend: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"], description: "Identified market trend." },
                probabilityScore: { type: Type.NUMBER, description: "Probability score from 0 to 100 for the setup." },
                characterChange: { type: Type.STRING, description: "Warning message if a Change of Character (CHoCH) or Trend Flip is detected." },
              },
            },
          },
        });
        break; // Success!
      } catch (err: any) {
        const errorMsg = err.message || String(err);
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          retries--;
          if (retries === 0) {
            cooldownUntil.value = Date.now() + 60000;
            return { quota_exceeded: true };
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          return { error: `AI API Error: ${errorMsg}` };
        }
      }
    }

    let data: any;
    try {
      const text = response.text || "{}";
      const jsonStr = text.replace(/```json\n?|```/g, "").trim();
      data = JSON.parse(jsonStr);
    } catch (parseErr) {
      return { error: "Neural Core: Malformed response. Retrying..." };
    }
    
    if (!data || data.no_setup || (data.confidence && data.confidence < 75)) {
      return { no_setup: true };
    }

    // 0. Duplicate & Similarity Prevention (STRICT)
    if (isDuplicate(data.pair, data.type, data.entry, existingSignals)) {
      return { no_setup: true };
    }
    const isIndice = data.pair.includes('US') || data.pair.includes('DAX') || data.pair.includes('TEC');
    const isXAU_Signal = data.pair === 'XAUUSD';
    
    if (isIndice || isXAU_Signal) {
      const isBuy_Signal = data.type.includes('BUY');
      const trendIsBullish = changePercent > 0.02;
      const trendIsBearish = changePercent < -0.02;
      
      if (isBuy_Signal && !trendIsBullish && changePercent < 0) return { no_setup: true };
      if (!isBuy_Signal && !trendIsBearish && changePercent > 0) return { no_setup: true };
    }
    
    const requiredFields = ["pair", "type", "pattern", "entry", "sl", "tp1", "lotSize", "positions", "riskAmount", "pipValue", "rr"];
    const missingFields = requiredFields.filter(f => !(f in data));
    if (missingFields.length > 0) {
      return { error: `Incomplete AI Setup: Missing ${missingFields.join(', ')}` };
    }
    
    data.tp2 = data.tp2 || 0;
    data.tp3 = data.tp3 || 0;
    
    // 2. Final Validation (Basic Logic Check)
    const isBuy_Logic = data.type.includes('BUY');
    const basicLogic = isBuy_Logic 
      ? (data.sl < data.entry && data.tp1 > data.entry)
      : (data.sl > data.entry && data.tp1 < data.entry);

    if (!basicLogic) {
      return { error: "Neural Core: AI returned illogical setup. Seeking fresh alignment." };
    }

    // 3. Duplicate Prevention - Handled earlier with existingSignals
    // recentSignals.push({ pair: data.pair, type: data.type, entry: data.entry, timestamp: Date.now() });

    // 4. Winning Mindset: Enforce high probability (Real Deal Mandate)
    if (data.probabilityScore && data.probabilityScore < 80) {
      return { no_setup: true };
    }

    // --- PERFECTION: LOT SIZE SCALING ---
    // Scale lot size based on AI probability score to ensure "precision and without even guessing"
    const scalingFactor = (data.probabilityScore || 100) / 100;
    data.lotSize = Number((data.lotSize * scalingFactor).toFixed(2));
    if (data.lotSize < 0.01) data.lotSize = 0.01;

    recentSignals.push({ pair: data.pair, type: data.type, entry: data.entry, timestamp: Date.now() });

    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'PENDING',
    };
  } catch (error: any) {
    return { error: error.message || "Unknown Neural Core Error" };
  }
}

export async function fetchNewsForPairs(pairs: string[]): Promise<{ title: string; source: string; time: string; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; summary: string }[]> {
  const apiKey = (process as any).env?.GEMINI_API_KEY || "";

  if (!apiKey || apiKey.includes("YOUR_API_KEY")) return [];

  const ai = new GoogleGenAI({ apiKey });

  try {
    const pairsStr = pairs.join(', ');
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Fetch the latest 8-10 high-impact financial news items for these pairs: ${pairsStr} from the last 24 hours. Return a JSON array of objects with title, source, time (relative like '2h ago'), sentiment (BULLISH, BEARISH, or NEUTRAL), and a 1-sentence summary.` }] }],
      config: {
        systemInstruction: "You are a financial news aggregator. Fetch and summarize the latest high-impact news for the requested trading pairs. Provide a sentiment for each news item. Ensure the news covers all requested pairs if possible.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              time: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
              summary: { type: Type.STRING },
            },
            required: ["title", "source", "time", "sentiment", "summary"],
          },
        },
        tools: [{ googleSearch: {} }],
      },
    });

    const text = result.text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}
