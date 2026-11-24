const bcrypt = require('bcryptjs');
const { prisma, pool } = require('../src/config/prisma');

async function main() {
  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Database Seeding)...');

  // 1. Tạo hoặc cập nhật Demo User: user@example.com / password123
  const email = 'user@example.com';
  const rawPassword = 'password123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const demoUser = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Nguyễn Văn A',
      passwordHash,
    },
    create: {
      email,
      name: 'Nguyễn Văn A',
      passwordHash,
    },
  });

  console.log(`✅ Đã chuẩn bị tài khoản test: ${demoUser.email} (Mật khẩu: ${rawPassword})`);

  // 2. Tạo các danh mục mẫu (Categories)
  const categoriesData = [
    { name: 'Công việc', description: 'Các đầu việc, dự án tại công ty và tài liệu kỹ thuật' },
    { name: 'Học tập', description: 'Kiến thức AI, lập trình Fullstack và ngoại ngữ' },
    { name: 'Cá nhân', description: 'Lối sống, sức khỏe và tài chính cá nhân' },
  ];

  const createdCategories = {};
  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: cat.name,
        },
      },
      update: { description: cat.description },
      create: {
        userId: demoUser.id,
        name: cat.name,
        description: cat.description,
      },
    });
    createdCategories[cat.name] = category;
  }
  console.log(`✅ Đã tạo/cập nhật ${Object.keys(createdCategories).length} danh mục mẫu`);

  // 3. Tạo ghi chú mẫu (Notes) nếu user chưa có ghi chú
  const existingNotes = await prisma.note.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingNotes) {
    await prisma.note.createMany({
      data: [
        {
          userId: demoUser.id,
          categoryId: createdCategories['Công việc']?.id || null,
          title: 'Tổng hợp kiến trúc NoteTask AI',
          content: 'Hệ thống áp dụng kiến trúc 3 tầng: React 19 Frontend (Nginx), Express 5 Backend, PostgreSQL 16 và Google Gemini 2.5 Flash Lite để tự động phân loại ghi chú và đánh giá độ ưu tiên công việc.',
        },
        {
          userId: demoUser.id,
          categoryId: createdCategories['Học tập']?.id || null,
          title: 'Ý tưởng phát triển mô hình RAG',
          content: 'Nghiên cứu tích hợp thêm Vector Database (pgvector) để hỗ trợ tìm kiếm ngữ nghĩa (Semantic Search) cho các ghi chú dài của người dùng.',
        },
      ],
    });
    console.log('✅ Đã tạo các ghi chú mẫu');
  }

  // 4. Tạo công việc mẫu (Tasks) nếu user chưa có task
  const existingTasks = await prisma.task.findFirst({
    where: { userId: demoUser.id },
  });

  if (!existingTasks) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.task.createMany({
      data: [
        {
          userId: demoUser.id,
          title: 'Kiểm tra độ sẵn sàng của hệ thống trên Docker',
          description: 'Xác thực toàn bộ API và giao diện Web hoạt động trơn tru chỉ với 1 lệnh docker compose up',
          deadline: tomorrow,
          priority: 'urgent',
          aiPriority: 'urgent',
        },
        {
          userId: demoUser.id,
          title: 'Viết tài liệu hướng dẫn và nộp đồ án',
          description: 'Hoàn thiện README.md, sơ đồ kiến trúc Archify và video demo',
          deadline: nextWeek,
          priority: 'high',
          aiPriority: 'high',
        },
      ],
    });
    console.log('✅ Đã tạo các công việc mẫu');
  }

  console.log('🎉 Quá trình Seeding dữ liệu hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
