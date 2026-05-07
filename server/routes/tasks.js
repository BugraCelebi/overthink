const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUSES = ['doing', 'brewing', 'on_hold', 'done'];

router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  const { title, description, priority = 'normal', status = 'doing', due_date } = req.body;

  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!['low', 'normal', 'high'].includes(priority)) return res.status(400).json({ error: 'Invalid priority' });
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, status, completed, due_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(title.trim(), description || null, priority, status, status === 'done' ? 1 : 0, due_date || null, req.user.id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const updatedTitle       = title       !== undefined ? title.trim()         : task.title;
  const updatedDescription = description !== undefined ? description          : task.description;
  const updatedPriority    = priority    !== undefined ? priority             : task.priority;
  const updatedStatus      = status      !== undefined ? status               : task.status;
  const updatedDueDate     = due_date    !== undefined ? (due_date || null)   : task.due_date;

  if (!VALID_STATUSES.includes(updatedStatus)) return res.status(400).json({ error: 'Invalid status' });

  const wasCompleted = task.completed === 1;
  const isNowDone    = updatedStatus === 'done';

  let completedAt = task.completed_at;
  if (!wasCompleted && isNowDone)  completedAt = new Date().toISOString();
  if (wasCompleted  && !isNowDone) completedAt = null;

  try {
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, priority = ?, status = ?, completed = ?, completed_at = ?, due_date = ?
      WHERE id = ? AND user_id = ?
    `).run(updatedTitle, updatedDescription, updatedPriority, updatedStatus, isNowDone ? 1 : 0, completedAt, updatedDueDate, id, req.user.id);

    const ensureProgress = db.prepare('INSERT OR IGNORE INTO user_progress (user_id) VALUES (?)');
    ensureProgress.run(req.user.id);
    const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ?').get(req.user.id);

    if (!wasCompleted && isNowDone) {
      db.prepare(`UPDATE user_progress SET total_xp = ?, tasks_completed = ?, level = ? WHERE user_id = ?`)
        .run(progress.total_xp + task.xp_value, progress.tasks_completed + 1, Math.floor((progress.total_xp + task.xp_value) / 100) + 1, req.user.id);
    }
    if (wasCompleted && !isNowDone) {
      const newXp = Math.max(0, progress.total_xp - task.xp_value);
      db.prepare(`UPDATE user_progress SET total_xp = ?, tasks_completed = ?, level = ? WHERE user_id = ?`)
        .run(newXp, Math.max(0, progress.tasks_completed - 1), Math.floor(newXp / 100) + 1, req.user.id);
    }

    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  try {
    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, req.user.id);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
