const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');
const tasksRouter = require('./routes/tasks');
const authRouter  = require('./routes/auth');
const { authenticateToken } = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tasks', authenticateToken, tasksRouter);

app.get('/api/progress', authenticateToken, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO user_progress (user_id) VALUES (?)').run(req.user.id);
    res.json(db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (isProd) {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
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
