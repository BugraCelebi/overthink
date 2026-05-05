import { useState, useRef } from 'react';

export default function AddTask({ onAdd }) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setValue('');
      inputRef.current?.blur();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-1)',
        border: `1px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-surface)',
        marginBottom: 0,
        transition: 'border-color var(--transition-base)',
      }}
    >
      {/* Plus icon button */}
      <button
        onClick={() => {
          if (value.trim()) {
            handleSubmit();
          } else {
            inputRef.current?.focus();
          }
        }}
        aria-label="Add task"
        style={{
          flexShrink: 0,
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          backgroundColor: value.trim()
            ? 'var(--color-primary)'
            : focused
            ? 'var(--color-primary-subtle)'
            : 'transparent',
          color: value.trim()
            ? '#fff'
            : 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 'var(--space-2)',
          transition: 'background-color var(--transition-base), color var(--transition-base)',
          fontSize: 20,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          if (!value.trim()) {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-subtle)';
            e.currentTarget.style.color = 'var(--color-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!value.trim()) {
            e.currentTarget.style.backgroundColor = focused ? 'var(--color-primary-subtle)' : 'transparent';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }
        }}
      >
        +
      </button>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Add a task..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: 'var(--font-size-base)',
          color: 'var(--color-text-primary)',
          padding: 'var(--space-3) var(--space-2)',
          lineHeight: 1.5,
        }}
      />

      {value.trim() && (
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            paddingRight: 'var(--space-4)',
            whiteSpace: 'nowrap',
          }}
        >
          ↵ to add
        </span>
      )}
    </div>
  );
}
