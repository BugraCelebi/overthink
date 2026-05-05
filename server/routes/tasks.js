const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_STATUSES = ['doing', 'brewing', 'on_hold', 'done'];

// GET /api/tasks
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks ORDER BY created_at DESC
    `).all();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, priority = 'normal', status = 'doing', due_date } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!['low', 'normal', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, priority, status, completed, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title.trim(), description || null, priority, status, status === 'done' ? 1 : 0, due_date || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const updatedTitle       = title       !== undefined ? title.trim()  : task.title;
  const updatedDescription = description !== undefined ? description   : task.description;
  const updatedPriority    = priority    !== undefined ? priority      : task.priority;
  const updatedStatus      = status      !== undefined ? status        : task.status;
  const updatedDueDate     = due_date    !== undefined ? (due_date || null) : task.due_date;

  if (!VALID_STATUSES.includes(updatedStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const wasCompleted  = task.completed === 1;
  const isNowDone     = updatedStatus === 'done';
  const updatedCompleted = isNowDone ? 1 : 0;

  let completedAt = task.completed_at;
  if (!wasCompleted && isNowDone) {
    completedAt = new Date().toISOString();
  } else if (wasCompleted && !isNowDone) {
    completedAt = null;
  }

  try {
    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, priority = ?, status = ?, completed = ?, completed_at = ?, due_date = ?
      WHERE id = ?
    `).run(updatedTitle, updatedDescription, updatedPriority, updatedStatus, updatedCompleted, completedAt, updatedDueDate, id);

    // Award XP on completion
    if (!wasCompleted && isNowDone) {
      const progress = db.prepare('SELECT * FROM user_progress WHERE id = 1').get();
      const newXp        = progress.total_xp + task.xp_value;
      const newCompleted = progress.tasks_completed + 1;
      const newLevel     = Math.floor(newXp / 100) + 1;
      db.prepare(`
        UPDATE user_progress SET total_xp = ?, tasks_completed = ?, level = ? WHERE id = 1
      `).run(newXp, newCompleted, newLevel);
    }

    // Revoke XP on un-completion
    if (wasCompleted && !isNowDone) {
      const progress = db.prepare('SELECT * FROM user_progress WHERE id = 1').get();
      const newXp        = Math.max(0, progress.total_xp - task.xp_value);
      const newCompleted = Math.max(0, progress.tasks_completed - 1);
      const newLevel     = Math.floor(newXp / 100) + 1;
      db.prepare(`
        UPDATE user_progress SET total_xp = ?, tasks_completed = ?, level = ? WHERE id = 1
      `).run(newXp, newCompleted, newLevel);
    }

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true, id: Number(id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
