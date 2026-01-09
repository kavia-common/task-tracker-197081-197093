import React, { useMemo, useState } from 'react';

function getTaskTitle(task) {
  return task?.title ?? task?.description ?? '';
}

// PUBLIC_INTERFACE
export default function TaskList({ tasks, onToggleComplete, onDelete, onEdit, busyTaskIds }) {
  /** Renders task list with actions. */
  const hasTasks = tasks && tasks.length > 0;

  if (!hasTasks) {
    return (
      <div className="tt-empty" role="status" aria-live="polite">
        No tasks yet. Add one above.
      </div>
    );
  }

  return (
    <ul className="tt-list" aria-label="Task list">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          busy={busyTaskIds.has(task.id)}
        />
      ))}
    </ul>
  );
}

function TaskRow({ task, onToggleComplete, onDelete, onEdit, busy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(getTaskTitle(task));

  const isCompleted = Boolean(task.completed ?? task.is_completed ?? task.isCompleted);
  const title = useMemo(() => getTaskTitle(task), [task]);

  const startEditing = () => {
    setDraft(title);
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(title);
    setEditing(false);
  };

  const saveEditing = async () => {
    const next = draft.trim();
    if (!next) return;
    await onEdit(task, next);
    setEditing(false);
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    await saveEditing();
  };

  return (
    <li className={`tt-item ${isCompleted ? 'tt-item--completed' : ''}`}>
      <div className="tt-item__left">
        <button
          className={`tt-check ${isCompleted ? 'tt-check--on' : ''}`}
          onClick={() => onToggleComplete(task)}
          disabled={busy}
          aria-label={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
          type="button"
        >
          <span className="tt-check__dot" aria-hidden="true" />
        </button>

        {!editing ? (
          <div className="tt-item__content">
            <div className="tt-item__title" title={title}>
              {title}
            </div>
          </div>
        ) : (
          <form className="tt-item__edit" onSubmit={onEditSubmit} aria-label="Edit task">
            <input
              className="tt-input tt-input--small"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
              aria-label="Edit task title"
              autoFocus
            />
            <div className="tt-item__edit-actions">
              <button
                className="tt-btn tt-btn--primary tt-btn--small"
                type="submit"
                disabled={busy || draft.trim().length === 0}
              >
                Save
              </button>
              <button
                className="tt-btn tt-btn--ghost tt-btn--small"
                type="button"
                onClick={cancelEditing}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {!editing ? (
        <div className="tt-item__actions">
          <button className="tt-btn tt-btn--ghost tt-btn--small" onClick={startEditing} disabled={busy}>
            Edit
          </button>
          <button className="tt-btn tt-btn--danger tt-btn--small" onClick={() => onDelete(task)} disabled={busy}>
            Delete
          </button>
        </div>
      ) : null}
    </li>
  );
}
