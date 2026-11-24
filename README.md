# 🧠 AI-Powered Note & Task Management System

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

> **NOTE_TASK_AI** là ứng dụng ghi chú và quản lý công việc cá nhân thông minh, tích hợp trợ lý Google Gemini AI theo triết lý **"AI gợi ý, User xác nhận"**. Hệ thống hỗ trợ tự động phân loại ghi chú theo ngữ cảnh danh mục cá nhân, đánh giá mức độ khẩn cấp của nhiệm vụ kết hợp luật thời gian (Rule Engine), bảo mật đa người dùng (Multi-tenant) và sẵn sàng triển khai trọn gói bằng **Docker Compose chỉ với 1 câu lệnh duy nhất**.

---

## 📑 Mục lục
- [1. Triết lý sản phẩm & Tính năng nổi bật](#1-triết-lý-sản-phẩm--tính-năng-nổi-bật)
- [2. Kiến trúc hệ thống (System Architecture)](#2-kiến-trúc-hệ-thống-system-architecture)
- [3. Công nghệ sử dụng (Tech Stack)](#3-công-nghệ-sử-dụng-tech-stack)
- [4. Cấu trúc thư mục dự án](#4-cấu-trúc-thư-mục-dự-án)
- [5. Hướng dẫn cài đặt & Khởi chạy A-Z](#5-hướng-dẫn-cài-đặt--khởi-chạy-a-z)
  - [Cách 1: Khởi chạy 1-Click với Docker Compose (Khuyên dùng)](#cách-1-khởi-chạy-1-click-với-docker-compose-khuyên-dùng)
  - [Cách 2: Cài đặt và chạy thủ công trên máy cục bộ (Local Development)](#cách-2-cài-đặt-và-chạy-thủ-công-trên-máy-cục-bộ-local-development)
- [6. Bảng tham chiếu biến môi trường (.env)](#6-bảng-tham-chiếu-biến-môi-trường-env)
- [7. Tài liệu API (API Specifications)](#7-tài-liệu-api-api-specifications)
- [8. Hướng dẫn kiểm thử tự động với Postman (73/73 Passed)](#8-hướng-dẫn-kiểm-thử-tự-động-với-postman-7373-passed)
- [9. Đóng góp & Bản quyền](#9-đóng-góp--bản-quyền)

---

## 1. Triết lý sản phẩm & Tính năng nổi bật

### 🎯 Triết lý cốt lõi: "AI gợi ý, User xác nhận"
Các hệ thống AI truyền thống thường tự ý ghi đè dữ liệu, dẫn đến hiện tượng ảo giác (hallucination) hoặc phân loại sai lệch ý muốn người dùng. **NOTE_TASK_AI** giải quyết triệt để vấn đề này:
* **Không ghi đè tự động:** Endpoint AI (`/ai/classify-note`, `/ai/assess-task`) là **stateless** (không ghi trực tiếp vào cơ sở dữ liệu).
* **Kiểm duyệt trực quan:** AI trả về gợi ý kèm **lý do giải thích (reason)** và điểm tự tin. Người dùng có quyền: *Chấp nhận gợi ý*, *Chỉnh sửa lại theo ý mình*, hoặc *Chọn phân loại thủ công*.

### 🌟 Các tính năng nổi bật
1. **Phân loại Note ngữ cảnh (Context-Injected Classification):**
   * Backend tự động trích xuất danh sách danh mục kèm **chú thích (description)** của chính người dùng đó để đưa vào prompt cho Gemini AI.
   * Nếu nội dung note hoàn toàn mới chưa có danh mục phù hợp, AI sẽ tự động đề xuất tạo một danh mục mới khái quát (`suggested_new_category`).
2. **Đánh giá mức độ ưu tiên Task (Hybrid Rule-Engine + AI Semantic):**
   * Kết hợp phân tích ngữ nghĩa công việc với **Luật cứng thời gian (Heuristic Rules)**:
     * Hạn chót còn lại $< 24$ giờ: Mức độ ưu tiên tối thiểu bắt buộc là `urgent`.
     * Hạn chót còn lại $< 6$ giờ hoặc quá hạn: Bắt buộc là `critical`.
3. **An toàn dữ liệu tuyệt đối (Data Integrity):**
   * Ràng buộc Foreign Key thông minh: Khi xóa danh mục, các ghi chú bên trong **không bị mất** mà tự động chuyển về trạng thái chưa phân loại (`onDelete: SetNull`).
   * Phân quyền đa người dùng (Multi-tenant): Toàn bộ thao tác đều gắn chặt với `userId` từ token JWT. Khi người dùng cố tình truy cập tài nguyên của người khác, hệ thống trả về `404 Not Found` (thay vì `403`) để ngăn ngừa tấn công dò quét ID.
4. **Cơ chế phục hồi sự cố AI (Resilience & Failover):**
   * Tự động thử lại (Retry) và chuyển đổi linh hoạt qua các model dự phòng (`gemini-3.5-flash-lite` $\rightarrow$ `gemini-2.5-flash` $\rightarrow$ `gemini-3.1-flash-lite`) khi mạng gián đoạn hoặc Google quá tải (`503 High Demand`).
   * Khi AI gặp lỗi hoặc timeout, giao diện không bị chặn, người dùng vẫn tiếp tục lưu và chọn danh mục thủ công bình thường.

---

## 2. Kiến trúc hệ thống (System Architecture)

```mermaid
flowchart TD
    subgraph ClientLayer["🖥️ Frontend Client (Port 5173)"]
        Browser["Trình duyệt người dùng (Single Page Application)"]
        ReactApp["React 19 + Tailwind v4 + Lucide Icons"]
        Browser --> ReactApp
    end

    subgraph ServerLayer["⚙️ Backend & API Gateway (Port 3000)"]
        Express["Express 5 REST API Server"]
        AuthMiddleware["JWT Authentication Middleware"]
        Validator["Zod Schema Validation Middleware"]
        ErrorHandler["Global Error Handler (PRD 4.1 Standard)"]
        Controllers["Controllers: Auth, Category, Note, Task, AI"]
        
        Express --> AuthMiddleware --> Validator --> Controllers
        Express --> ErrorHandler
    end

    subgraph DBLayer["🗄️ Database Layer (Port 5432)"]
        Prisma["Prisma ORM 7 (@prisma/adapter-pg)"]
        Postgres[("PostgreSQL 16 Database\nTables: users, categories, notes, tasks")]
        
        Prisma --> Postgres
    end

    subgraph AILayer["🤖 Cloud AI Service"]
        GeminiAPI["Google Gemini 3.5 Flash Lite\n(@google/genai SDK)"]
    end

    ReactApp -->|"REST API Calls (Bearer JWT)"| Express
    Controllers -->|"ORM Queries"| Prisma
    Controllers -->|"Prompt + Context Injection"| GeminiAPI
    GeminiAPI -.->|"JSON Suggestions & Reasons"| Controllers
```

---

## 3. Công nghệ sử dụng (Tech Stack)

| Tầng | Công nghệ | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Backend** | Node.js 20 LTS, Express 5.x | Xây dựng RESTful API tốc độ cao, xử lý luồng non-blocking. |
| **Database** | PostgreSQL 16, Prisma ORM 7.x | Cơ sở dữ liệu quan hệ, UUID khóa chính, `@prisma/adapter-pg` tối ưu connection pool. |
| **AI Integration** | Google GenAI SDK (`@google/genai`) | Tích hợp mô hình `gemini-3.5-flash-lite` phân tích ngữ nghĩa và trích xuất cấu trúc JSON. |
| **Validation & Auth** | Zod 4.x, BcryptJS, JSON Web Token | Validate dữ liệu đầu vào nghiêm ngặt, băm mật khẩu bảo mật (Salt 10), xác thực phiên làm việc. |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 | Giao diện hiện đại, tối ưu hiệu năng render, responsive linh hoạt. |
| **Web Server / Proxy**| Nginx Alpine | Phục vụ Single Page Application tĩnh, nén Gzip, cache header. |
| **DevOps & Testing** | Docker, Docker Compose, Postman | Đóng gói môi trường đồng nhất, bộ test suite tự động 73 kịch bản. |

---

## 4. Cấu trúc thư mục dự án

```text
NOTE_TASK_AI/
├── docker-compose.yml              # File điều phối khởi chạy toàn bộ hệ thống bằng Docker
├── .env.example                    # Biến môi trường mẫu cho Docker Compose
├── README.md                       # Tài liệu hướng dẫn kỹ thuật toàn diện
│
├── backend/                        # Mã nguồn Backend API Service
│   ├── Dockerfile                  # Cấu hình đóng gói container Backend
│   ├── .dockerignore
│   ├── .env.example                # Biến môi trường mẫu cho Backend local
│   ├── package.json
│   ├── prisma7.config.ts           # Cấu hình kết nối Prisma 7 ORM
│   ├── postman.json                # Bộ kiểm thử tự động 73 requests cho Postman
│   ├── prisma/
│   │   ├── schema.prisma           # Định nghĩa các bảng dữ liệu (User, Category, Note, Task)
│   │   └── migrations/             # Lịch sử các bản migration database
│   └── src/
│       ├── server.js               # Khởi động HTTP Server lắng nghe cổng 3000
│       ├── app.js                  # Cấu hình Express, Middleware bảo mật (Helmet, CORS)
│       ├── config/prisma.js        # Khởi tạo kết nối PostgreSQL qua PrismaPgAdapter
│       ├── controllers/            # Xử lý logic nghiệp vụ các endpoint
│       ├── middlewares/            # Xử lý xác thực JWT và Global Error Handler
│       ├── routes/                 # Định nghĩa các tuyến đường API
│       ├── services/ai.service.js  # Tích hợp Gemini AI, Heuristic rules, Fallback
│       └── validations/            # Khai báo schema kiểm tra dữ liệu bằng Zod
│
└── frontend/                       # Mã nguồn Frontend Web Application
    ├── Dockerfile                  # Cấu hình Multi-stage build + Nginx Alpine
    ├── nginx.conf                  # Cấu hình máy chủ Nginx phục vụ React SPA
    ├── .dockerignore
    ├── .env.example                # Biến môi trường mẫu cho Frontend
    ├── package.json
    ├── vite.config.js              # Cấu hình Vite & Tailwind CSS v4
    └── src/
        ├── App.jsx                 # Component trung tâm điều phối giao diện
        ├── main.jsx                # Điểm khởi động ứng dụng React 19
        ├── api/client.js           # Module fetch API tập trung có gắn JWT
        ├── context/AuthContext.jsx # Quản lý trạng thái đăng nhập toàn cục
        └── components/             # Các view màn hình chính
            ├── AuthPage.jsx        # Đăng ký / Đăng nhập
            ├── Navbar.jsx          # Thanh điều hướng và thông tin người dùng
            ├── CategoriesView.jsx  # Quản lý danh mục và chú thích cho AI
            ├── NotesView.jsx       # Ghi chú, lọc danh mục, popup AI gợi ý
            └── TasksView.jsx       # Nhiệm vụ, lọc ưu tiên, sắp xếp deadline, AI đánh giá
```

---

## 5. Hướng dẫn cài đặt & Khởi chạy A-Z

### Cách 1: Khởi chạy 1-Click với Docker Compose (Khuyên dùng)

> **Yêu cầu môi trường:** Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (hoặc Docker Engine + Docker Compose).

#### Bước 1: Sao chép mã nguồn và thiết lập biến môi trường
```sh
# 1. Clone repository về máy
git clone <URL_REPOSITORY>
cd NOTE_TASK_AI

# 2. Tạo file biến môi trường từ file mẫu
cp .env.example .env
```

#### Bước 2: Điền Google Gemini API Key
Mở file `.env` vừa tạo và điền khóa API của bạn (nếu chưa có, lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/)):
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

#### Bước 3: Khởi chạy hệ thống bằng Docker Compose
Chỉ cần thực thi một câu lệnh duy nhất:
```sh
docker compose up -d --build
```

Hệ thống sẽ tự động:
1. Kéo image `postgres:16-alpine`, khởi tạo Database `AI_TASK_NOTE` và thiết lập volume bền vững.
2. Build image `backend`, tự động chạy migration và nạp dữ liệu mẫu/tài khoản test (`seed data`), sau đó bật API tại cổng `3000`.
3. Build image `frontend`, biên dịch React 19 và đưa lên máy chủ `Nginx` siêu nhẹ tại cổng `5173`.

#### Bước 4: Trải nghiệm ứng dụng
* 🌐 **Giao diện Web:** Mở trình duyệt truy cập: [http://localhost](http://localhost) hoặc [http://localhost:5173](http://localhost:5173) (hoặc [http://127.0.0.1:5173](http://127.0.0.1:5173))
* 💡 **Tài khoản dùng thử (Demo):** Email: `user@example.com` | Mật khẩu: `password123` *(Đã có nút "Điền nhanh" trên màn hình đăng nhập)*
* 🔌 **Backend API:** [http://localhost:3000](http://localhost:3000)
* 🩺 **Kiểm tra sức khỏe:** [http://localhost:3000/health](http://localhost:3000/health)

Để dừng hệ thống khi không sử dụng:
```sh
docker compose down
```

---

### Cách 2: Cài đặt và chạy thủ công trên máy cục bộ (Local Development)

> **Yêu cầu môi trường:**
> * Node.js $\ge$ 20.x ([Tải Node.js](https://nodejs.org/))
> * PostgreSQL 14+ đang chạy trên máy (mặc định cổng 5432).

#### Bước 1: Cài đặt & Khởi động Backend
```sh
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các gói thư viện
npm install

# 3. Tạo file .env từ file mẫu
cp .env.example .env

# 4. Chỉnh sửa DATABASE_URL và GEMINI_API_KEY trong file .env cho khớp với máy của bạn
# Ví dụ: DATABASE_URL=postgresql://postgres:matkhau@localhost:5432/AI_TASK_NOTE

# 5. Đồng bộ Database Schema qua Prisma
npx prisma migrate dev --name init

# 6. Nạp dữ liệu mẫu và tài khoản test (user@example.com / password123)
npm run db:seed

# 7. Khởi động Backend Server ở chế độ live-reload
npm run dev
# Server sẽ lắng nghe tại: http://localhost:3000
```

#### Bước 2: Cài đặt & Khởi động Frontend
Mở một cửa sổ Terminal mới:
```sh
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file cấu hình môi trường
cp .env.example .env

# 4. Khởi chạy máy chủ phát triển Vite
npm run dev
# Ứng dụng chạy tại: http://localhost:5173
```

---

## 6. Bảng tham chiếu biến môi trường (.env)

| Tên biến | Bắt buộc | Mặc định | Mô tả chi tiết |
| :--- | :---: | :---: | :--- |
| `PORT` | Không | `3000` | Cổng HTTP mà Backend API lắng nghe. |
| `DATABASE_URL` | **Có** | - | Chuỗi kết nối PostgreSQL (VD: `postgresql://user:pass@host:5432/db`). |
| `JWT_SECRET` | **Có** | - | Chuỗi khóa bí mật dùng để ký và xác thực token JWT người dùng. |
| `GEMINI_API_KEY` | **Có** | - | Khóa API cấp từ Google AI Studio để gọi mô hình Gemini. |
| `GEMINI_MODEL` | Không | `gemini-3.5-flash-lite` | Tên mô hình AI chính sẽ sử dụng. |
| `CORS_ORIGIN` | Không | `*` | Danh sách domain được phép gọi API (hoặc URL frontend). |
| `VITE_API_URL` | Không | `http://localhost:3000` | Địa chỉ Backend API mà Frontend gửi request tới. |

---

## 7. Tài liệu API (API Specifications)

### 📌 Quy chuẩn phản hồi lỗi (PRD 4.1 Standard Error Format)
Toàn bộ mã lỗi trả về định dạng JSON đồng nhất:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "deadline",
        "message": "Hạn chót phải là định dạng ngày hợp lệ (ISO 8601)"
      }
    ]
  }
}
```

### 📋 Danh sách Endpoints chính

#### 1. Hệ thống & Xác thực (Auth)
* `GET /health`: Kiểm tra tình trạng server (Trả về `{ "status": "OK" }`).
* `POST /auth/register`: Đăng ký tài khoản mới (`email`, `password`, `name`). Trả về `201 Created`.
* `POST /auth/login`: Đăng nhập hệ thống (`email`, `password`). Trả về `200 OK` kèm `token`.
* `GET /auth/me`: Lấy thông tin tài khoản hiện tại (Yêu cầu Header `Authorization: Bearer <token>`).

#### 2. Danh mục (Categories)
* `GET /categories`: Lấy danh sách danh mục của user hiện tại.
* `POST /categories`: Tạo danh mục mới (`name`, `description`). Chống trùng tên trong cùng user (`409 Conflict`).
* `PUT /categories/:id`: Sửa tên hoặc chú thích danh mục.
* `DELETE /categories/:id`: Xóa danh mục (Các note thuộc danh mục này sẽ tự động chuyển về `category_id = null`).

#### 3. Ghi chú (Notes)
* `GET /notes`: Danh sách ghi chú có phân trang (`page`, `limit`), tìm kiếm (`?q=keyword`), lọc (`?category_id=uuid` hoặc `?category_id=none` cho note chưa phân loại).
* `GET /notes/:id`: Xem chi tiết ghi chú.
* `POST /notes`: Lưu ghi chú mới (`title`, `content`, `category_id`, `ai_category_id`).
* `PUT /notes/:id`: Cập nhật ghi chú (`title`, `content`, `category_id`). Không cho phép sửa `ai_category_id`.
* `DELETE /notes/:id`: Xóa ghi chú (`204 No Content`).

#### 4. Nhiệm vụ (Tasks)
* `GET /tasks`: Danh sách nhiệm vụ có phân trang, lọc mức độ (`?priority=urgent`), sắp xếp deadline (`?sort=deadline` hoặc `?sort=-deadline`).
* `GET /tasks/:id`: Xem chi tiết nhiệm vụ.
* `POST /tasks`: Tạo nhiệm vụ mới (`title`, `description`, `deadline`, `priority`, `ai_priority`).
* `PUT /tasks/:id`: Cập nhật nhiệm vụ.
* `DELETE /tasks/:id`: Xóa nhiệm vụ (`204 No Content`).

#### 5. Trợ lý AI (Stateless Assistant - Không lưu DB)
* `POST /ai/classify-note`: Đọc nội dung ghi chú và danh mục của user để gợi ý phân loại phù hợp nhất hoặc gợi ý danh mục mới.
* `POST /ai/assess-task`: Đánh giá mức độ ưu tiên (`not_urgent`, `urgent`, `critical`) dựa trên thời gian hạn chót và ngữ nghĩa công việc.

---

## 8. Hướng dẫn kiểm thử tự động với Postman (73/73 Passed)

Dự án cung cấp sẵn file kiểm thử chất lượng cao [backend/postman.json](file:///d:/src/DuAn/NOTE_TASK_AI/backend/postman.json) bao phủ **73 test requests**, kiểm tra mọi khía cạnh: Happy path, Negative cases (400, 401, 404, 409), Ràng buộc xóa danh mục (Cascade SetNull) và Phân quyền đa người dùng.

### Các bước chạy kiểm thử:
1. Mở ứng dụng **Postman**.
2. Nhấn nút **Import** ở góc trên bên trái $\rightarrow$ Kéo thả file `backend/postman.json` vào.
3. Chuột phải vào Collection **AI Note & Task Management API** $\rightarrow$ Chọn **Run Collection**.
4. Giữ nguyên thứ tự các thư mục và bấm **Run AI Note & Task Management API**.

### 🔄 Thứ tự thực thi bảo đảm tính toàn vẹn (0 → 1 → 2 → 3 → 4 → 5 → 7 → 6):
1. **0. System:** Kiểm tra sức khỏe hệ thống (`/health`).
2. **1. Auth:** Đăng ký, Đăng nhập lấy Token, Get Me, Test mật khẩu sai (401), Test thiếu trường (400).
3. **2. Categories:** Tạo danh mục, Test trùng tên (409), Lấy danh sách, Cập nhật, Test UUID không tồn tại (404), ID sai định dạng (400).
4. **3. AI:** Classify note khớp danh mục, Classify note chưa có danh mục, Assess task deadline 7 ngày, Assess task deadline 2 giờ (< 24h), Test thiếu content (400), Test không có token (401).
5. **4. Notes:** Tạo note chưa phân loại, Tạo note có danh mục, Phân trang, Tìm kiếm `?q=`, Lọc `category_id=none`, Lọc `category_id=uuid`, Sửa note, Xóa note, Test ID sai (400).
6. **5. Tasks:** Tạo task 1, Tạo task 2, Sắp xếp deadline tăng dần, Sắp xếp deadline giảm dần, Lọc priority, Sửa task, Xóa task, Test deadline sai định dạng (400).
7. **7. Phân quyền (Security & Cross-Tenant):** User A tạo dữ liệu $\rightarrow$ Tạo và đăng nhập User B $\rightarrow$ User B cố tình truy cập/sửa/xóa note và task của User A (Kỳ vọng 404) $\rightarrow$ User B không thấy dữ liệu của A $\rightarrow$ Test No Auth (401) $\rightarrow$ Dọn dẹp dữ liệu.
8. **6. Clean Up (Cuối cùng):** Tạo note gắn với category $\rightarrow$ Xóa category $\rightarrow$ Kiểm tra note tự động chuyển thành `category_id = null` (**kiểm tra ràng buộc `onDelete: SetNull`**) $\rightarrow$ Dọn dẹp dữ liệu sạch sẽ 100%.

> 🏆 **Kết quả:** Đạt **73/73 tests Passed (100% xanh lá)** mà không để lại bất kỳ dữ liệu rác nào trong Database.

---

## 9. Đóng góp & Bản quyền

Dự án được xây dựng phục vụ nghiên cứu và phát triển phần mềm ứng dụng AI hiện đại. 
Mọi đóng góp, báo cáo lỗi (Issues) hoặc yêu cầu kéo (Pull Requests) đều được chào đón!

* **Giấy phép:** MIT License.
* **Tác giả:** Đội ngũ phát triển NOTE_TASK_AI.
