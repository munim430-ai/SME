import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  // 1. Credit Scoring Logic (Backend as requested)
  app.post("/api/scoring", (req, res) => {
    const { transactions, ledgerBalance } = req.body;
    
    // Simple logic layer for MVP:
    // Balance volume, frequency, and debt ratio.
    let score = 500; // Base score
    
    if (transactions && Array.isArray(transactions)) {
      score += transactions.length * 10; // Volume
    }
    
    if (ledgerBalance) {
      const debtRatio = ledgerBalance.totalDue / (ledgerBalance.totalPaid || 1);
      if (debtRatio < 0.2) score += 100;
      if (debtRatio > 0.8) score -= 150;
    }

    score = Math.min(1000, Math.max(100, score));
    
    res.json({ score });
  });

  // 2. Placeholder for SMS Trigger
  app.post("/api/remind", (req, res) => {
    const { phoneNumber, amount, buyerName } = req.body;
    console.log(`[SMS MOCK] Sending reminder to ${phoneNumber}: "Hello ${buyerName}, you have a pending baki of Tk ${amount} with Keystone SME."`);
    res.json({ success: true, message: "Reminder fired" });
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
    console.log(`Keystone SME Server running on http://localhost:${PORT}`);
  });
}

startServer();
