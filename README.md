# Ứng Dụng Quản Lý Ghi Chú & Nhiệm Vụ Tích Hợp Trí Tuệ Nhân Tạo (AI Note & Task Management)

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-black.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791.svg)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange.svg)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

Hệ thống quản lý ghi chú và nhiệm vụ cá nhân thông minh, tích hợp trí tuệ nhân tạo (Google Gemini) hỗ trợ tự động phân loại văn bản, đánh giá mức độ khẩn cấp của công việc theo ma trận thời gian và bảo mật dữ liệu tuyệt đối theo mô hình phân quyền người dùng.

---

## 📑 Mục lục
1. [Tính năng nổi bật](#-tính-năng-nổi-bật)
2. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
3. [Thiết kế Cơ sở Dữ liệu (ERD)](#-thiết-kế-cơ-sở-dữ-liệu-erd)
4. [Luồng Tích hợp AI (AI Workflow)](#-luồng-tích-hợp-ai-ai-workflow)
5. [Ngăn xếp Công nghệ (Tech Stack)](#-ngăn-xếp-công-nghệ-tech-stack)
6. [Hướng dẫn cài đặt từ A - Z](#-hướng-dẫn-cài-đặt-từ-a---z)
   - [Cách 1: Triển khai nhanh với Docker Compose (Khuyên dùng)](#cách-1-triển-khai-nhanh-với-docker-compose-khuyên-dùng)
   - [Cách 2: Chạy trực tiếp trên môi trường Local Development](#cách-2-chạy-trực-tiếp-trên-môi-trường-local-development)
7. [Bảng biến môi trường](#-bảng-biến-môi-trường-environment-variables)
8. [Tài liệu API chi tiết (RESTful API Reference)](#-tài-liệu-api-chi-tiết-restful-api-reference)
9. [Kiểm thử tự động với Postman](#-kiểm-thử-tự-động-với-postman)
10. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)

---

## 🌟 Tính năng nổi bật

### 1. Quản lý Ghi chú & Phân loại Thông minh (AI Smart Categorization)
- Tạo, sửa, xóa và tìm kiếm ghi chú toàn văn (full-text search không phân biệt hoa thường).
- Lọc ghi chú theo danh mục tùy chọn hoặc ghi chú chưa phân loại (`category_id=none`).
- **AI Tự Động Phân Loại**: Khi soạn nội dung, AI phân tích ngữ cảnh để gợi ý danh mục phù hợp nhất trong các danh mục hiện có của bạn. Nếu chưa có danh mục tương ứng, AI chủ động đề xuất tên danh mục mới.
- **Triết lý kiểm soát**: AI chỉ gợi ý (`ai_category_id`), người dùng toàn quyền xác nhận hoặc thay đổi (`category_id`).

### 2. Quản lý Nhiệm vụ & Đánh giá Ưu tiên (AI Priority Assessment)
- Lập kế hoạch công việc kèm thời hạn chót (Deadline) và trạng thái ưu tiên: `not_urgent`, `urgent`, `critical`.
- Sắp xếp nhiệm vụ theo hạn chót tăng dần/giảm dần, lọc nhanh nhiệm vụ khẩn cấp.
- **AI Đánh Giá Độ Khẩn Cấp**: Tự động phân tích nội dung công việc và thời gian còn lại (áp dụng luật cứng: việc dưới 24 giờ tự động nâng độ ưu tiên) để đưa ra mức độ khuyến nghị kèm lời giải thích thuyết phục.

### 3. Bảo mật & Cô lập Dữ liệu (Enterprise Security)
- Xác thực Stateless qua **JWT (JSON Web Token)**, mật khẩu mã hóa một chiều an toàn bằng **Bcrypt**.
- Kiểm soát phân quyền nghiêm ngặt: Mỗi người dùng chỉ được quyền truy xuất và chỉnh sửa tài nguyên (Danh mục, Ghi chú, Nhiệm vụ) của chính mình. Truy cập tài nguyên của người khác trả về `404 Not Found` (ngăn chặn dò quét ID).
- Validate toàn bộ đầu vào bằng **Zod v4**, trả về mã lỗi `400 Bad Request` chi tiết.
- Tự động chuyển `category_id` về `null` (SetNull) khi danh mục bị xóa, bảo toàn toàn vẹn dữ liệu ghi chú.

### 4. Đóng gói Container Hoàn chỉnh
- Triển khai toàn bộ Hệ sinh thái gồm **PostgreSQL**, **Backend Express API**, và **Frontend Nginx Reverse Proxy** chỉ với **1 câu lệnh duy nhất**.

---

## 🏛 Kiến trúc hệ thống

Hệ thống được xây dựng theo kiến trúc Micro-services / Multi-tier hướng Container:

```mermaid
flowchart TD
    Client["🌐 Người Dùng (Trình duyệt Web / Postman)"]

    subgraph DockerHost["🐳 Docker Container Network (app-network)"]
        direction TB

        subgraph FrontendContainer["Frontend Service (Port 80)"]
            Nginx["Nginx Reverse Proxy"]
            StaticApp["React 19 SPA (HTML/CSS/JS)"]
            Nginx -->|Serve Static| StaticApp
        end

        subgraph BackendContainer["Backend Service (Port 3000)"]
            Express["Node.js Express App"]
            AuthMid["JWT Auth Middleware"]
            ZodVal["Zod Validation"]
            Controllers["Controllers & Business Logic"]
            PrismaAdapter["Prisma 7 ORM (pg Pool Adapter)"]

            Express --> AuthMid --> ZodVal --> Controllers --> PrismaAdapter
        end

        subgraph DatabaseContainer["Database Service (Port 5432)"]
            Postgres[("PostgreSQL 16 Engine\n(Persistent Volume)")]
        end
    end

    subgraph CloudServices["☁️ Dịch Vụ Đám Mây"]
        GeminiAPI["Google Gemini 2.5 / 3.5 AI Engine"]
    end

    Client -->|HTTP GET /| Nginx
    Client -->|HTTP API /api/*| Nginx
    Nginx -->|Reverse Proxy /api/* -> :3000/*| Express
    PrismaAdapter -->|TCP / SQL Queries| Postgres
    Controllers -->|HTTPS API Requests| GeminiAPI
```

---

## 🗄 Thiết kế Cơ sở Dữ liệu (ERD)

Mô hình dữ liệu quan hệ được thiết kế chuẩn mực với Prisma ORM:

```mermaid
erDiagram
    User ||--o{ Category : "sở hữu (1:N)"
    User ||--o{ Note : "sở hữu (1:N)"
    User ||--o{ Task : "sở hữu (1:N)"
    Category ||--o{ Note : "phân loại (1:N, SetNull khi xóa)"
    Category ||--o{ Note : "AI đề xuất (1:N, SetNull khi xóa)"

    User {
        uuid id PK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    Category {
        uuid id PK
        uuid userId FK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    Note {
        uuid id PK
        uuid userId FK
        string title
        text content
        uuid categoryId FK "Khóa ngoại (SetNull)"
        uuid aiCategoryId FK "Gợi ý AI (SetNull)"
        datetime createdAt
        datetime updatedAt
    }

    Task {
        uuid id PK
        uuid userId FK
        string title
        text description
        datetime deadline
        string priority "not_urgent | urgent | critical"
        string aiPriority "Gợi ý AI"
        datetime createdAt
        datetime updatedAt
    }
```

---

## 🧠 Luồng Tích hợp AI (AI Workflow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant AI as Google Gemini AI
    participant DB as PostgreSQL

    Note over User, FE: Phân loại Ghi chú Thông minh
    User->>FE: Nhập nội dung ghi chú
    FE->>BE: POST /ai/classify-note (content)
    BE->>DB: Lấy danh sách danh mục hiện tại của User
    BE->>AI: Gửi content + Danh sách categories (Prompt tối ưu)
    alt Gemini Phản hồi thành công
        AI-->>BE: Trả về JSON { category_id, suggested_new_category, reason }
    else Quá tải / Lỗi mạng (503/Timeout)
        BE->>AI: Retry tự động qua mô hình dự phòng (Gemini 2.5 / 3.1)
    end
    BE-->>FE: Trả kết quả phân loại chuẩn hóa
    FE-->>User: Hiển thị Badge gợi ý kèm nút "Áp dụng"
    User->>FE: Bấm Lưu Ghi chú (Xác nhận hoặc đổi danh mục)
    FE->>BE: POST /notes { title, content, category_id, ai_category_id }
    BE->>DB: Lưu bản ghi Note an toàn
```

---

## 💻 Ngăn xếp Công nghệ (Tech Stack)

| Phân hệ | Công nghệ | Phiên bản | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Backend** | Node.js | v22 LTS | Môi trường thực thi JavaScript hiệu năng cao |
| | Express.js | v5.x | Web API framework thế hệ mới |
| | Prisma ORM | v7.x | Quản trị Schema, Type-safe Client với pg driver adapter |
| | Zod | v4.x | Khai báo Schema và Validate dữ liệu request chặt chẽ |
| | JSON Web Token | v9.x | Xác thực Stateless Authorization |
| | Bcrypt.js | v3.x | Mã hóa băm mật khẩu một chiều |
| **Frontend** | React | v19.x | Thư viện UI hiện đại |
| | Vite | v8.x | Bundler siêu tốc |
| | Tailwind CSS | v4.x | Styling hiện đại, responsive, dark/light theme |
| | Lucide React | v1.x | Bộ Icon vector thẩm mỹ |
| | Nginx | Alpine | Web Server tĩnh và Reverse Proxy cho container Frontend |
| **Cơ sở dữ liệu** | PostgreSQL | v16.x Alpine | CSDL quan hệ chuẩn ACID, đánh chỉ mục và ràng buộc toàn vẹn |
| **Trí tuệ nhân tạo** | Google Gemini API | 2.5 / 3.5 | Xử lý ngôn ngữ tự nhiên, phân loại văn bản & suy luận ngữ cảnh |
| **Đóng gói & DevOps** | Docker & Compose | v3.9+ | Container hóa đa dịch vụ chạy độc lập |

---

## 🚀 Hướng dẫn cài đặt từ A - Z

### Yêu cầu hệ thống tiên quyết
- **Docker** & **Docker Compose** (đối với phương pháp chạy bằng Docker)
- **Node.js** `>= 18.x` và **PostgreSQL** `>= 14.x` (đối với phương pháp chạy trực tiếp Local)
- **Google Gemini API Key** (Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/))

---

### Cách 1: Triển khai nhanh với Docker Compose (Khuyên dùng)

Chỉ với 3 bước, toàn bộ hệ thống gồm PostgreSQL, Backend và Frontend sẽ tự động khởi tạo, tạo bảng dữ liệu và chạy hoàn chỉnh.

#### Bước 1: Sao chép file cấu hình môi trường
Tại thư mục gốc dự án, tạo file `.env` từ file mẫu `.env.example`:
```bash
# Trên Linux / macOS
cp .env.example .env

# Trên Windows PowerShell
Copy-Item .env.example .env
```

#### Bước 2: Điền khóa API Gemini và Secret
Mở file `.env` vừa tạo và cập nhật khóa:
```env
POSTGRES_DB=ai_task_note
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_super_password_123

JWT_SECRET=mot_chuoi_bi_mat_rat_dai_va_an_toan_32_ky_tu
GEMINI_API_KEY=dien_gemini_api_key_cua_ban_vao_day
```

#### Bước 3: Khởi chạy toàn bộ hệ thống
```bash
docker compose up --build -d
```

#### Bước 4: Truy cập ứng dụng
- **Giao diện Ứng dụng Web (Frontend)**: [http://localhost](http://localhost)
- **RESTful API Backend**: [http://localhost/api](http://localhost/api) (hoặc trực tiếp tại [http://localhost:3000](http://localhost:3000))
- **Kiểm tra trạng thái hệ thống**: [http://localhost/api/health](http://localhost/api/health)

Để dừng hệ thống:
```bash
docker compose down
```

---

### Cách 2: Chạy trực tiếp trên môi trường Local Development

Nếu bạn muốn debug hoặc phát triển từng phần không qua Docker:

#### 1. Cấu hình CSDL PostgreSQL
Đảm bảo PostgreSQL đang chạy trên máy của bạn và tạo một cơ sở dữ liệu mới (ví dụ: `AI_TASK_NOTE`).

#### 2. Cài đặt & Khởi chạy Backend
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt thư viện
npm install

# Tạo file .env cho backend
cp ../.env.example .env
# Chỉnh sửa DATABASE_URL trong .env trỏ đến PostgreSQL của bạn, ví dụ:
# DATABASE_URL="postgresql://postgres:matkhau@localhost:5432/AI_TASK_NOTE"

# Đồng bộ Schema vào Cơ sở dữ liệu và sinh Client
npx prisma migrate dev --name init
npx prisma generate

# Khởi chạy Backend Server ở chế độ phát triển
npm run dev
```
Backend sẽ lắng nghe tại: `http://localhost:3000`

#### 3. Cài đặt & Khởi chạy Frontend
Mở một cửa sổ Terminal mới:
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt thư viện
npm install

# Khởi chạy Vite Dev Server
npm run dev
```
Mở trình duyệt tại địa chỉ hiển thị trong terminal (mặc định: `http://localhost:5173`).

---

## ⚙️ Bảng biến môi trường (Environment Variables)

| Tên biến | Mô tả | Môi trường áp dụng | Giá trị mẫu |
| :--- | :--- | :--- | :--- |
| `POSTGRES_DB` | Tên cơ sở dữ liệu PostgreSQL | Docker / Compose | `ai_task_note` |
| `POSTGRES_USER` | Tên đăng nhập PostgreSQL | Docker / Compose | `postgres` |
| `POSTGRES_PASSWORD` | Mật khẩu tài khoản PostgreSQL | Docker / Compose | `super_secure_pass` |
| `POSTGRES_PORT` | Cổng map PostgreSQL ra máy host | Docker / Compose | `5432` |
| `DATABASE_URL` | Chuỗi kết nối Connection String đến DB | Backend | `postgresql://user:pass@host:5432/db` |
| `PORT` | Cổng lắng nghe của máy chủ Express | Backend | `3000` |
| `NODE_ENV` | Môi trường chạy ứng dụng (`development`/`production`) | Backend | `production` |
| `JWT_SECRET` | Khóa bí mật dùng ký và xác thực mã JWT | Backend | `chuoi_token_an_toan_32_ky_tu` |
| `GEMINI_API_KEY` | Khóa API Google Gemini AI | Backend | `AIzaSy...` |
| `CORS_ORIGIN` | Nguồn gốc domain cho phép gọi API CORS | Backend | `*` hoặc `http://localhost` |
| `VITE_API_BASE_URL`| Tiền tố đường dẫn gọi API của Frontend | Frontend | `/api` (Docker) hoặc `http://localhost:3000` (Local) |

---

## 📡 Tài liệu API chi tiết (RESTful API Reference)

Toàn bộ các endpoint (ngoại trừ Đăng ký, Đăng nhập và Health) đều yêu cầu Header:
```http
Authorization: Bearer <your_jwt_token>
```

### 1. Hệ thống & Giám sát (System)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Mã phản hồi |
| :--- | :--- | :---: | :--- | :---: |
| `GET` | `/health` | ❌ | Kiểm tra tình trạng hoạt động của API | `200 OK` |

### 2. Xác thực Người dùng (Authentication)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Body chính | Mã phản hồi |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `POST` | `/auth/register` | ❌ | Đăng ký tài khoản mới | `email`, `password` | `201 Created` / `409 Conflict` |
| `POST` | `/auth/login` | ❌ | Đăng nhập nhận JWT Token | `email`, `password` | `200 OK` / `401 Unauthorized` |
| `GET` | `/auth/me` | ✅ | Lấy thông tin user hiện tại | Không | `200 OK` / `401 Unauthorized` |

### 3. Quản lý Danh mục (Categories)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Body chính / Query | Mã phản hồi |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/categories` | ✅ | Danh sách danh mục của user | Không | `200 OK` |
| `POST` | `/categories` | ✅ | Tạo danh mục mới | `name`, `description` | `201 Created` / `409 Conflict` |
| `PUT` | `/categories/:id` | ✅ | Đổi tên / mô tả danh mục | `name`, `description` | `200 OK` / `404 Not Found` |
| `DELETE`| `/categories/:id` | ✅ | Xóa danh mục (Ghi chú về null) | Không | `204 No Content` / `404` |

### 4. Quản lý Ghi chú (Notes)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Body chính / Query | Mã phản hồi |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/notes` | ✅ | Lấy danh sách ghi chú (phân trang, lọc, tìm kiếm) | `?page=1&limit=20&q=...&category_id=...` | `200 OK` |
| `POST` | `/notes` | ✅ | Tạo ghi chú mới | `title`, `content`, `category_id`, `ai_category_id` | `201 Created` / `400 Bad Request` |
| `GET` | `/notes/:id` | ✅ | Lấy chi tiết một ghi chú | Không | `200 OK` / `404 Not Found` |
| `PUT` | `/notes/:id` | ✅ | Sửa ghi chú (không sửa ai_category_id) | `title`, `content`, `category_id` | `200 OK` / `404 Not Found` |
| `DELETE`| `/notes/:id` | ✅ | Xóa ghi chú | Không | `204 No Content` / `404 Not Found` |

### 5. Quản lý Nhiệm vụ (Tasks)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Body chính / Query | Mã phản hồi |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/tasks` | ✅ | Lấy danh sách nhiệm vụ | `?priority=urgent&sort=deadline` | `200 OK` |
| `POST` | `/tasks` | ✅ | Tạo nhiệm vụ mới | `title`, `deadline`, `priority`, `ai_priority` | `201 Created` / `400 Bad Request` |
| `GET` | `/tasks/:id` | ✅ | Xem chi tiết nhiệm vụ | Không | `200 OK` / `404 Not Found` |
| `PUT` | `/tasks/:id` | ✅ | Cập nhật nhiệm vụ | `title`, `deadline`, `priority` | `200 OK` / `404 Not Found` |
| `DELETE`| `/tasks/:id` | ✅ | Xóa nhiệm vụ | Không | `204 No Content` / `404 Not Found` |

### 6. Trí tuệ nhân tạo (AI Integration)
| Method | Endpoint | Yêu cầu Auth | Mô tả chức năng | Body gửi lên |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/ai/classify-note` | ✅ | Tự động phân tích nội dung để gán hoặc gợi ý danh mục | `{ "content": "Chuẩn bị đi bảo dưỡng xe máy" }` |
| `POST` | `/ai/assess-task` | ✅ | Đánh giá mức độ ưu tiên theo nội dung & thời hạn chót | `{ "title": "Báo cáo tài chính", "deadline": "2026-11-20T10:00:00Z" }` |

---

## 🧪 Kiểm thử tự động với Postman

Dự án đi kèm bộ Test Suite hoàn chỉnh với **hơn 70 kịch bản kiểm thử tự động** bao phủ 100% chức năng, xác thực dữ liệu và kiểm tra phân quyền độc lập giữa 2 người dùng.

File kịch bản: `backend/postman.json`

### Các bước chạy kiểm thử tự động:
1. Mở ứng dụng **Postman**.
2. Chọn **Import** -> Chọn file `backend/postman.json`.
3. Kiểm tra các biến môi trường của Collection (hoặc thiết lập Environment):
   - `baseUrl`: `http://localhost:3000` (hoặc `http://localhost/api` nếu chạy qua Docker Nginx).
4. Nhấn chuột phải vào Collection `AI Note & Task Management API` -> Chọn **Run Collection**.
5. Thứ tự kịch bản tự động thực thi tuần tự:
   - `0. System` -> `1. Auth` -> `2. Categories` -> `3. AI` -> `4. Notes` -> `5. Tasks` -> `7. Phân quyền (Multi-user isolation)` -> `6. Clean Up (SetNull Verification)`.
6. Kết quả mong đợi: **Tất cả các kiểm thử đều hiển thị PASS màu xanh**.

---

## 📂 Cấu trúc thư mục dự án

```
NOTE_TASK_AI/
├── .env.example              # File mẫu cấu hình biến môi trường
├── docker-compose.yml        # File cấu hình điều phối các Docker container
├── README.md                 # Tài liệu hướng dẫn dự án toàn diện
│
├── backend/                  # Mã nguồn Backend REST API (Node.js/Express)
│   ├── Dockerfile            # Hướng dẫn build image Docker backend
│   ├── docker-entrypoint.sh  # Script tự động migrate CSDL trước khi khởi động
│   ├── package.json          # Thư viện & kịch bản npm backend
│   ├── postman.json          # Bộ test Postman tự động 70+ test cases
│   ├── prisma/
│   │   ├── schema.prisma     # Định nghĩa cấu trúc các bảng CSDL
│   │   └── migrations/       # Lịch sử các bản migration CSDL
│   └── src/
│       ├── app.js            # Khởi tạo Express, Middleware, Routing
│       ├── server.js         # Khởi chạy HTTP Server trên Port
│       ├── config/           # Cấu hình Prisma Adapter & kết nối PostgreSQL
│       ├── controllers/      # Bộ xử lý yêu cầu (Auth, Category, Note, Task, AI)
│       ├── middlewares/      # Xác thực JWT, Xử lý lỗi tập trung Global Error
│       ├── routes/           # Khai báo các đường dẫn API
│       ├── services/         # Dịch vụ tích hợp AI Gemini (Multi-model Fallback)
│       ├── utils/            # Lớp AppError tùy biến
│       └── validations/      # Zod validation schemas
│
└── frontend/                 # Mã nguồn Giao diện Người dùng (React 19 + Vite)
    ├── Dockerfile            # Hướng dẫn build image Multi-stage Nginx frontend
    ├── nginx.conf            # Cấu hình Nginx Web Server & Reverse Proxy /api/
    ├── package.json          # Thư viện & kịch bản npm frontend
    ├── vite.config.js        # Cấu hình Vite & Tailwind CSS
    └── src/
        ├── App.jsx           # Component chính điều phối view
        ├── main.jsx          # Điểm khởi đầu ứng dụng React DOM
        ├── api/client.js     # HTTP Client tích hợp Bearer token & xử lý 401
        ├── context/          # State quản lý Đăng nhập/Đăng xuất (AuthContext)
        └── components/       # Các màn hình: NotesView, TasksView, CategoriesView, AuthPage, Navbar
```

---

## 🎨 Giao diện & Trải nghiệm Người dùng

Ứng dụng sở hữu giao diện người dùng hiện đại, tối giản nhưng tinh tế:
- **Trang Đăng ký / Đăng nhập**: Chuyển đổi mượt mà, xác thực tức thời kèm thông báo lỗi rõ ràng.
- **Không gian Ghi chú (Notes Workspace)**: Tìm kiếm tức thì, thẻ phân loại màu sắc, hiển thị gợi ý thông minh từ AI với độ trễ tối ưu.
- **Bảng Nhiệm vụ (Task Kanban/List)**: Màu sắc tương ứng từng cấp độ ưu tiên, cảnh báo deadline trực quan.
- **Quản trị Danh mục (Categories)**: Quản lý nhãn trực quan, dễ dàng thêm mới và tinh chỉnh.

---

## 📄 Bản quyền & Tác giả

Dự án được xây dựng với mục tiêu cung cấp giải pháp mẫu mực chuẩn Production cho bài toán quản lý ghi chú và nhiệm vụ cá nhân có ứng dụng AI thế hệ mới.
Mọi đóng góp và phản hồi xin vui lòng liên hệ nhóm phát triển.
