import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import TaskCard, { TaskCardDisplay } from './TaskCard';

const COLUMNS = [
  {
    key: 'doing',
    label: 'Doing',
    color: 'var(--color-status-doing)',
    empty: 'Nothing active.',
  },
  {
    key: 'brewing',
    label: 'Brewing',
    color: 'var(--color-status-brewing)',
    empty: 'Nothing brewing.',
  },
  {
    key: 'on_hold',
    label: 'On Hold',
    color: 'var(--color-status-on_hold)',
    empty: 'Nothing on hold.',
  },
  {
    key: 'done',
    label: 'Done',
    color: 'var(--color-status-done)',
    empty: 'Nothing done yet.',
  },
];

function Column({ col, tasks, onDelete, onUpdate, isOver, isDraggingAny }) {
  const { setNodeRef } = useDroppable({ id: col.key });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minWidth: 210,
        maxWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver
          ? 'var(--color-primary-subtle)'
          : 'var(--color-border)',
        border: `1px solid ${isOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        transition: 'background-color var(--transition-base), border-color var(--transition-base)',
        minHeight: 320,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: col.color,
            flexShrink: 0,
            opacity: 0.9,
          }}
        />
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flex: 1,
          }}
        >
          {col.label}
        </span>
        {tasks.length > 0 && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              fontWeight: 'var(--font-weight-medium)',
              backgroundColor: 'var(--color-border)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {tasks.length}
          </span>
        )}
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: 10,
          overflowY: 'auto',
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-disabled)',
              fontSize: 'var(--font-size-xs)',
              padding: '24px 8px',
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: isDraggingAny ? `1.5px dashed ${isOver ? col.color : 'var(--color-border-hover)'}` : '1.5px dashed transparent',
              transition: 'border-color var(--transition-base)',
            }}
          >
            {isDraggingAny ? 'Drop here' : col.empty}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDelete} onUpdate={onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onUpdate, onDelete }) {
  const [activeTask, setActiveTask] = useState(null);
  const [overId, setOverId]         = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = ({ active }) => {
    setActiveTask(active.data.current.task);
  };

  const handleDragOver = ({ over }) => {
    setOverId(over?.id ?? null);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    setOverId(null);
    if (!over) return;
    const taskId    = Number(active.id);
    const newStatus = String(over.id);
    const task      = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onUpdate(taskId, { status: newStatus });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverId(null);
  };

  const isDraggingAny = activeTask !== null;

  if (tasks.length === 0) {
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 'var(--space-4)',
          /* Nice scrollbar on Windows */
          scrollbarWidth: 'thin',
        }}
      >
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            col={col}
            tasks={tasks.filter((t) => (t.status || 'doing') === col.key)}
            onDelete={onDelete}
            onUpdate={onUpdate}
            isOver={overId === col.key}
            isDraggingAny={isDraggingAny}
          />
        ))}
      </div>

      {/* Ghost card that follows the cursor */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCardDisplay task={activeTask} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
