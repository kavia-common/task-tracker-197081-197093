import React, { useMemo, useState } from 'react';

// PUBLIC_INTERFACE
export default function TaskInput({ onAdd, disabled }) {
  /** Controlled input for creating new tasks. */
  const [value, setValue] = useState('');

  const canSubmit = useMemo(() => {
    return !disabled && value.trim().length > 0;
  }, [disabled, value]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd(value.trim());
    setValue('');
  };

  return (
    <form className="tt-task-input" onSubmit={onSubmit} aria-label="Add task">
      <div className="tt-task-input__row">
        <input
          className="tt-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you need to do?"
          disabled={disabled}
          aria-label="Task title"
        />
        <button className="tt-btn tt-btn--primary" type="submit" disabled={!canSubmit}>
          Add
        </button>
      </div>
    </form>
  );
}
