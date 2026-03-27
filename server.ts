import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // 2026 Target Baselines (Institutional Reference Points)
  const BASELINES_2026: Record<string, number> = {
    XAUUSD: 4404.05,
    USTEC: 24219.10,
    US30: 46221.60,
    DAX: 22596.00
  };

  // Real-time price proxy (initialized with 2026 values)
  let lastValidPrices: Record<string, any> = {
    XAUUSD: { price: 4404.05, change: 0, changePercent: 0 },
    USTEC: { price: 24219.10, change: 0, changePercent: 0 },
    US30: { price: 46221.60, change: 0, changePercent: 0 },
    DAX: { price: 22596.00, change: 0, changePercent: 0 }
  };

  const fetchWithRetry = async (url: string, options: any = {}, retries = 3, delay = 300) => {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for faster cycling
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) return response;
      } catch (e) {
        // Silent retry
      }
      if (i < retries - 1) await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Failed to fetch after ${retries} retries`);
  };

  const symbolMap: Record<string, string> = {
    XAUUSD: "XAUUSD=X",
    USTEC: "^NDX",
    US30: "^DJI",
    DAX: "^GDAXI"
  };

  app.get("/api/prices", async (req, res) => {
    try {
      // Attempt to fetch real-time prices from Yahoo Finance
      const fetchPromises = Object.keys(symbolMap).map(async (key) => {
        try {
          const symbol = symbolMap[key];
          // includePrePost=true is critical for "Live" feel outside regular hours
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=true`;
          const resp = await fetchWithRetry(url);
          const data = await resp.json();
          const result = data.chart.result[0];
          
          if (result && result.meta) {
            const meta = result.meta;
            // Use regularMarketPrice or chartPreviousClose to get the most "Live" value
            const realPrice = meta.regularMarketPrice || meta.chartPreviousClose;
            const realPrevClose = meta.previousClose || meta.chartPreviousClose;
            
            if (realPrice && realPrevClose) {
              // Calculate the "Pulse" (percentage change from real market)
              const changePercent = ((realPrice - realPrevClose) / realPrevClose) * 100;
              
              // Apply the real-world "Pulse" to our 2026 Baseline
              const baseline = BASELINES_2026[key];
              const syncedPrice = baseline * (1 + (changePercent / 100));
              const syncedChange = syncedPrice - baseline;
              
              lastValidPrices[key] = {
                price: Number(syncedPrice.toFixed(2)),
                change: Number(syncedChange.toFixed(2)),
                changePercent: Number(changePercent.toFixed(2)),
                _isLive: true
              };
            }
          }
        } catch (e) {
          // Fallback to high-precision simulation if fetch fails
          // This ensures the prices ALWAYS move and feel "Live" even during API hiccups
          const p = lastValidPrices[key];
          const baseline = BASELINES_2026[key];
          
          // More aggressive simulation volatility to match "Pulse"
          const volatility = p.price * 0.00015; 
          const move = (Math.random() - 0.5) * volatility;
          
          p.price = Number((p.price + move).toFixed(2));
          p.change = Number((p.price - baseline).toFixed(2));
          p.changePercent = Number(((p.price - baseline) / baseline * 100).toFixed(2));
          p._isLive = false;
        }
      });

      await Promise.all(fetchPromises);

      res.json({
        ...lastValidPrices,
        _ts: Date.now()
      });
    } catch (error) {
      console.error("Critical error in /api/prices:", error);
      res.json({ 
        ...lastValidPrices, 
        _ts: Date.now(),
        error: "Pulse simulation active"
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
