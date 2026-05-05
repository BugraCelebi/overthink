import { useState, useRef, useEffect } from 'react';

const STATUS_CONFIG = {
  doing:   { label: 'Doing',   color: 'var(--color-status-doing)'   },
  brewing: { label: 'Brewing', color: 'var(--color-status-brewing)' },
  on_hold: { label: 'On Hold', color: 'var(--color-status-on_hold)' },
  done:    { label: 'Done',    color: 'var(--color-status-done)'    },
};

const STATUS_ORDER = ['doing', 'brewing', 'on_hold', 'done'];

export default function TaskItem({ task, onUpdate, onDelete }) {
  const [hovered, setHovered]       = useState(false);
  const [checking, setChecking]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const menuRef                     = useRef(null);

  const isDone = task.status === 'done';

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleToggleDone = async () => {
    if (checking) return;
    setChecking(true);
    const nextStatus = isDone ? 'doing' : 'done';
    await onUpdate(task.id, { status: nextStatus });
    setTimeout(() => setChecking(false), 300);
  };

  const handleStatusChange = (newStatus) => {
    setMenuOpen(false);
    if (newStatus !== task.status) {
      onUpdate(task.id, { status: newStatus });
    }
  };

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.doing;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: hovered && !isDone ? 'var(--color-surface)' : 'transparent',
        border: `1px solid ${hovered ? 'var(--color-border)' : 'transparent'}`,
        transition: 'background-color var(--transition-base), border-color var(--transition-base)',
        cursor: 'default',
        marginLeft: 'calc(-1 * var(--space-4))',
        marginRight: 'calc(-1 * var(--space-4))',
        position: 'relative',
      }}
    >
      {/* Circular checkbox */}
      <button
        onClick={handleToggleDone}
        aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: `2px solid ${
            isDone ? 'var(--color-status-done)'
              : hovered ? 'var(--color-border-hover)'
              : 'var(--color-border)'
          }`,
          backgroundColor: isDone ? 'var(--color-status-done)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: [
            'border-color var(--transition-base)',
            'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            'transform var(--transition-fast)',
          ].join(', '),
          transform: checking ? 'scale(0.88)' : 'scale(1)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isDone) {
            e.currentTarget.style.borderColor = 'var(--color-status-done)';
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-status-done) 12%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDone) {
            e.currentTarget.style.borderColor = hovered ? 'var(--color-border-hover)' : 'var(--color-border)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Task title */}
      <span
        style={{
          flex: 1,
          fontSize: 'var(--font-size-base)',
          color: isDone ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
          textDecorationColor: 'var(--color-text-muted)',
          transition: 'color var(--transition-base)',
          lineHeight: 'var(--line-height-normal)',
          userSelect: 'none',
        }}
      >
        {task.title}
      </span>

      {/* Status badge + dropdown */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Change status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
            backgroundColor: menuOpen ? 'var(--color-surface)' : 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            opacity: hovered || menuOpen ? 1 : 0,
            transition: 'opacity var(--transition-base), background-color var(--transition-fast), border-color var(--transition-fast)',
            pointerEvents: hovered || menuOpen ? 'auto' : 'none',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-hover)';
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          }}
          onMouseLeave={(e) => {
            if (!menuOpen) {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: statusCfg.color,
              flexShrink: 0,
            }}
          />
          {statusCfg.label}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              zIndex: 100,
              minWidth: 120,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            {STATUS_ORDER.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = s === task.status;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: cfg.color,
                      flexShrink: 0,
                    }}
                  />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity var(--transition-base), color var(--transition-fast), background-color var(--transition-fast)',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-high)';
          e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--color-high) 10%, transparent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-muted)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
