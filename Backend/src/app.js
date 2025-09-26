const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const config = require('./config');
const routes = require('./routes');

// Ensure temp dir exists
fs.mkdirSync(config.uploads.tempDir, { recursive: true });

const app = express();

// Core middleware
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',') }));
app.use(express.json({ limit: `${config.uploads.maxMb}mb` }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  // 2 minutes timeout for hackathon demo
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

app.get("/ping", async (req, res) => {
  try {
    // Call your AI/ML FastAPI backend
    console.log("Pinging AI/ML backend...");
    const response = await fetch("https://hornless-almeta-atomistically.ngrok-free.dev/analyze-repository", {
      method: "POST", // or GET depending on your backend
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo_url: "https://github.com/tanmayy-2907/smart_curriculum_activity_sih_2025"
      })
    });

    if (!response.ok) {
      throw new Error(`AI server error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// Health & base route
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
