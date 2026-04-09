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

  // 2026 Target Baselines (Institutional Reference Points from Live Feed)
  const BASELINES_2026: Record<string, number> = {
    XAUUSD: 4799.48,
    USTEC: 25064.8,
    US30: 47854.6,
    DAX: 24148.4,
    BTCUSD: 72080.21
  };

  // Real-time price proxy (initialized with real values from image)
  let lastValidPrices: Record<string, any> = {
    XAUUSD: { price: 4799.48, change: 81.60, changePercent: 3.37 },
    USTEC: { price: 25064.8, change: 81.60, changePercent: 3.37 }, // Using US100 baseline
    US30: { price: 47854.6, change: 117.90, changePercent: 2.53 },
    DAX: { price: 24148.4, change: 90.22, changePercent: 3.88 },
    BTCUSD: { price: 72080.21, change: 276.90, changePercent: 4.00 }
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
    DAX: "^GDAXI",
    BTCUSD: "BTC-USD"
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
              // Calculate the real change and percentage
              const change = realPrice - realPrevClose;
              const changePercent = (change / realPrevClose) * 100;
              
              lastValidPrices[key] = {
                price: Number(realPrice.toFixed(2)),
                change: Number(change.toFixed(2)),
                changePercent: Number(changePercent.toFixed(2)),
                _isLive: true
              };
            }
          }
        } catch (e) {
          // Autonomous Price Maintenance if fetch fails
          const p = lastValidPrices[key];
          
          // Use a small volatility for maintenance
          const volatility = p.price * 0.0001; 
          const move = (Math.random() - 0.5) * volatility;
          
          p.price = Number((p.price + move).toFixed(2));
          // We keep the change/percent from the last valid fetch or just maintain a small move
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
        error: "Pulse Protocol Active"
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
