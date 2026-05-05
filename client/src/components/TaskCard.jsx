import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';

function formatDueDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function isOverdue(str, isDone) {
  if (!str || isDone) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d) < today;
}

// Pure display card — used both in column and in DragOverlay
export function TaskCardDisplay({ task, onDelete, onUpdate, isDragging = false, isOverlay = false }) {
  const [hovered, setHovered] = useState(false);
  const dateInputRef = useRef(null);
  const isDone = task.status === 'done';
  const overdue = isOverdue(task.due_date, isDone);

  const handleDateClick = (e) => {
    e.stopPropagation();
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  const handleDateChange = (e) => {
    onUpdate && onUpdate(task.id, { due_date: e.target.value || null });
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${hovered && !isOverlay ? 'var(--color-border-hover)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
        cursor: isDragging ? 'grabbing' : isOverlay ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.35 : 1,
        boxShadow: isOverlay
          ? '0 8px 24px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08)'
          : hovered && !isDragging
          ? '0 1px 4px rgba(0,0,0,0.06)'
          : 'none',
        transform: isOverlay ? 'rotate(1.5deg)' : 'none',
        transition: isDragging || isOverlay
          ? 'none'
          : 'border-color var(--transition-base), box-shadow var(--transition-base)',
        userSelect: 'none',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-sm)',
            lineHeight: 'var(--line-height-normal)',
            color: isDone ? 'var(--color-text-disabled)' : 'var(--color-text-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
            textDecorationColor: 'var(--color-text-muted)',
            wordBreak: 'break-word',
          }}
        >
          {task.title}
        </span>

        {/* Delete — hover only */}
        {!isOverlay && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            aria-label="Delete task"
            style={{
              flexShrink: 0,
              width: 20,
              height: 20,
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
              e.currentTarget.style.backgroundColor = 'var(--color-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer: date + drag handle */}
      {!isOverlay && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: (task.due_date || hovered) ? 8 : 0,
            height: (task.due_date || hovered) ? 'auto' : 0,
            overflow: 'hidden',
          }}
        >
          {/* Date badge — stop pointer events to prevent drag */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <button
              onClick={handleDateClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '11px',
                color: overdue
                  ? 'var(--color-high)'
                  : task.due_date
                  ? 'var(--color-text-secondary)'
                  : 'var(--color-text-disabled)',
                opacity: task.due_date ? 1 : hovered ? 0.7 : 0,
                transition: 'opacity var(--transition-base)',
                borderRadius: 'var(--radius-sm)',
                padding: '1px 4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Calendar icon */}
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2" />
                <path d="M4 1v2M8 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {task.due_date ? formatDueDate(task.due_date) : 'Add date'}
            </button>

            {/* Clear date button */}
            {task.due_date && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate && onUpdate(task.id, { due_date: null });
                }}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-disabled)',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity var(--transition-base)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-high)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-disabled)'; }}
                aria-label="Clear date"
              >
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}

            {/* Hidden native date picker */}
            <input
              ref={dateInputRef}
              type="date"
              value={task.due_date || ''}
              onChange={handleDateChange}
              onPointerDown={(e) => e.stopPropagation()}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
              tabIndex={-1}
            />
          </div>

          {/* Drag handle hint */}
          {hovered && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--color-border-hover)', flexShrink: 0 }}>
              <circle cx="2.5" cy="2.5" r="1" fill="currentColor" />
              <circle cx="7.5" cy="2.5" r="1" fill="currentColor" />
              <circle cx="2.5" cy="7.5" r="1" fill="currentColor" />
              <circle cx="7.5" cy="7.5" r="1" fill="currentColor" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

// Draggable wrapper
export default function TaskCard({ task, onDelete, onUpdate }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { task },
  });

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ outline: 'none' }}>
      <TaskCardDisplay task={task} onDelete={onDelete} onUpdate={onUpdate} isDragging={isDragging} />
    </div>
  );
}
