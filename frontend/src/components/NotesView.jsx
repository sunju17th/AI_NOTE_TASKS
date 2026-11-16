import { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileText, Plus, Search, Filter, Sparkles, Edit2, Trash2,
  AlertCircle, Check, Loader2, ChevronLeft, ChevronRight,
  HelpCircle, Tag
} from 'lucide-react';

export default function NotesView() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal Note Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [aiCategoryId, setAiCategoryId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Suggestion State inside Modal
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState('');
  const [creatingAiCategory, setCreatingAiCategory] = useState(false);

  // Load categories for filter & form
  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Không thể tải categories:', err);
    }
  };

  // Load notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 12,
        ...(searchQuery ? { q: searchQuery } : {}),
        ...(selectedCategoryFilter ? { category_id: selectedCategoryFilter } : {}),
      };
      const res = await api.getNotes(params);
      setNotes(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách ghi chú');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [page, selectedCategoryFilter]);

  // Handle Search submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotes();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategoryId('');
    setAiCategoryId('');
    setAiSuggestion(null);
    setAiError('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (note) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategoryId(note.categoryId || '');
    setAiCategoryId(note.aiCategoryId || '');
    setAiSuggestion(null);
    setAiError('');
    setFormError('');
    setIsModalOpen(true);
  };

  // AI Classification Trigger
  const handleAskAI = async () => {
    if (!content.trim()) {
      setAiError('Vui lòng nhập nội dung ghi chú trước khi hỏi AI gợi ý danh mục!');
      return;
    }

    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);

    try {
      const result = await api.classifyNote({ title, content });
      setAiSuggestion(result);

      // Nếu AI tìm được danh mục khớp có sẵn
      if (result.category_id) {
        setAiCategoryId(result.category_id);
        // Tự động gán luôn vào dropdown nếu người dùng chưa chọn
        if (!categoryId) {
          setCategoryId(result.category_id);
        }
      }
    } catch (err) {
      setAiError(err.message || 'Dịch vụ AI đang bận. Bạn có thể chọn danh mục thủ công.');
    } finally {
      setAiLoading(false);
    }
  };

  // Tạo và gán nhanh danh mục mới do AI gợi ý (suggested_new_category)
  const handleCreateSuggestedCategory = async () => {
    if (!aiSuggestion?.suggested_new_category) return;
    setCreatingAiCategory(true);
    try {
      const newCat = await api.createCategory(aiSuggestion.suggested_new_category);
      // Reload danh mục
      await fetchCategories();
      // Gán category mới tạo vào form
      setCategoryId(newCat.id);
      setAiCategoryId(newCat.id);
      // Cập nhật lại state suggestion
      setAiSuggestion((prev) => ({
        ...prev,
        category_id: newCat.id,
        category_name: newCat.name,
        suggested_new_category: null,
      }));
    } catch (err) {
      alert(err.message || 'Không thể tạo danh mục mới');
    } finally {
      setCreatingAiCategory(false);
    }
  };

  // Save Note Submit
  const handleSaveNote = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingNote) {
        await api.updateNote(editingNote.id, {
          title,
          content,
          category_id: categoryId || null,
        });
      } else {
        await api.createNote({
          title,
          content,
          category_id: categoryId || null,
          ai_category_id: aiCategoryId || null,
        });
      }

      setIsModalOpen(false);
      await fetchNotes();
    } catch (err) {
      setFormError(err.message || 'Thao tác không thành công');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id, noteTitle) => {
    if (!window.confirm(`Bạn có chắc muốn xóa ghi chú "${noteTitle || 'không có tiêu đề'}"?`)) {
      return;
    }
    try {
      await api.deleteNote(id);
      await fetchNotes();
    } catch (err) {
      alert(err.message || 'Không thể xóa ghi chú');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              <span>Ghi chú Thông minh</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ghi lại ý tưởng và để AI Gemini tự động gợi ý phân loại danh mục.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Viết ghi chú mới</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="sm:col-span-8 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm trong tiêu đề hoặc nội dung..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              Tìm
            </button>
          </form>

          {/* Category Filter Dropdown */}
          <div className="sm:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-4 h-4" />
            </div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => {
                setSelectedCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">Tất cả danh mục ({pagination.total})</option>
              <option value="none">Chưa phân loại</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
          <p className="text-sm font-medium">Đang tải ghi chú...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Không tìm thấy ghi chú nào</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            {searchQuery || selectedCategoryFilter
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc danh mục.'
              : 'Hãy tạo ghi chú đầu tiên và trải nghiệm tính năng AI phân loại tự động!'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo ghi chú ngay</span>
          </button>
        </div>
      ) : (
        /* Notes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Badges: Category & AI */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  {note.category ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Tag className="w-3 h-3" />
                      <span>{note.category.name}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Chưa phân loại
                    </span>
                  )}

                  {note.aiCategory && (
                    <span
                      title={`Gợi ý gốc từ AI: ${note.aiCategory.name}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-violet-600" />
                      <span>AI: {note.aiCategory.name}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-indigo-600 transition-colors">
                  {note.title || '(Không có tiêu đề)'}
                </h3>

                {/* Content */}
                <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-4 leading-relaxed">
                  {note.content}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {new Date(note.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(note)}
                    title="Sửa ghi chú"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id, note.title)}
                    title="Xóa ghi chú"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">
            Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> (Tổng {pagination.total} ghi chú)
          </span>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">{page}</span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Tạo / Sửa Note (Human-in-the-loop AI Integration) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>{editingNote ? 'Chỉnh sửa ghi chú' : 'Viết ghi chú mới'}</span>
            </h2>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tiêu đề (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Công thức tính đạo hàm, Bất đồng bộ trong Node.js..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nội dung ghi chú <span className="text-rose-500">*</span>
                  </label>

                  {/* Nút Gọi AI Gemini Gợi ý danh mục */}
                  <button
                    type="button"
                    onClick={handleAskAI}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                  >
                    {aiLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{aiLoading ? 'Gemini đang nghĩ...' : 'Hỏi AI gợi ý danh mục'}</span>
                  </button>
                </div>

                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung ghi chú của bạn vào đây..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              {/* HỘP HIỂN THỊ KẾT QUẢ GỢI Ý CỦA AI */}
              {aiError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiSuggestion && (
                <div className="p-4 rounded-xl bg-linear-to-r from-violet-50 to-indigo-50 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Kết quả phân tích từ Gemini AI:</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-white text-indigo-700 border border-indigo-100">
                      Độ tin cậy: {aiSuggestion.confidence}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    💡 <strong>Lý do:</strong> {aiSuggestion.reason}
                  </p>

                  {/* TH1: Khớp danh mục có sẵn */}
                  {aiSuggestion.category_id && (
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span>
                        Khớp với danh mục: <strong>{aiSuggestion.category_name}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setCategoryId(aiSuggestion.category_id)}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 cursor-pointer"
                      >
                        ✓ Áp dụng danh mục này
                      </button>
                    </div>
                  )}

                  {/* TH2: Không khớp danh mục nào + Gợi ý tạo mới */}
                  {aiSuggestion.suggested_new_category && (
                    <div className="mt-2 p-3 bg-white rounded-lg border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-900">
                          Đề xuất danh mục mới: "{aiSuggestion.suggested_new_category.name}"
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {aiSuggestion.suggested_new_category.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCreateSuggestedCategory}
                        disabled={creatingAiCategory}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                      >
                        {creatingAiCategory ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>Tạo & Gán luôn</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lựa chọn danh mục cuối cùng (Human Confirmation) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Xác nhận danh mục lưu (Bạn có quyền chọn lại)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">(Để trống = Chưa phân loại)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.description ? `(${c.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Buttons */}
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
                  <span>{editingNote ? 'Cập nhật ghi chú' : 'Lưu ghi chú'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
