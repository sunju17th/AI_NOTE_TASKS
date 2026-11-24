const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Helper gọi API Backend chuẩn hóa
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Nếu trả về 204 No Content
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Nếu token hết hạn hoặc không hợp lệ -> đăng xuất
    if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const errorMessage = data?.error?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại!';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiFetch('/auth/me'),

  // Categories
  getCategories: () => apiFetch('/categories'),
  createCategory: (body) => apiFetch('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),

  // Notes
  getNotes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.q) query.append('q', params.q);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return apiFetch(`/notes${queryString ? `?${queryString}` : ''}`);
  },
  getNote: (id) => apiFetch(`/notes/${id}`),
  createNote: (body) => apiFetch('/notes', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id, body) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNote: (id) => apiFetch(`/notes/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams();
    if (params.priority) query.append('priority', params.priority);
    if (params.sort) query.append('sort', params.sort);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return apiFetch(`/tasks${queryString ? `?${queryString}` : ''}`);
  },
  getTask: (id) => apiFetch(`/tasks/${id}`),
  createTask: (body) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id, body) => apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),

  // AI
  classifyNote: (body) => apiFetch('/ai/classify-note', { method: 'POST', body: JSON.stringify(body) }),
  assessTask: (body) => apiFetch('/ai/assess-task', { method: 'POST', body: JSON.stringify(body) }),
};
