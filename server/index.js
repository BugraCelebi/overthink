const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');
const tasksRouter = require('./routes/tasks');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/tasks', tasksRouter);

app.get('/api/progress', (_req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM user_progress WHERE id = 1').get());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production: serve the built React app
if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback — all non-API routes go to index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', app: 'Overthink API', version: '1.0.0' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Overthink running at http://localhost:${PORT}`);
  if (isProd) console.log('Mode: production');
});
