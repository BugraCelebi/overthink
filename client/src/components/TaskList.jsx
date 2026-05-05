import { useState } from 'react';
import TaskItem from './TaskItem';

const STATUS_SECTIONS = [
  {
    key: 'doing',
    label: 'Doing',
    color: 'var(--color-status-doing)',
    emptyText: 'Nothing active right now.',
  },
  {
    key: 'brewing',
    label: 'Brewing',
    color: 'var(--color-status-brewing)',
    emptyText: null,
  },
  {
    key: 'on_hold',
    label: 'On Hold',
    color: 'var(--color-status-on_hold)',
    emptyText: null,
  },
  {
    key: 'done',
    label: 'Done',
    color: 'var(--color-status-done)',
    emptyText: null,
    defaultCollapsed: true,
  },
];

function SectionHeader({ section, count, open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        width: '100%',
        textAlign: 'left',
        paddingBottom: 'var(--space-3)',
        borderBottom: open ? '1px solid var(--color-border)' : '1px solid transparent',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'border-color var(--transition-base)',
      }}
    >
      {/* Colored dot */}
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: section.color,
          flexShrink: 0,
          opacity: 0.85,
        }}
      />

      {/* Label */}
      <span
        style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {section.label}
      </span>

      {/* Count badge */}
      {count > 0 && (
        <span
          style={{
            backgroundColor: 'var(--color-border)',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {count}
        </span>
      )}

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Chevron */}
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform var(--transition-base)',
          color: 'var(--color-text-disabled)',
          flexShrink: 0,
        }}
      >
        <path
          d="M4 2L8 6L4 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function TaskList({ tasks, onUpdate, onDelete }) {
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(STATUS_SECTIONS.map((s) => [s.key, s.defaultCollapsed ?? false]))
  );

  const toggle = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalCount = tasks.length;

  if (totalCount === 0) {
    return (
      <div style={{ marginTop: 'var(--space-16)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-base)' }}>
          Nothing here yet.
        </p>
        <p style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)' }}>
          Add a task above to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      {STATUS_SECTIONS.map((section) => {
        const sectionTasks = tasks.filter((t) => t.status === section.key);
        if (sectionTasks.length === 0 && section.key !== 'doing') return null;

        const isOpen = !collapsed[section.key];

        return (
          <section key={section.key}>
            <SectionHeader
              section={section}
              count={sectionTasks.length}
              open={isOpen}
              onToggle={() => toggle(section.key)}
            />

            {isOpen && (
              <div style={{ paddingTop: 'var(--space-1)' }}>
                {sectionTasks.length === 0 ? (
                  <p
                    style={{
                      padding: 'var(--space-5) 0',
                      color: 'var(--color-text-disabled)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {section.emptyText}
                  </p>
                ) : (
                  sectionTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
