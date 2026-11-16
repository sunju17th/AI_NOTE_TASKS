import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  CheckSquare, Plus, Filter, Sparkles, Edit2, Trash2,
  AlertCircle, Check, Loader2, Clock, Calendar, AlertTriangle
} from 'lucide-react';

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Sorting & Pagination
  const [selectedPriority, setSelectedPriority] = useState('');
  const [sortOrder, setSortOrder] = useState('deadline');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('not_urgent');
  const [aiPriority, setAiPriority] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Assessment state inside Modal
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [aiError, setAiError] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 12,
        sort: sortOrder,
        ...(selectedPriority ? { priority: selectedPriority } : {}),
      };
      const res = await api.getTasks(params);
      setTasks(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, selectedPriority, sortOrder]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    // Default deadline: tomorrow at 17:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    setDeadline(tomorrow.toISOString().slice(0, 16));
    setPriority('not_urgent');
    setAiPriority('');
    setAiAssessment(null);
    setAiError('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setDeadline(new Date(task.deadline).toISOString().slice(0, 16));
    setPriority(task.priority || 'not_urgent');
    setAiPriority(task.aiPriority || '');
    setAiAssessment(null);
    setAiError('');
    setFormError('');
    setIsModalOpen(true);
  };

  // AI Task Assessment
  const handleAskAI = async () => {
    if (!title.trim()) {
      setAiError('Vui lòng nhập tiêu đề nhiệm vụ trước khi hỏi AI!');
      return;
    }
    if (!deadline) {
      setAiError('Vui lòng chọn hạn chót (deadline) để AI và Rule Engine đánh giá thời gian!');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiAssessment(null);

    try {
      const result = await api.assessTask({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
      });
      setAiAssessment(result);
      if (result.priority) {
        setPriority(result.priority);
        setAiPriority(result.priority);
      }
    } catch (err) {
      setAiError(err.message || 'Dịch vụ AI đang bận. Bạn có thể tự chọn mức độ ưu tiên.');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit Save Task
  const handleSaveTask = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        title,
        description: description || null,
        deadline: new Date(deadline).toISOString(),
        priority,
        ai_priority: aiPriority || null,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, payload);
      } else {
        await api.createTask(payload);
      }

      setIsModalOpen(false);
      await fetchTasks();
    } catch (err) {
      setFormError(err.message || 'Thao tác không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id, taskTitle) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhiệm vụ "${taskTitle}"?`)) {
      return;
    }
    try {
      await api.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      alert(err.message || 'Không thể xóa nhiệm vụ');
    }
  };

  // Helper tính thời gian còn lại
  const getTimeRemaining = (deadlineStr) => {
    const diff = new Date(deadlineStr).getTime() - Date.now();
    const hours = Math.round(diff / (1000 * 60 * 60));
    if (diff < 0) {
      return { text: 'Đã quá hạn!', isOverdue: true };
    }
    if (hours < 1) {
      return { text: 'Còn dưới 1 giờ!', isNear: true };
    }
    if (hours < 24) {
      return { text: `Còn khoảng ${hours} giờ`, isNear: true };
    }
    const days = Math.round(hours / 24);
    return { text: `Còn khoảng ${days} ngày`, isNear: false };
  };

  const priorityMeta = {
    critical: { label: 'Khẩn cấp', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
    urgent: { label: 'Gấp', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    not_urgent: { label: 'Không gấp', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-600" />
              <span>Nhiệm vụ & Deadline</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý công việc thông minh với sự trợ giúp của Luật cứng (Rule Engine) và Gemini AI.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhiệm vụ mới</span>
          </button>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Priority filter buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: '', label: 'Tất cả' },
              { id: 'critical', label: '🔥 Khẩn cấp' },
              { id: 'urgent', label: '⚡ Gấp' },
              { id: 'not_urgent', label: '🍃 Không gấp' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPriority(p.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedPriority === p.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Sort order select */}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
            <span>Sắp xếp deadline:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="deadline">Gần nhất trước (Tăng dần)</option>
              <option value="-deadline">Xa nhất trước (Giảm dần)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm font-medium">Đang tải danh sách nhiệm vụ...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Không có nhiệm vụ nào</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Hãy thêm nhiệm vụ đầu tiên và để AI đánh giá mức độ khẩn cấp tự động!
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhiệm vụ ngay</span>
          </button>
        </div>
      ) : (
        /* Tasks List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const meta = priorityMeta[task.priority] || priorityMeta.not_urgent;
            const remaining = getTimeRemaining(task.deadline);
            return (
              <div
                key={task.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    {/* Priority Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bg}`}>
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        <span>{meta.label}</span>
                      </span>

                      {task.aiPriority && (
                        <span
                          title={`AI ban đầu đánh giá: ${task.aiPriority}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>AI: {task.aiPriority}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(task)}
                        title="Sửa nhiệm vụ"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        title="Xóa nhiệm vụ"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-line line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Task Deadline Info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Hạn: {new Date(task.deadline).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</span>
                  </div>

                  <span className={`font-semibold flex items-center gap-1 ${
                    remaining.isOverdue
                      ? 'text-rose-600'
                      : remaining.isNear
                      ? 'text-amber-600'
                      : 'text-slate-500'
                  }`}>
                    {remaining.isOverdue ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{remaining.text}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Thêm / Sửa Nhiệm Vụ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span>{editingTask ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tiêu đề nhiệm vụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Nộp báo cáo tốt nghiệp, Trả tiền điện..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Thêm mô tả về tài liệu, quy cách gửi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hạn chót hoàn thành (Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Nút Gọi AI Đánh giá mức độ */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAskAI}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{aiLoading ? 'AI đang phân tích hạn chót & nội dung...' : '✨ Nhờ AI & Rule Engine đánh giá mức độ gấp'}</span>
                </button>
              </div>

              {/* Hộp hiển thị kết quả AI đánh giá */}
              {aiError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiAssessment && (
                <div className="p-3 rounded-xl bg-violet-50 border border-indigo-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Kết quả đánh giá:</span>
                    </span>
                    <span className="font-bold uppercase text-indigo-700">
                      {aiAssessment.priority}
                    </span>
                  </div>
                  <p className="text-slate-700">
                    💡 {aiAssessment.reason}
                  </p>
                </div>
              )}

              {/* Lựa chọn Priority (Radio options) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Mức độ ưu tiên (Bạn có quyền quyết định)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'not_urgent', label: 'Không gấp', color: 'border-slate-300 peer-checked:border-slate-700 peer-checked:bg-slate-50' },
                    { id: 'urgent', label: 'Gấp', color: 'border-amber-300 peer-checked:border-amber-600 peer-checked:bg-amber-50' },
                    { id: 'critical', label: 'Khẩn cấp', color: 'border-rose-300 peer-checked:border-rose-600 peer-checked:bg-rose-50' },
                  ].map((item) => (
                    <label key={item.id} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={item.id}
                        checked={priority === item.id}
                        onChange={(e) => setPriority(e.target.value)}
                        className="peer sr-only"
                      />
                      <div className={`p-2.5 text-center text-xs font-semibold rounded-lg border-2 transition-all ${item.color}`}>
                        {item.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingTask ? 'Cập nhật nhiệm vụ' : 'Lưu nhiệm vụ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
