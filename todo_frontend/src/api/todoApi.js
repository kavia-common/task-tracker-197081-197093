const DEFAULT_BASE_URL = 'http://localhost:3001';

/**
 * Ensures we surface useful error messages from the backend (FastAPI).
 */
async function parseErrorResponse(response) {
  let detail = `Request failed with status ${response.status}`;
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') detail = data.detail;
    else if (data?.detail) detail = JSON.stringify(data.detail);
  } catch {
    // ignore JSON parsing failures, keep generic message
  }
  return new Error(detail);
}

async function request(path, options = {}) {
  const response = await fetch(`${DEFAULT_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

// PUBLIC_INTERFACE
export async function listTasks() {
  /** Fetch all tasks. Returns an array of task objects. */
  return request('/tasks', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function createTask(payload) {
  /** Create a task. payload: { title: string } or { description: string } depending on backend. */
  return request('/tasks', { method: 'POST', body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function updateTask(taskId, payload) {
  /** Update a task by id. payload: partial task fields to update. */
  return request(`/tasks/${encodeURIComponent(taskId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

// PUBLIC_INTERFACE
export async function deleteTask(taskId) {
  /** Delete a task by id. */
  return request(`/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' });
}

// PUBLIC_INTERFACE
export async function clearCompleted() {
  /** Clear completed tasks. If backend doesn't support this route, caller can fallback to per-task deletes. */
  return request('/tasks/clear-completed', { method: 'POST' });
}
