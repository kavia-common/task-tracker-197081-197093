const DEFAULT_BASE_URL = 'http://localhost:3001';

/**
 * Get the API base URL for all frontend requests.
 *
 * Priority:
 *  1) REACT_APP_API_BASE (recommended)
 *  2) REACT_APP_BACKEND_URL (legacy/alternate)
 *  3) DEFAULT_BASE_URL (http://localhost:3001)
 */
function getApiBaseUrl() {
  const envBase = process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL;
  if (!envBase) return DEFAULT_BASE_URL;
  // Prevent accidental trailing slash causing double slashes in URLs.
  return String(envBase).replace(/\/+$/, '');
}

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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
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
  /** Create a task. payload: { title: string } (backend contract). */
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
  /** Clear completed tasks via backend batch route. */
  return request('/tasks/clear-completed', { method: 'POST' });
}
