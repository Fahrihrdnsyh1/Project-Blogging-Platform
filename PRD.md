# Product Requirements Document (PRD) - Fullstack Blogging Platform

## 1. Project Overview

Membuat platform blogging fullstack tercontainerisasi yang memungkinkan pengguna untuk memublikasikan artikel, mengelola taksonomi (kategori/tag), dan berinteraksi melalui sistem komentar bertingkat (nested comments).

## 2. Tech Stack Requirements

- **Frontend:** React.js dengan Next.js (App Router). Menggunakan Tailwind CSS untuk styling.
- **Backend:** Node.js dengan framework Express.js.
- **Database:** MySQL 8.0.
- **Infrastruktur:** Docker & Docker Compose.
- **Autentikasi:** JSON Web Token (JWT) dengan enkripsi password menggunakan bcrypt.

## 3. System Architecture & Folder Structure

Aplikasi akan dibagi menjadi tiga layanan utama di dalam `docker-compose.yml`:

- `mysql_db` (Port 3306)
- `backend_api` (Port 5000)
- `frontend_web` (Port 3000)

Struktur root folder:

```
my-blog-project/
├── docker-compose.yml
├── init.sql
├── backend/ (Node.js/Express)
└── frontend/ (Next.js)
```

## 4. Database Schema (MySQL)

AI Agent, gunakan skema DDL berikut untuk membangun database dan mendesain model/ORM di backend:

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'author', 'reader') DEFAULT 'reader',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    featured_image VARCHAR(255) DEFAULT NULL,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE post_tags (
    post_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);
```

## 5. Environment Variables

`.env` untuk backend (`backend/.env`):

```
PORT=5000
DB_HOST=mysql_db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=changeme
DB_NAME=blog_platform
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=/app/uploads
```

`.env.local` untuk frontend (`frontend/.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

`.env.example` wajib disertakan di masing-masing folder (tanpa nilai rahasia) sebagai referensi, dan `.env` asli masuk `.gitignore`.

## 6. Media / Image Upload

- Artikel mendukung `featured_image` (kolom sudah ditambahkan di skema `posts`) dan gambar inline di dalam Rich Text Editor.
- **Storage strategy (pilih salah satu, tentukan sebelum implementasi):**
  - **Local volume** — simpan di folder `backend/uploads`, mount sebagai Docker volume, serve via `express.static`. Cocok untuk development/skala kecil.
  - **Cloud storage (Cloudinary/S3)** — upload dari backend, simpan URL saja di DB. Direkomendasikan untuk production (agar tidak terikat pada satu container).
- Endpoint: `POST /api/upload` (Protected) — terima multipart/form-data (gunakan `multer`), validasi tipe file (jpg/png/webp) dan ukuran maksimum (misal 2MB), kembalikan URL gambar.

## 7. Backend REST API Endpoints (Node.js)

Semua respons API harus menggunakan format JSON. Endpoint yang berstatus "Protected" wajib memvalidasi token JWT dari header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Role | Deskripsi |
|---|---|---|---|---|
| POST | `/api/auth/register` | Public | - | Mendaftarkan user baru. Hash password sebelum simpan. |
| POST | `/api/auth/login` | Public | - | Validasi kredensial dan kembalikan token JWT. |
| GET | `/api/posts` | Public | - | Ambil daftar artikel dengan status `published`. Dukung query `?page=x&limit=y&category=slug&tag=slug&search=keyword`. |
| GET | `/api/posts/:slug` | Public | - | Ambil detail 1 artikel beserta join ke kategori dan daftar tag. |
| POST | `/api/posts` | Protected | author, admin | Buat artikel baru. Gunakan MySQL Transaction untuk insert ke tabel `posts` dan `post_tags` sekaligus. |
| PUT | `/api/posts/:id` | Protected | author (pemilik), admin | Update artikel. Author hanya boleh update artikel miliknya sendiri; admin boleh update semua. |
| DELETE | `/api/posts/:id` | Protected | author (pemilik), admin | Hapus artikel. Author hanya boleh hapus artikel miliknya sendiri; admin boleh hapus semua. |
| GET | `/api/categories` | Public | - | Ambil semua kategori. |
| GET | `/api/tags` | Public | - | Ambil semua tag. |
| GET | `/api/posts/:postId/comments` | Public | - | Ambil komentar dari suatu post. Backend harus mengembalikan format nested array berdasarkan `parent_id`. |
| POST | `/api/comments` | Protected | author, reader, admin | Buat komentar baru. Payload: `post_id`, `content`, opsional `parent_id`. |
| PUT | `/api/comments/:id` | Protected | pemilik komentar, admin | Update komentar milik sendiri. |
| DELETE | `/api/comments/:id` | Protected | pemilik komentar, admin | Hapus komentar milik sendiri; admin boleh hapus semua. |

### 5.1 Response Format Standar

Semua response API mengikuti format konsisten:

```json
// Success
{
  "success": true,
  "message": "Post created successfully",
  "data": { }
}

// Error
{
  "success": false,
  "message": "Validation error",
  "errors": [ { "field": "email", "message": "Email is required" } ]
}
```

HTTP status code convention: `200` OK, `201` Created, `400` Bad Request (validasi), `401` Unauthorized (token invalid/missing), `403` Forbidden (role tidak sesuai), `404` Not Found, `409` Conflict (duplicate), `500` Internal Server Error.

### 5.2 Pagination Response Format

Endpoint `GET /api/posts` mengembalikan metadata pagination:

```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "currentPage": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

### 5.3 Validasi Input

Gunakan library validasi (rekomendasi: **Zod** atau **express-validator**) untuk setiap request body sebelum diproses controller. Contoh field wajib divalidasi: `email` (format email), `password` (min length), `title`/`content` (not empty), `parent_id` (harus ada di tabel comments jika diisi).

### 5.4 Otorisasi & Kepemilikan Resource

- Middleware auth memvalidasi JWT dan melampirkan `req.user` (id, role).
- Middleware role-check (`requireRole(['admin','author'])`) untuk endpoint yang butuh role tertentu.
- Untuk update/delete post & comment, backend wajib mengecek `user_id` pemilik resource sama dengan `req.user.id`, kecuali role `admin`.

## 8. Frontend Routes & Pages (Next.js App Router)

| Route (URL) | Tipe Rendering | Komponen / Deskripsi |
|---|---|---|
| `/` | SSR | Halaman utama, menampilkan daftar artikel terbaru. |
| `/blog/[slug]` | SSR | Halaman baca artikel detail beserta daftar komentar di bawahnya. |
| `/login` & `/register` | CSR | Form otentikasi pengguna. |
| `/dashboard` | CSR (Protected) | Halaman admin/author berisi tabel daftar artikel milik user. |
| `/dashboard/editor` | CSR (Protected) | Form pembuatan artikel. Harus menggunakan pustaka Rich Text Editor (seperti React Quill) dan dropdown multiple select untuk Tag. |

## 9. Nice-to-Have (Opsional, sesuai skala project)

- **Rate limiting** pada endpoint auth (`express-rate-limit`) untuk mencegah brute-force login.
- **Testing strategy** — unit test untuk service/controller (Jest) dan integration test untuk endpoint utama (Supertest).
- **CORS config detail** — whitelist origin frontend secara eksplisit via `CORS_ORIGIN` env, jangan gunakan wildcard `*` di production.
- **Seed data** — script `seed.js` atau tambahan di `init.sql` untuk data dummy (user, kategori, tag, beberapa post) agar memudahkan testing manual.
- **README.md** — instruksi setup: clone, copy `.env.example`, `docker-compose up`, akses aplikasi.

## 10. AI Agent Execution Instructions

Kepada AI Agent: Harap kerjakan project ini secara bertahap dan berurutan sesuai fase berikut. Jangan melompat ke fase selanjutnya sebelum fase sebelumnya selesai dan berjalan tanpa error.

- **Fase 1 (Backend Initialization):** Buat folder `backend`, inisialisasi `package.json`, install Express, MySQL2, JSONWebToken, Bcrypt, Multer, dan library validasi (Zod/express-validator). Buat koneksi database ke `mysql_db`. Siapkan `.env` dan `.env.example` sesuai Bagian 5.
- **Fase 2 (API Implementation):** Implementasikan middleware auth, middleware role-check, middleware error handler global, dan seluruh rute REST API sesuai tabel pada Bagian 7 (termasuk PUT/DELETE dan validasi kepemilikan resource). Terapkan response format standar (Bagian 7.1) dan pagination format (Bagian 7.2).
- **Fase 3 (Frontend Initialization):** Buat folder `frontend` dengan `npx create-next-app@latest`. Konfigurasi environment variables (`NEXT_PUBLIC_API_URL`) untuk menembak ke URL backend.
- **Fase 4 (UI & Integration):** Bangun halaman antarmuka sesuai tabel pada Bagian 8 dan fetch data dari backend API menggunakan Axios atau Fetch API bawaan. Implementasikan form upload gambar (Bagian 6) di halaman editor.
- **Fase 5 (Polish & Optional Enhancements):** Tambahkan item dari Bagian 9 (rate limiting, testing, seed data, README) sesuai kebutuhan.