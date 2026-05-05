import { useState, useMemo } from 'react';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const STATUS_COLORS = {
  doing:   'var(--color-status-doing)',
  brewing: 'var(--color-status-brewing)',
  on_hold: 'var(--color-status-on_hold)',
  done:    'var(--color-status-done)',
};

function pad(n) { return String(n).padStart(2, '0'); }

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getTodayStr() { return toDateStr(new Date()); }

// Returns the Monday of the week containing `date`
function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - dow);
  return d;
}

// Format week range header: "Apr 7 – 13, 2026" or "Mar 31 – Apr 6, 2026"
function formatWeekRange(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const sy = weekStart.getFullYear(), sm = weekStart.getMonth();
  const ey = weekEnd.getFullYear(),   em = weekEnd.getMonth();

  if (sm === em && sy === ey) {
    return `${MONTH_SHORT[sm]} ${weekStart.getDate()} – ${weekEnd.getDate()}, ${sy}`;
  }
  if (sy === ey) {
    return `${MONTH_SHORT[sm]} ${weekStart.getDate()} – ${MONTH_SHORT[em]} ${weekEnd.getDate()}, ${sy}`;
  }
  return `${MONTH_SHORT[sm]} ${weekStart.getDate()}, ${sy} – ${MONTH_SHORT[em]} ${weekEnd.getDate()}, ${ey}`;
}

function NavButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'pointer',
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
    >
      {children}
    </button>
  );
}

export default function CalendarView({ tasks }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const todayStr = getTodayStr();

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  // 7 day objects for this week
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  // Tasks grouped by due_date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.due_date) {
        if (!map[t.due_date]) map[t.due_date] = [];
        map[t.due_date].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Total tasks this week (for subtitle)
  const weekTaskCount = useMemo(() =>
    days.reduce((sum, d) => sum + (tasksByDate[toDateStr(d)]?.length ?? 0), 0),
    [days, tasksByDate]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <NavButton onClick={prevWeek}>‹</NavButton>

        <div style={{ flex: 1 }}>
          <span style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
          }}>
            {formatWeekRange(weekStart)}
          </span>
          {weekTaskCount > 0 && (
            <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
              {weekTaskCount} task{weekTaskCount !== 1 ? 's' : ''} this week
            </span>
          )}
        </div>

        <button
          onClick={goToday}
          style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
        >
          Today
        </button>

        <NavButton onClick={nextWeek}>›</NavButton>
      </div>

      {/* Week grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          minHeight: 420,
        }}
      >
        {days.map((day, i) => {
          const dateStr  = toDateStr(day);
          const isToday  = dateStr === todayStr;
          const isPast   = dateStr < todayStr;
          const isLast   = i === 6;
          const dayTasks = tasksByDate[dateStr] || [];
          const hasOverdue = isPast && dayTasks.some(t => t.status !== 'done');

          return (
            <div
              key={dateStr}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRight: !isLast ? '1px solid var(--color-border)' : 'none',
                backgroundColor: isToday ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
              }}
            >
              {/* Day header */}
              <div
                style={{
                  padding: '10px 10px 8px',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: isToday ? 'var(--color-primary-subtle)' : 'var(--color-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {DAY_NAMES[i]}
                </span>
                <span style={{
                  width: 26, height: 26,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isToday ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                  backgroundColor: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday
                    ? '#fff'
                    : hasOverdue
                    ? 'var(--color-high)'
                    : isPast
                    ? 'var(--color-text-disabled)'
                    : 'var(--color-text-primary)',
                }}>
                  {day.getDate()}
                </span>
              </div>

              {/* Tasks */}
              <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto' }}>
                {dayTasks.length === 0 ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-disabled)',
                    fontSize: '11px',
                  }} />
                ) : (
                  dayTasks.map(t => (
                    <div
                      key={t.id}
                      title={t.title}
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.4',
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: STATUS_COLORS[t.status] + '1A',
                        color: STATUS_COLORS[t.status],
                        borderLeft: `2px solid ${STATUS_COLORS[t.status]}`,
                        wordBreak: 'break-word',
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                        opacity: t.status === 'done' ? 0.55 : 1,
                        flexShrink: 0,
                      }}
                    >
                      {t.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
