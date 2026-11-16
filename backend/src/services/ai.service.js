const { GoogleGenAI } = require('@google/genai');
const AppError = require('../utils/appError');

// Khởi tạo Gemini AI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

/**
 * Gọi Gemini với cơ chế tự động thử lại (Retry) và Fallback qua các model flash khác
 * nếu model chính gặp lỗi tạm thời (503 High Demand hoặc Timeout).
 */
const generateJsonContent = async (prompt) => {
  const models = [MODEL_NAME, 'gemini-2.5-flash', 'gemini-3.1-flash-lite'];
  let lastError = null;

  for (const model of models) {
    try {
      const responsePromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 25000)
      );

      const result = await Promise.race([responsePromise, timeoutPromise]);
      return result.text?.trim() || '{}';
    } catch (err) {
      console.warn(`⚠️ [AI RETRY] Model ${model} gặp lỗi:`, err.message || err);
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  throw lastError;
};

/**
 * Gợi ý danh mục phù hợp cho Note dựa trên danh sách categories của user.
 * Nếu không có danh mục phù hợp (hoặc user chưa có danh mục nào),
 * AI sẽ đề xuất tạo một danh mục mới mang tính khái quát (suggested_new_category).
 */
const classifyNote = async ({ title, content, categories = [] }) => {
  if (!ai || !apiKey) {
    throw new AppError('AI API Key chưa được cấu hình', 502, 'AI_UNAVAILABLE');
  }

  const categoryContext = categories.length > 0
    ? categories.map((cat, idx) => {
        const desc = cat.description ? ` (Chú thích: ${cat.description})` : '';
        return `${idx + 1}. ID: "${cat.id}" - Tên: "${cat.name}"${desc}`;
      }).join('\n')
    : '(Người dùng hiện tại chưa có danh mục nào)';

  const prompt = `
Bạn là một trợ lý thông minh hỗ trợ phân loại ghi chú cá nhân.
Nhiệm vụ của bạn là đọc tiêu đề và nội dung ghi chú dưới đây, sau đó phân tích và chọn danh mục phù hợp nhất:

DANH SÁCH DANH MỤC CÓ SẴN CỦA NGƯỜI DÙNG:
${categoryContext}

THÔNG TIN GHI CHÚ CẦN PHÂN LOẠI:
- Tiêu đề: ${title || '(Không có tiêu đề)'}
- Nội dung: ${content}

QUY TẮC PHÂN LOẠI:
1. NẾU TÌM THẤY DANH MỤC PHÙ HỢP trong danh sách có sẵn của người dùng:
   - "category_id": ID của danh mục đó (chính xác ID trong danh sách).
   - "category_name": Tên danh mục đó.
   - "suggested_new_category": null.
   - "confidence": "high" hoặc "medium".

2. NẾU KHÔNG CÓ DANH MỤC NÀO PHÙ HỢP (hoặc danh sách đang trống):
   - "category_id": null.
   - "category_name": null.
   - "suggested_new_category": Đề xuất 1 tên danh mục mới mang tính khái quát (ví dụ: "Ẩm thực & Nấu ăn", "Tài chính", "Sức khỏe", "Du lịch", "Toán học", "Lập trình",...) kèm mô tả ngắn gọn:
     {
       "name": "Tên danh mục gợi ý",
       "description": "Mô tả ngắn gọn danh mục này dùng để lưu gì"
     }
   - "confidence": "low".

3. Tuyệt đối không được tự ý bịa đặt (hallucinate) ra category_id lạ không có trong danh sách có sẵn.
4. Giải thích ngắn gọn lý do (reason) bằng tiếng Việt (1-2 câu).
5. Phản hồi BẮT BUỘC là định dạng JSON hợp lệ theo cấu trúc sau, không kèm bất kỳ giải thích nào khác ngoài JSON:
{
  "category_id": "id-hoặc-null",
  "category_name": "tên-hoặc-null",
  "suggested_new_category": { "name": "...", "description": "..." } hoặc null,
  "confidence": "high/medium/low",
  "reason": "Lý do ngắn gọn"
}
`.trim();

  try {
    const rawText = await generateJsonContent(prompt);
    const parsed = JSON.parse(rawText);

    if (parsed.category_id && categories.length > 0) {
      const matchedCategory = categories.find((c) => c.id === parsed.category_id);
      if (matchedCategory) {
        return {
          category_id: matchedCategory.id,
          category_name: matchedCategory.name,
          suggested_new_category: null,
          confidence: parsed.confidence || 'medium',
          reason: parsed.reason || 'AI đã phân loại dựa trên nội dung',
        };
      }
    }

    let suggested = parsed.suggested_new_category || null;
    if (suggested && typeof suggested === 'string') {
      suggested = { name: suggested, description: 'Danh mục gợi ý bởi AI' };
    } else if (!suggested) {
      suggested = { name: 'Chung & Đời sống', description: 'Ghi chú tổng hợp' };
    }

    return {
      category_id: null,
      category_name: null,
      suggested_new_category: suggested,
      confidence: parsed.confidence || 'low',
      reason: parsed.reason || 'Nội dung chưa khớp với danh mục nào có sẵn',
    };
  } catch (error) {
    console.error('❌ [AI SERVICE ERROR]:', error.message || error);
    throw new AppError(
      'Dịch vụ AI hiện không khả dụng. Bạn có thể chọn danh mục thủ công.',
      502,
      'AI_UNAVAILABLE'
    );
  }
};

/**
 * Đánh giá mức độ ưu tiên của Task kết hợp:
 * 1. Rule Engine (Luật cứng theo thời gian deadline)
 * 2. AI Semantic Assessment (Độ quan trọng và quy mô công việc)
 * 
 * @param {Object} params
 * @param {string} params.title - Tiêu đề nhiệm vụ
 * @param {string} [params.description] - Mô tả nhiệm vụ
 * @param {string|Date} params.deadline - Hạn chót hoàn thành
 * @returns {Promise<{priority: 'not_urgent'|'urgent'|'critical', reason: string}>}
 */
const assessTask = async ({ title, description, deadline }) => {
  if (!ai || !apiKey) {
    throw new AppError('AI API Key chưa được cấu hình', 502, 'AI_UNAVAILABLE');
  }

  // 1. Tính toán khoảng cách thời gian (Heuristic Rule)
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const diffDays = Math.round(diffHours / 24);

  let timeNotice = '';
  let minimumPriority = 'not_urgent';

  if (diffHours <= 0) {
    timeNotice = 'Nhiệm vụ đã đến hạn hoặc quá hạn!';
    minimumPriority = 'critical';
  } else if (diffHours < 6) {
    timeNotice = `Chỉ còn khoảng ${Math.ceil(diffHours)} giờ nữa là đến hạn (rất gấp)!`;
    minimumPriority = 'critical';
  } else if (diffHours < 24) {
    timeNotice = `Còn khoảng ${Math.ceil(diffHours)} giờ nữa là đến hạn (dưới 24h)!`;
    minimumPriority = 'urgent';
  } else {
    timeNotice = `Còn khoảng ${diffDays} ngày nữa đến hạn.`;
  }

  const prompt = `
Bạn là một trợ lý thông minh hỗ trợ đánh giá mức độ ưu tiên của công việc (Task).
Độ ưu tiên CHỈ ĐƯỢC PHÉP là 1 trong 3 giá trị sau:
- "not_urgent": Không gấp, có nhiều thời gian, công việc hàng ngày hoặc không ảnh hưởng lớn nếu làm trễ.
- "urgent": Gấp, sắp đến hạn (trong vòng 1-3 ngày) hoặc công việc quan trọng cần ưu tiên làm sớm.
- "critical": Khẩn cấp, sắp hết hạn (dưới 6-12h) hoặc công việc cực kỳ nghiêm trọng (ví dụ: bảo vệ đồ án tốt nghiệp, nộp thuế, sự cố sập server).

THÔNG TIN NHIỆM VỤ:
- Tiêu đề: ${title}
- Mô tả: ${description || '(Không có mô tả chi tiết)'}
- Thời gian còn lại: ${timeNotice} (Hạn chót: ${deadlineDate.toISOString()})

QUY TẮC BẮT BUỘC:
1. Luật thời gian cứng: Nếu thời gian còn lại dưới 24 giờ, mức độ ưu tiên TỐI THIỂU phải là "urgent". Nếu dưới 6 giờ hoặc quá hạn, TỐI THIỂU là "critical".
2. Luật ngữ nghĩa: Xem xét tính nghiêm trọng của công việc (ví dụ: "Nộp đồ án tốt nghiệp" hay "Đi mua bịch kẹo").
3. Phản hồi BẮT BUỘC là định dạng JSON hợp lệ:
{
  "priority": "not_urgent" | "urgent" | "critical",
  "reason": "Giải thích ngắn gọn lý do bằng tiếng Việt (1 câu)"
}
`.trim();

  try {
    const rawText = await generateJsonContent(prompt);
    const parsed = JSON.parse(rawText);

    let finalPriority = parsed.priority || 'not_urgent';

    // Ràng buộc 3 giá trị hợp lệ
    const validPriorities = ['not_urgent', 'urgent', 'critical'];
    if (!validPriorities.includes(finalPriority)) {
      finalPriority = minimumPriority;
    }

    // Áp dụng Rule cứng: Không bao giờ để AI hạ mức ưu tiên thấp hơn minimumPriority quy định
    const priorityWeight = { not_urgent: 1, urgent: 2, critical: 3 };
    if (priorityWeight[finalPriority] < priorityWeight[minimumPriority]) {
      finalPriority = minimumPriority;
    }

    return {
      priority: finalPriority,
      reason: parsed.reason || `Được đánh giá dựa trên thời gian còn lại (${timeNotice}) và nội dung công việc.`,
    };
  } catch (error) {
    console.error('❌ [AI ASSESS TASK ERROR]:', error.message || error);
    throw new AppError(
      'Dịch vụ AI hiện không khả dụng. Bạn có thể chọn mức độ ưu tiên thủ công.',
      502,
      'AI_UNAVAILABLE'
    );
  }
};

module.exports = {
  classifyNote,
  assessTask,
};
