import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import Header from './components/Header';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import { clearCompleted, createTask, deleteTask, listTasks, updateTask } from './api/todoApi';

function normalizeTaskFromApi(task) {
  // Backend field names may differ; we normalize for UI usage.
  const completed = Boolean(task.completed ?? task.is_completed ?? task.isCompleted ?? false);
  const title = task.title ?? task.description ?? '';
  return { ...task, completed, title };
}

function buildCreatePayload(title) {
  // Backend contract (FastAPI): TaskCreate { title: str, completed: bool }
  return { title };
}

function buildUpdatePayload({ title, completed }) {
  // Backend contract (FastAPI): TaskUpdate { title?: str, completed?: bool }
  return { title, completed };
}

// PUBLIC_INTERFACE
function App() {
  /** Main to-do application UI: add/edit/delete/complete + clear completed. */
  const [tasks, setTasks] = useState([]);
  const [busyTaskIds, setBusyTaskIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const totalCount = tasks.length;

  const setBusy = (taskId, isBusy) => {
    setBusyTaskIds((prev) => {
      const next = new Set(prev);
      if (isBusy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  const refreshTasks = async () => {
    setError('');
    try {
      const data = await listTasks();
      const normalized = Array.isArray(data) ? data.map(normalizeTaskFromApi) : [];
      setTasks(normalized);
    } catch (e) {
      setError(e?.message || 'Failed to load tasks.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      await refreshTasks();
      if (!cancelled) setLoading(false);
    }

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async (title) => {
    setError('');
    try {
      const created = await createTask(buildCreatePayload(title));
      const normalized = normalizeTaskFromApi(created);
      setTasks((prev) => [normalized, ...prev]);
    } catch (e) {
      setError(e?.message || 'Failed to create task.');
    }
  };

  const onToggleComplete = async (task) => {
    setError('');
    setBusy(task.id, true);
    try {
      const nextCompleted = !Boolean(task.completed);
      const updated = await updateTask(task.id, buildUpdatePayload({ title: task.title, completed: nextCompleted }));
      const normalized = normalizeTaskFromApi(updated);

      setTasks((prev) => prev.map((t) => (t.id === task.id ? normalized : t)));
    } catch (e) {
      setError(e?.message || 'Failed to update task.');
    } finally {
      setBusy(task.id, false);
    }
  };

  const onDelete = async (task) => {
    setError('');
    setBusy(task.id, true);
    try {
      await deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      setError(e?.message || 'Failed to delete task.');
    } finally {
      setBusy(task.id, false);
    }
  };

  const onEdit = async (task, nextTitle) => {
    setError('');
    setBusy(task.id, true);
    try {
      const updated = await updateTask(task.id, buildUpdatePayload({ title: nextTitle, completed: task.completed }));
      const normalized = normalizeTaskFromApi(updated);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? normalized : t)));
    } catch (e) {
      setError(e?.message || 'Failed to edit task.');
    } finally {
      setBusy(task.id, false);
    }
  };

  const onClearCompleted = async () => {
    setError('');
    // Optimistically disable the button while we clear.
    const completed = tasks.filter((t) => t.completed);

    if (completed.length === 0) return;

    try {
      // Prefer backend batch route if available; fall back to per-task delete.
      await clearCompleted();
      setTasks((prev) => prev.filter((t) => !t.completed));
    } catch {
      try {
        await Promise.all(completed.map((t) => deleteTask(t.id)));
        setTasks((prev) => prev.filter((t) => !t.completed));
      } catch (e2) {
        setError(e2?.message || 'Failed to clear completed tasks.');
      }
    }
  };

  return (
    <div className="App">
      <Header />

      <main className="tt-main">
        <section className="tt-card" aria-label="Task input section">
          <TaskInput onAdd={onAdd} disabled={loading} />

          <div className="tt-meta" aria-label="Task counts">
            <div className="tt-meta__pill">
              <span className="tt-meta__label">Total</span>
              <span className="tt-meta__value">{totalCount}</span>
            </div>
            <div className="tt-meta__pill">
              <span className="tt-meta__label">Completed</span>
              <span className="tt-meta__value">{completedCount}</span>
            </div>
          </div>

          {error ? (
            <div className="tt-alert" role="alert">
              <div className="tt-alert__title">Something went wrong</div>
              <div className="tt-alert__message">{error}</div>
              <button className="tt-btn tt-btn--ghost tt-btn--small" onClick={refreshTasks} type="button">
                Retry
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="tt-loading" role="status" aria-live="polite">
              Loading tasks…
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onEdit={onEdit}
              busyTaskIds={busyTaskIds}
            />
          )}

          <div className="tt-footer">
            <button
              className="tt-btn tt-btn--secondary"
              onClick={onClearCompleted}
              type="button"
              disabled={loading || completedCount === 0}
            >
              Clear Completed
            </button>
          </div>
        </section>

        <section className="tt-help" aria-label="API info">
          <div className="tt-help__title">Backend</div>
          <div className="tt-help__body">
            This UI calls the API at <code>http://localhost:3001</code>.
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
