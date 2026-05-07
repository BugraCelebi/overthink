import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import AddTask from './components/AddTask';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import LoginPage from './components/LoginPage';
import { apiFetch } from './api';

export default function App() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [theme, setTheme]       = useState(() => localStorage.getItem('theme') || 'light');
  const [view, setView]         = useState('board');
  const [username, setUsername] = useState(() => localStorage.getItem('username'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiFetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      setTasks(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (username) fetchTasks();
  }, [username, fetchTasks]);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUsername(null);
    setTasks([]);
  }

  const addTask = useCallback(async (title) => {
    if (!title.trim()) return;
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const updateTask = useCallback(async (id, changes) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));
    try {
      const res = await apiFetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error('Failed to update task');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err.message);
      fetchTasks();
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
    } catch (err) {
      setError(err.message);
      fetchTasks();
    }
  }, [fetchTasks]);

  if (!username) {
    return <LoginPage onAuth={setUsername} />;
  }

  const activeCount = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div style={{ maxWidth: 'var(--content-width)', margin: '0 auto', padding: '0 var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)' }}>
          <Header
            activeCount={activeCount}
            theme={theme}
            onToggleTheme={toggleTheme}
            username={username}
            onLogout={handleLogout}
          />
          <div style={{ maxWidth: 560, paddingBottom: 'var(--space-5)' }}>
            <AddTask onAdd={addTask} />
          </div>
        </div>

        <main style={{ paddingBottom: 'var(--space-16)', paddingTop: 'var(--space-4)' }}>
          {error && (
            <div style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              border: '1px solid #FCA5A5',
              borderRadius: 'var(--radius-md)',
              backgroundColor: theme === 'dark' ? '#2D1515' : '#FEF2F2',
              color: theme === 'dark' ? '#FCA5A5' : '#B91C1C',
              fontSize: 'var(--font-size-sm)',
              maxWidth: 560,
            }}>
              {error}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--font-size-sm)', textDecoration: 'underline', color: 'inherit' }}
              >
                Dismiss
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-5)' }}>
            {[{ key: 'board', label: 'Board' }, { key: 'calendar', label: 'Calendar' }].map(({ key, label }) => {
              const active = view === key;
              return (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
                    border: active ? '1px solid var(--color-primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ marginTop: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              Loading...
            </div>
          ) : view === 'calendar' ? (
            <CalendarView tasks={tasks} onUpdate={updateTask} />
          ) : (
            <KanbanBoard tasks={tasks} onUpdate={updateTask} onDelete={deleteTask} />
          )}
        </main>
      </div>
    </div>
  );
}
