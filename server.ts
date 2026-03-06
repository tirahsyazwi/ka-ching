import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("kaching.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    sender TEXT,
    amount TEXT,
    tng_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )
`);

// Cleanup expired links periodically
setInterval(() => {
  try {
    const stmt = db.prepare("DELETE FROM links WHERE expires_at < CURRENT_TIMESTAMP");
    const info = stmt.run();
    if (info.changes > 0) {
      console.log(`Cleaned up ${info.changes} expired links.`);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}, 1000 * 60 * 60); // Every hour

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Create Link
  app.post("/api/links", (req, res) => {
    try {
      const { tng_url } = req.body;
      const requiredPrefix = "https://cdn.tngdigital.com.my/s/oauth2/index.html#/moneypacket?";
      
      // Pengesahan lebih ketat: Mesti bermula dengan prefix dan mengandungi packetId atau p
      const isValidTngUrl = tng_url && 
                           tng_url.startsWith(requiredPrefix) && 
                           (tng_url.includes("packetId=") || tng_url.includes("p=")) &&
                           (tng_url.includes("packetId=") ? tng_url.split("packetId=")[1]?.length > 5 : tng_url.split("p=")[1]?.length > 5);

      if (!isValidTngUrl) {
        return res.status(400).json({ error: "Pautan TNG Money Packet tidak sah. Pastikan anda menyalin pautan penuh dari aplikasi TNG eWallet." });
      }

      const id = Math.random().toString(36).substring(2, 10);
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const stmt = db.prepare("INSERT INTO links (id, tng_url, expires_at) VALUES (?, ?, ?)");
      stmt.run(id, tng_url, expiresAt.toISOString());

      res.json({ id });
    } catch (error: any) {
      console.error("Error creating link:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API: Get Link
  app.get("/api/links/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM links WHERE id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)");
    const link = stmt.get(req.params.id);
    if (!link) {
      return res.status(404).json({ error: "Pautan tidak dijumpai atau telah tamat tempoh." });
    }
    res.json(link);
  });

  // Smart Middleware / Dynamic Metadata Route
  app.get("/g/:id", (req, res, next) => {
    const userAgent = req.headers["user-agent"] || "";
    const isBot = /WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|Slackbot|LinkedInBot|Threads|Discordbot/i.test(userAgent);

    const stmt = db.prepare("SELECT * FROM links WHERE id = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)");
    const link = stmt.get(req.params.id) as any;

    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Pautan Tamat Tempoh | Ka-ching Link</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              :root { --primary: #FF6321; --bg: #F5F2ED; }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background: var(--bg); 
                color: #1A1A1A;
                text-align: center;
                overflow: hidden;
              }
              
              body::before {
                content: "";
                position: absolute;
                inset: 0;
                opacity: 0.03;
                background-image: radial-gradient(#1A1A1A 1px, transparent 1px);
                background-size: 24px 24px;
                pointer-events: none;
              }

              .card { 
                background: white; 
                padding: 4rem 2rem; 
                border-radius: 3rem; 
                box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.1); 
                max-width: 400px; 
                width: 85%;
                position: relative;
                z-index: 1;
                border: 1px solid rgba(0,0,0,0.05);
                animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
              }

              @keyframes shake {
                10%, 90% { transform: translate3d(-1px, 0, 0); }
                20%, 80% { transform: translate3d(2px, 0, 0); }
                30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                40%, 60% { transform: translate3d(4px, 0, 0); }
              }

              .icon-container {
                width: 100px;
                height: 100px;
                background: #FEE2E2;
                border-radius: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 2rem;
                color: #EF4444;
              }

              h1 { 
                color: #1A1A1A; 
                font-size: 2rem; 
                margin: 0 0 1rem; 
                font-weight: 800; 
                letter-spacing: -0.02em;
              }

              p { 
                opacity: 0.5; 
                line-height: 1.6; 
                font-size: 1.1rem; 
                margin-bottom: 2.5rem;
              }

              .btn {
                display: inline-block;
                background: var(--primary);
                color: white;
                padding: 1rem 2rem;
                border-radius: 1.5rem;
                font-weight: 700;
                text-decoration: none;
                transition: all 0.2s ease;
                box-shadow: 0 10px 20px rgba(255, 99, 33, 0.2);
              }

              .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(255, 99, 33, 0.3);
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/><line x1="10" y1="11" x2="14" y2="15"/><line x1="14" y1="11" x2="10" y2="15"/></svg>
              </div>
              <h1>Alamak, Poket Kosong!</h1>
              <p>Pautan ini telah tamat tempoh atau tidak lagi wujud dalam sistem kami.</p>
              <a href="/" class="btn">Jana Pautan Baru</a>
            </div>
          </body>
        </html>
      `);
    }

    if (isBot) {
      // Read custom metadata from metadata.json
      let title = `Duit Raya untuk anda! 🧧`;
      let description = `Seseorang telah menghantar Duit Raya kepada anda! Klik untuk tuntut sekarang di Touch 'n Go eWallet.`;
      
      try {
        const metadataPath = path.join(__dirname, "metadata.json");
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        if (metadata.ogTitle) title = metadata.ogTitle;
        if (metadata.ogDescription) description = metadata.ogDescription;
      } catch (err) {
        console.error("Error reading metadata.json:", err);
      }

      // Dynamic OG Image based on query parameter
      const hasGif = req.query.hasGif === "true";
      let ogImage = `https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=1200&h=630&auto=format&fit=crop`;
      let ogImageType = "image/jpeg";
      let ogWidth = "1200";
      let ogHeight = "630";

      if (hasGif) {
        ogImage = `https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZnd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4Znd4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKDkDbIDJieKbVm/giphy.gif`;
        ogImageType = "image/gif";
        ogWidth = "480";
        ogHeight = "480";
      }

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            
            <!-- Open Graph / Facebook / Threads / WhatsApp -->
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${ogImage}" />
            <meta property="og:image:secure_url" content="${ogImage}" />
            <meta property="og:image:type" content="${ogImageType}" />
            <meta property="og:image:width" content="${ogWidth}" />
            <meta property="og:image:height" content="${ogHeight}" />
            <meta property="og:type" content="website" />
            
            <!-- Twitter -->
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title}" />
            <meta name="twitter:description" content="${description}" />
            <meta name="twitter:image" content="${ogImage}" />
            
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #F5F2ED; color: #1A1A1A; text-align: center; }
              .card { background: white; padding: 3rem 2rem; border-radius: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); max-width: 450px; width: 90%; border: 1px solid rgba(0,0,0,0.05); }
              .icon { font-size: 4rem; margin-bottom: 1.5rem; display: block; }
              h1 { color: #FF6321; font-size: 2rem; margin-bottom: 1rem; font-weight: 800; letter-spacing: -0.02em; }
              p { opacity: 0.6; line-height: 1.6; font-size: 1.1rem; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="icon">🧧</span>
              <h1>Ka-ching!</h1>
              <p><strong>${title}</strong></p>
              <p>${description}</p>
            </div>
          </body>
        </html>
      `);
    }

    // Human: Show a festive "Kad Raya" redirecting page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Menghubungkan ke Duit Raya...</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            :root { --primary: #FF6321; --bg: #F5F2ED; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0; 
              background: var(--bg); 
              color: #1A1A1A;
              overflow: hidden;
            }
            
            /* Background Pattern */
            body::before {
              content: "";
              position: absolute;
              inset: 0;
              opacity: 0.03;
              background-image: radial-gradient(#1A1A1A 1px, transparent 1px);
              background-size: 24px 24px;
              pointer-events: none;
            }

            .card {
              background: white;
              padding: 4rem 2rem;
              border-radius: 3rem;
              box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.15);
              text-align: center;
              max-width: 400px;
              width: 85%;
              position: relative;
              z-index: 1;
              border: 1px solid rgba(0,0,0,0.05);
              transform: translateY(0);
              animation: entry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            @keyframes entry {
              from { opacity: 0; transform: translateY(40px) scale(0.9); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }

            /* Rotating Wallet Animation (Simulating GIF) */
            .wallet-container {
              width: 120px;
              height: 120px;
              margin: 0 auto 2.5rem;
              perspective: 1000px;
            }

            .wallet {
              width: 100%;
              height: 100%;
              background: var(--primary);
              border-radius: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 20px 40px rgba(255, 99, 33, 0.3);
              animation: float 3s ease-in-out infinite, rotate 4s linear infinite;
              transform-style: preserve-3d;
            }

            .wallet svg {
              width: 60px;
              height: 60px;
              color: white;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }

            @keyframes rotate {
              0% { transform: rotateY(0deg); }
              100% { transform: rotateY(360deg); }
            }

            h2 { 
              margin: 0 0 0.5rem; 
              font-size: 1.75rem; 
              font-weight: 800; 
              letter-spacing: -0.03em; 
              color: #1A1A1A;
            }
            
            p { 
              opacity: 0.5; 
              font-size: 1rem; 
              margin: 0;
              line-height: 1.5;
            }

            .progress-bar {
              width: 100%;
              height: 6px;
              background: #F0F0F0;
              border-radius: 10px;
              margin-top: 2.5rem;
              overflow: hidden;
            }

            .progress-fill {
              height: 100%;
              background: var(--primary);
              width: 0%;
              animation: fill 1.5s linear forwards;
            }

            @keyframes fill {
              to { width: 100%; }
            }

            /* Festive Sparkles */
            .sparkle {
              position: absolute;
              width: 10px;
              height: 10px;
              background: var(--primary);
              border-radius: 50%;
              opacity: 0;
              animation: sparkle-anim 2s infinite;
            }

            @keyframes sparkle-anim {
              0% { transform: scale(0) rotate(0deg); opacity: 0; }
              50% { opacity: 0.8; }
              100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
            }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = "${link.tng_url}";
            }, 1500);
          </script>
        </head>
        <body>
          <div class="card">
            <div class="wallet-container">
              <div class="wallet">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
              </div>
            </div>
            <h2>Menyediakan Duit Raya...</h2>
            <p>Sila tunggu sebentar, anda akan dibawa ke Touch 'n Go eWallet.</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
          </div>
          
          <!-- Decorative Sparkles -->
          <div class="sparkle" style="top: 20%; left: 20%; animation-delay: 0.1s;"></div>
          <div class="sparkle" style="top: 70%; left: 80%; animation-delay: 0.5s;"></div>
          <div class="sparkle" style="top: 40%; left: 85%; animation-delay: 0.8s;"></div>
          <div class="sparkle" style="top: 80%; left: 15%; animation-delay: 1.2s;"></div>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
