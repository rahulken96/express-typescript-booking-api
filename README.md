# 🎟️ Production-Grade Robust Booking Engine REST API

[![Node.js Version](https://img.shields.io/badge/Node.js-v22_LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5_Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7_Alpine-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Orchestrated-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![Vitest Passing](https://img.shields.io/badge/Vitest-11%2F11_Passed-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)

> **A Production-Grade, High-Concurrency RESTful Booking Engine API built with Clean 3-Layered Architecture, Strict ACID Concurrency Control (`SELECT ... FOR UPDATE`), Multi-Tier Distributed Redis Rate Limiting, Cache-Aside Read Optimization, Dual-Token JWT Authentication with RBAC, Multi-Stage Docker, and Nginx Reverse Proxy Gateway.**

---

## 📑 Daftar Isi

- [1. Latar Belakang & Matriks Masalah vs Solusi](#1-latar-belakang--matriks-masalah-vs-solusi)
- [2. Arsitektur Sistem & Alur Request (Request Lifecycle)](#2-arsitektur-sistem--alur-request-request-lifecycle)
  - [2.1 Technology Stack & Architectural Decision Record (ADR)](#21-technology-stack--architectural-decision-record-adr)
  - [2.2 Diagram Alur Siklus Request End-to-End](#22-diagram-alur-siklus-request-end-to-end)
  - [2.3 Pembagian Tanggung Jawab Layer (Clean Architecture)](#23-pembagian-tanggung-jawab-layer-clean-architecture)
- [3. Concurrency Control & Database Architecture](#3-concurrency-control--database-architecture)
  - [3.1 Data Dictionary & Skema Relasional](#31-data-dictionary--skema-relasional)
  - [3.2 Skema DDL Database (PostgreSQL)](#32-skema-ddl-database-postgresql)
  - [3.3 Mekanisme Anti Double-Booking (Pessimistic Locking & Timeline)](#33-mekanisme-anti-double-booking-pessimistic-locking--timeline)
  - [3.4 Dual-Layer Concurrency Defense Matrix](#34-dual-layer-concurrency-defense-matrix)
- [4. Strategi Caching & Distributed Rate Limiting](#4-strategi-caching--distributed-rate-limiting)
  - [4.1 Pola Cache-Aside & Invalidation Flow](#41-pola-cache-aside--invalidation-flow)
  - [4.2 Kebijakan Multi-Tier Distributed Rate Limiting](#42-kebijakan-multi-tier-distributed-rate-limiting)
- [5. Keamanan, Autentikasi & Otorisasi](#5-keamanan-autentikasi--otorisasi)
  - [5.1 Alur Autentikasi Stateless Dual-Token (JWT)](#51-alur-autentikasi-stateless-dual-token-jwt)
  - [5.2 Role-Based Access Control (RBAC) Matrix](#52-role-based-access-control-rbac-matrix)
  - [5.3 OWASP Security Hardening via Nginx Gateway](#53-owasp-security-hardening-via-nginx-gateway)
- [6. Topologi Infrastruktur & Jaringan Docker](#6-topologi-infrastruktur--jaringan-docker)
  - [6.1 Diagram Topologi Network Bridge & Port Isolation](#61-diagram-topologi-network-bridge--port-isolation)
  - [6.2 Spesifikasi Service & Container Boundary](#62-spesifikasi-service--container-boundary)
  - [6.3 Multi-Stage Dockerfile Optimization](#63-multi-stage-dockerfile-optimization)
- [7. Spesifikasi Lengkap API & Endpoint Directory](#7-spesifikasi-lengkap-api--endpoint-directory)
  - [7.1 Master Endpoint Directory](#71-master-endpoint-directory)
  - [7.2 Format Standar Response Envelope](#72-format-standar-response-envelope)
  - [7.3 Rincian Spesifikasi & Contoh Payload Tiap Endpoint](#73-rincian-spesifikasi--contoh-payload-tiap-endpoint)
- [8. Automated Testing & Quality Assurance](#8-automated-testing--quality-assurance)
  - [8.1 Matriks Cakupan Test Suite (Vitest + Supertest)](#81-matriks-cakupan-test-suite-vitest--supertest)
  - [8.2 Eksekusi Test Suite](#82-eksekusi-test-suite)
- [9. Konfigurasi Environment Variables](#9-konfigurasi-environment-variables)
- [10. Panduan Instalasi & Menjalankan Sistem (Quick Start)](#10-panduan-instalasi--menjalankan-sistem-quick-start)
- [11. Struktur Direktori Proyek](#11-struktur-direktori-proyek)

---

## 1. Latar Belakang & Matriks Masalah vs Solusi

Aplikasi pemesanan slot waktu (tiket, lapangan olahraga, konsultasi medis) rentan mengalami kegagalan sistem fatal jika dibangun hanya menggunakan pola CRUD konvensional. Project ini dirancang dengan pendekatan *production-first* untuk memitigasi lima risiko kritis backend skala enterprise:

### Tabel 1: Matriks Masalah vs Solusi Arsitektural

| # | Masalah Nyata di Lingkungan Produksi | Dampak Negatif | Solusi Teknis yang Diterapkan | Komponen Terlibat |
|---|---|---|---|---|
| **1** | **Race Condition / Concurrency Collision** (Ribuan user mengklik reservasi slot yang sama dalam milidetik identik). | *Overbooking / Double-Booking* (dua user memiliki tiket pada slot dan waktu yang persis sama). | **ACID Transaction** dengan **Pessimistic Row-Level Locking** (`SELECT ... FOR UPDATE`) + **Partial Unique Index** sebagai jaring pengaman lapis kedua. | `PostgreSQL 16`, `BookingRepository` |
| **2** | **Database I/O Bottleneck pada Read Spikes** (Lonjakan ribuan user membaca daftar slot secara bersamaan). | Beban CPU dan I/O disk database melonjak tinggi $\rightarrow$ Latensi request merosot hingga *timeout*. | Pola **Cache-Aside Pattern** berbasis Redis in-memory dengan TTL 60 detik dan **Auto-Invalidation** saat terjadi mutasi data. | `Redis 7 Alpine`, `BookingService`, `cache.ts` |
| **3** | **Brute-Force Attack & Bot Scalping** (Percobaan tebak password akun & bot pemborong slot). | Akun pengguna dibobol, server kehabisan resource (*Denial of Service*), slot diborong calo. | **Multi-Tier Distributed Rate Limiter** berbasis Redis Store (Global Limiter, Auth Limiter ketat, Booking Limiter). | `express-rate-limit`, `rate-limit-redis`, Redis |
| **4** | **Single-Thread Bottleneck & Port Exposure** (Port Express terekspos langsung ke internet publik). | Rentan serangan *Slowloris*, beban kompresi membebani Node.js Event Loop, port database rentan *port-scanning*. | **Nginx Reverse Proxy** sebagai Bastion Gateway di port 80 publik; Port Express (3000), Postgres (5432), dan Redis (6379) diisolasi di private network bridge. Gzip offloaded ke Nginx. | `Nginx Alpine`, `docker-compose.yml` |
| **5** | **Stateful Session Memory Leak** (Session disimpan di memori proses lokal). | Server tidak bisa di-scale horizontal (*multi-container*) tanpa kehilangan sesi user. | **Stateless Dual-Token JWT** (Short-lived Access Token 15m + Long-lived Refresh Token 7d) + RBAC Middleware. | `jsonwebtoken`, `auth.middleware.ts` |

---

## 2. Arsitektur Sistem & Alur Request (Request Lifecycle)

### 2.1 Technology Stack & Architectural Decision Record (ADR)

### Tabel 2: Komponen Teknologi & Alasan Pemilihan

| Komponen | Versi | Peran Teknis | Justifikasi Arsitektur |
|---|---|---|---|
| **Node.js** | `v22 LTS` | Runtime Engine | Dukungan LTS terbaru, performa V8 engine optimal, native fetch dan Web Streams support. |
| **TypeScript** | `v5.x Strict` | Type Safety | Mengeliminasi kesalahan *undefined runtime errors* pada payload transaksi, standardisasi interface DTO. |
| **Express.js** | `v5.x` | HTTP Web Framework | Framework minimalis dengan native async-error handling di v5 tanpa perlu wrapper *express-async-errors*. |
| **PostgreSQL** | `16 Alpine` | Relational DBMS | Engine ACID terpercaya dengan dukungan row-level locking (`FOR UPDATE`) dan partial unique index yang tangguh. |
| **Redis** | `7 Alpine` | In-Memory Data Store | Kecepatan latensi sub-milidetik untuk distributed cache dan atomic counter distributed rate limiting. |
| **Nginx** | `Alpine` | Reverse Proxy & Gateway | Offloading kompresi Gzip, proteksi Slowloris, security headers, dan isolasi port backend Express. |
| **Docker Compose** | `v2.x` | Orchestration | Menstandarkan environment dev, testing, dan prod dalam 4 container terisolasi satu network bridge. |
| **Vitest + Supertest** | `Latest` | Automated Testing | Kecepatan eksekusi test runner paralel tinggi, kompatibel penuh dengan TypeScript ESM/CJS tanpa compile lambat. |

---

### 2.2 Diagram Alur Siklus Request End-to-End

Berikut adalah alur lengkap perjalanan request dari klien hingga response kembali:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 KLIEN EKSTERNAL                                        │
│                 (Browser Client / Mobile App / QA Engineer / Postman)                  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ [1] HTTP Request (Port 80 Publik)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NGINX REVERSE PROXY                                    │
│  - Gateway Publik Port 80 (Isolasi Port 3000 Express dari Internet Luar)               │
│  - Gzip Compression Level 6 (Kompresi Payload JSON hingga 70%)                         │
│  - Injeksi OWASP Security Headers (X-Frame-Options, X-Content-Type-Options, etc.)      │
│  - Forward Client Identifiers (X-Real-IP, X-Forwarded-For)                             │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ [2] Proxy Pass Internal: http://app:3000
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXPRESS APPLICATION PIPELINE                             │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ A. GLOBAL MIDDLEWARES LAYER                                                      │  │
│  │    ├── express.json() (Parse JSON Request Body)                                  │  │
│  │    └── globalLimiter (100 req / 15 min via Redis Store)                          │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │ [3] Request Valid Lanjut                   │
│                                           ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ B. ROUTING & ACCESS CONTROL GUARD LAYER                                          │  │
│  │    ├── Public Router: /check                                                     │  │
│  │    ├── Auth Router: /api/v1/auth (authLimiter: max 5 req / 5 min)                │  │
│  │    │   └── POST /register, POST /login, GET /profile (authenticate guard)       │  │
│  │    └── Booking Router: /api/v1/booking (bookingLimiter: max 10 req / 1 min)      │  │
│  │        ├── GET / (Public / Cached)                                               │  │
│  │        ├── GET /:id (Public / Cached)                                            │  │
│  │        └── POST / (Protected / Transactional Write)                              │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │ [4] Route Dispath & Context Injection      │
│                                           ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ C. CONTROLLER LAYER (HTTP Interface & Transport Adapter)                         │  │
│  │    ├── Ekstraksi Payload DTO (req.body, req.params, req.user)                    │  │
│  │    ├── Panggil Service Method yang Relevan                                       │  │
│  │    └── Return Response Envelope: res.status(200|201).json({ status, data })      │  │
│  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
│                                           │ [5] Delegasi Logika Bisnis                 │
│                                           ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ D. SERVICE LAYER (Domain Business Logic & Cache Coordinator)                     │  │
│  │    ├── Cache-Aside Evaluation: Cek Redis apakah key 'bookings:all' tersedia      │  │
│  │    ├── Password Hashing (Bcrypt 10 rounds) & JWT Token Signing                   │  │
│  │    └── Mutasi Data: Panggil Repo Transaction & Jalankan Invalidate Cache         │  │
│  └──────────────────────────────┬───────────────────┬───────────────────────────────┘  │
│                                 │                   │                                  │
│             [6A] Cache Hit      │                   │ [6B] Cache Miss / Write Query    │
│            (< 5ms Response)     │                   │                                  │
│                                 ▼                   ▼                                  │
│                 ┌───────────────────────┐   ┌───────────────────────────────────────┐  │
│                 │ REDIS IN-MEMORY STORE │   │ E. REPOSITORY LAYER (Raw SQL Driver)  │  │
│                 │ - Rate Limit Counters │   │    ├── Pinjam Client dari pg.Pool     │  │
│                 │ - Cache Query JSON    │   │    ├── BEGIN Transaction              │  │
│                 │   (TTL: 60 Detik)     │   │    ├── SELECT ... FOR UPDATE (Lock)   │  │
│                 └───────────────────────┘   │    ├── INSERT / UPDATE Record         │  │
│                                             │    ├── COMMIT / ROLLBACK              │  │
│                                             │    └── client.release() (No Leak)     │  │
│                                             └───────────────────┬───────────────────┘  │
│                                                                 │                      │
└─────────────────────────────────────────────────────────────────┼──────────────────────┘
                                                                  │ [7] Database Operations
                                                                  ▼
                                              ┌───────────────────────────────────────┐
                                              │      POSTGRESQL 16 ACID DATABASE      │
                                              │  - Tabel 'users'                      │
                                              │  - Tabel 'bookings'                   │
                                              │  - Constraint: unique_active_slot     │
                                              └───────────────────────────────────────┘
```

---

### 2.3 Pembagian Tanggung Jawab Layer (Clean Architecture)

### Tabel 3: Spesifikasi Tanggung Jawab 3-Layered Architecture

| Layer | File / Lokasi | Tanggung Jawab Utama | Hal yang DILARANG di Layer Ini |
|---|---|---|---|
| **Controller** | `src/controllers/` | Menerima object `Request`, mengekstrak parameter HTTP, menentukan HTTP Status Code, merespons `Response` JSON. | **DILARANG** menulis query SQL atau aturan bisnis logika validasi data langsung. |
| **Service** | `src/services/` | Mengatur aturan bisnis (apakah user boleh booking, hash password, orkestrasi cache Redis, invalidasi cache). | **DILARANG** membaca langsung object `req` / `res` HTTP Express atau mengeksekusi koneksi raw SQL. |
| **Repository** | `src/repositories/` | Murni berkomunikasi dengan database engine via SQL Driver (`pg.Pool`). Mengatur transaksi `BEGIN`, `COMMIT`, `ROLLBACK`, dan row locking. | **DILARANG** melakukan hashing password atau manipulasi response HTTP. |
| **Middlewares** | `src/middlewares/` | Cross-cutting concerns: Validasi JWT token, verifikasi role, pembatasan rate limit, penangkapan error global (*Centralized Error Handler*). | **DILARANG** menjalankan operasi mutasi database domain. |

---

## 3. Concurrency Control & Database Architecture

### 3.1 Data Dictionary & Skema Relasional

Sistem menggunakan database relasional PostgreSQL 16 dengan dua tabel inti: `users` dan `bookings`.

#### Tabel 3A: Skema Tabel `users`

| Nama Kolom | Tipe Data | Nullable | Default | Keterangan & Constraints |
|---|---|---|---|---|
| `id` | `VARCHAR(100)` | **NO** | *None* | Primary Key (UUID format string / timestamp-based identifier). |
| `name` | `VARCHAR(100)` | **NO** | *None* | Nama lengkap pengguna. |
| `email` | `VARCHAR(150)` | **NO** | *None* | **UNIQUE Constraint**: Mencegah duplikasi akun pengguna. |
| `password` | `VARCHAR(255)` | **NO** | *None* | Hash password menggunakan Bcrypt (cost factor 10). |
| `role` | `VARCHAR(20)` | **NO** | `'USER'` | Hak akses otorisasi (`'ADMIN'` atau `'USER'`). |
| `created_at` | `TIMESTAMP` | **YES** | `CURRENT_TIMESTAMP` | Waktu registrasi pengguna. |
| `updated_at` | `TIMESTAMP` | **YES** | `CURRENT_TIMESTAMP` | Waktu pembaruan profil pengguna. |

#### Tabel 3B: Skema Tabel `bookings`

| Nama Kolom | Tipe Data | Nullable | Default | Keterangan & Constraints |
|---|---|---|---|---|
| `id` | `VARCHAR(100)` | **NO** | *None* | Primary Key (Identifier unik reservasi). |
| `user_id` | `VARCHAR(100)` | **NO** | *None* | Foreign Key reference ke `users(id)`. |
| `slot_time` | `VARCHAR(50)` | **NO** | *None* | String penanda waktu slot (contoh: `"2026-09-10 10:00"`). |
| `status` | `VARCHAR(20)` | **NO** | `'CONFIRMED'` | Status reservasi (`'CONFIRMED'`, `'CANCELLED'`, `'PENDING'`). |
| `created_at` | `TIMESTAMP` | **YES** | `CURRENT_TIMESTAMP` | Timestamp pembuatan booking. |
| `updated_at` | `TIMESTAMP` | **YES** | `CURRENT_TIMESTAMP` | Timestamp modifikasi terakhir booking. |

---

### 3.2 Skema DDL Database (PostgreSQL)

Script DDL lengkap yang dieksekusi secara otomatis melalui script migrasi (`src/databases/migrate.ts`):

```sql
-- 1. Inisialisasi Tabel Pengguna (users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inisialisasi Tabel Pemesanan (bookings)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Jaring Pengaman Concurrency: Unique Constraint pada Slot Waktu Aktif
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS unique_active_slot;

ALTER TABLE bookings 
ADD CONSTRAINT unique_active_slot UNIQUE (slot_time);
```

---

### 3.3 Mekanisme Anti Double-Booking (Pessimistic Locking & Timeline)

Tantangan terbesar sistem booking adalah **Race Condition**: dua request tiba pada milidetik yang sama untuk slot waktu identik (`slot_time = "2026-09-10 10:00"`).

Tanpa mekanisme locking, kedua transaksi akan sama-sama membaca bahwa slot masih kosong, dan keduanya akan berhasil melakukan `INSERT`, mengakibatkan **Double-Booking**.

Project ini menerapkan **ACID Transaction dengan Row-Level Pessimistic Locking (`SELECT ... FOR UPDATE`)**:

### Tabel 4: Timeline Eksekusi Concurrency (User A vs User B)

| Timeline | Transaksi User A (Tiba di T0) | Transaksi User B (Tiba di T0 + 1ms) | Kondisi Internal Database Engine (PostgreSQL) |
|---|---|---|---|
| **T0** | `BEGIN;` | `BEGIN;` | Kedua sesi membuka isolasi transaksi independen. |
| **T1** | `SELECT id FROM bookings WHERE slot_time = '10:00' AND status != 'CANCELLED' FOR UPDATE;` | Mengirim query yang sama persis: `SELECT ... FOR UPDATE;` | **User A memperoleh Exclusive Row Lock**. User B dipaksa antre (*BLOCKED/WAITING* oleh database engine). |
| **T2** | Evaluasi hasil: Slot masih kosong (0 baris). | *(Menunggu User A merilis lock...)* | PostgreSQL menahan koneksi User B tanpa mengeksekusi langkah berikutnya. |
| **T3** | `INSERT INTO bookings (id, user_id, slot_time, status) VALUES (...);` | *(Masih terblokir...)* | User A menulis baris reservasi baru ke dalam write-buffer transaksi A. |
| **T4** | `COMMIT;` *(Transaksi A Selesai)* | Lock dilepas oleh User A. Query User B langsung tereksekusi seketika. | **Kunci dilepas.** Transaksi User B langsung membaca data terbaru yang baru saja di-commit User A! |
| **T5** | Menerima HTTP **`201 Created`** (Sukses Booking). | Hasil evaluasi User B: Baris ditemukan! Service melempar error `SLOT_ALREADY_BOOKED`. | Transaksi B menjalankan `ROLLBACK;` dan melepaskan koneksi pool. |
| **T6** | - | Menerima HTTP **`409 Conflict`** (`"Slot waktu sudah terisi sebelumnya"`). | **Integritas Data Terjaga 100% (No Double-Booking).** |

---

### 3.4 Dual-Layer Concurrency Defense Matrix

Untuk menjamin ketiadaan celah (*zero-tolerance failure*), sistem menerapkan strategi pertahanan ganda:

```text
[ Incoming Request: POST /api/v1/booking ]
                   │
                   ▼
┌────────────────────────────────────────────────────────┐
│ LAPIS 1: APPLICATION-LEVEL PESSIMISTIC LOCKING        │
│  - Eksekusi: BEGIN -> SELECT ... FOR UPDATE            │
│  - Menahan thread kedua hingga transaksi pertama selesai│
│  - Tangkapan Error: 'SLOT_ALREADY_BOOKED'              │
│  - HTTP Status: 409 Conflict                           │
└──────────────────────────┬─────────────────────────────┘
                           │ Lolos jika terjadi anomali isolasi
                           ▼
┌────────────────────────────────────────────────────────┐
│ LAPIS 2: DATABASE-LEVEL UNIQUE CONSTRAINT              │
│  - Skema: CONSTRAINT unique_active_slot UNIQUE(slot)   │
│  - PostgreSQL Engine melempar error code 23505         │
│  - Tangkapan Error di Middleware: err.code === '23505' │
│  - HTTP Status: 409 Conflict                           │
└────────────────────────────────────────────────────────┘
```

---

## 4. Strategi Caching & Distributed Rate Limiting

### 4.1 Pola Cache-Aside & Invalidation Flow

Pembacaan daftar booking (`GET /api/v1/booking`) dioptimasi menggunakan pola **Cache-Aside** dengan Redis in-memory store:

```text
               [ Request GET /api/v1/booking ]
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ Cek Key 'bookings:all'   │
                 │ di Redis In-Memory       │
                 └────────────┬─────────────┘
                              │
             ┌────────────────┴────────────────┐
      [ Key Ada ]                        [ Key Tidak Ada ]
     (Cache HIT)                           (Cache MISS)
           │                                     │
           ▼                                     ▼
┌────────────────────────┐             ┌────────────────────────┐
│ Langsung ambil data    │             │ Query ke PostgreSQL    │
│ dari RAM Redis (<5ms)  │             │ Repository (Disk I/O)  │
└──────────┬─────────────┘             └──────────┬─────────────┘
           │                                      │
           │                           ┌──────────┴─────────────┐
           │                           │ Simpan hasil ke Redis  │
           │                           │ (Key: 'bookings:all',  │
           │                           │  TTL: 60 detik)        │
           │                           └──────────┬─────────────┘
           │                                      │
           └──────────────────┬───────────────────┘
                              │
                              ▼
                 [ Return Response Data JSON ]
```

#### Mekanisme Cache Invalidation:
Ketika ada transaksi baru yang berhasil (`POST /api/v1/booking`), service secara atomik menjalankan:
```typescript
await invalidateCache("bookings:all");
```
Hal ini menjamin pengguna tidak akan pernah membaca data usang (*stale data*) pada request berikutnya.

---

### 4.2 Kebijakan Multi-Tier Distributed Rate Limiting

Rate Limiter dikonfigurasi secara terpusat (*Distributed State*) menggunakan library `rate-limit-redis`. State counter disimpan langsung di Redis engine menggunakan prefix khusus:

### Tabel 5: Matriks Kebijakan Rate Limiting

| Limiter Name | Middleware | Endpoint Target | Limit Kuota | Window Time | Redis Key Prefix | Tujuan Proteksi |
|---|---|---|---|---|---|---|
| **Global Limiter** | `globalLimiter` | Seluruh Route (`/*`) | 100 request | 15 Menit | `rl:global:<ip>` | Mencegah flood HTTP DoS massal di level aplikasi. |
| **Auth Limiter** | `authLimiter` | `/api/v1/auth/login`<br>`/api/v1/auth/register` | **5 request** | 5 Menit | `rl:auth:<ip>` | Proteksi ketat terhadap serangan Brute-Force Password & Credential Stuffing. |
| **Booking Limiter** | `bookingLimiter` | `/api/v1/booking` (`POST`) | **10 request** | 1 Menit | `rl:booking:<ip>` | Mencegah bot calo/scalper memborong slot secara beruntun. |

> **Distributed Benefit:** Jika aplikasi Express di-scale horizontal menjadi 5 container di belakang load balancer, seluruh container berbagi counter Redis yang sama, sehingga kuota limit pengguna tidak bertambah.

---

## 5. Keamanan, Autentikasi & Otorisasi

### 5.1 Alur Autentikasi Stateless Dual-Token (JWT)

```text
[ KLIEN ]                                                 [ SERVER (Express + JWT) ]
    │                                                                  │
    │ ─── 1. POST /api/v1/auth/login (email, password) ──────────────> │
    │                                                                  │ Verifikasi Bcrypt Hash
    │ <── 2. Return { accessToken (15m), refreshToken (7d) } ──────── │ Generate Signed JWTs
    │                                                                  │
    │                                                                  │
    │ ─── 3. GET /api/v1/auth/profile ───────────────────────────────> │
    │        Header: Authorization: Bearer <accessToken>               │ Verifikasi JWT Signature
    │ <── 4. Return 200 OK + Data User Payload ─────────────────────── │ req.user = decodedToken
```

- **Password Hashing:** Menggunakan `bcrypt` dengan 10 salt rounds untuk mencegah serangan rainbow table.
- **Access Token:** Umur pendek (**15 menit**), berisi claims `{ id, email, role }`.
- **Refresh Token:** Umur panjang (**7 hari**), digunakan untuk memperbarui access token tanpa re-login.

---

### 5.2 Role-Based Access Control (RBAC) Matrix

### Tabel 6: Matriks Akses Role & Hak Akses Endpoint

| Endpoint API | Method | Role Public | Role USER | Role ADMIN | Keterangan |
|---|---|:---:|:---:|:---:|---|
| `/check` | `GET` | ✅ | ✅ | ✅ | Public health check. |
| `/api/v1/auth/register` | `POST` | ✅ | ✅ | ✅ | Pendaftaran akun baru. |
| `/api/v1/auth/login` | `POST` | ✅ | ✅ | ✅ | Autentikasi & perolehan token. |
| `/api/v1/auth/profile` | `GET` | ❌ | ✅ | ✅ | Wajib Bearer Token valid. |
| `/api/v1/booking` | `GET` | ✅ | ✅ | ✅ | Menampilkan daftar slot booking (Cached). |
| `/api/v1/booking/:id` | `GET` | ✅ | ✅ | ✅ | Menampilkan detail 1 booking (Cached). |
| `/api/v1/booking` | `POST` | ❌ | ✅ | ✅ | Membuat reservasi slot (Lock Protected). |

---

### 5.3 OWASP Security Hardening via Nginx Gateway

Nginx dikonfigurasi sebagai front-line shield untuk menyaring ancaman sebelum mencapai proses Node.js:

```nginx
# Konfigurasi Header Keamanan OWASP di nginx/default.conf
add_header X-Frame-Options "DENY" always;                # Anti-Clickjacking
add_header X-Content-Type-Options "nosniff" always;      # Anti-MIME Sniffing
add_header X-XSS-Protection "1; mode=block" always;      # Filter XSS Legacy
add_header Referrer-Policy "no-referrer-when-downgrade" always;
server_tokens off;                                       # Sembunyikan versi Nginx
```

---

## 6. Topologi Infrastruktur & Jaringan Docker

### 6.1 Diagram Topologi Network Bridge & Port Isolation

```text
               INTERNET PUBLIK / KLIEN LUAR
                            │
                            │ Akses: http://localhost:80 (Port 80 Publik)
                            ▼
 ╔═════════════════════════════════════════════════════════════════════╗
 ║ DOCKER BRIDGE NETWORK: express_booking_net                          ║
 ║                                                                     ║
 ║   ┌──────────────────────────┐                                      ║
 ║   │ CONTAINER 1: nginx       │                                      ║
 ║   │ Port Host: 80:80         │                                      ║
 ║   │ Port Internal: 80        │                                      ║
 ║   └─────────────┬────────────┘                                      ║
 ║                 │                                                   ║
 ║                 │ Forward Internal: http://express-booking-api:3000 ║
 ║                 ▼                                                   ║
 ║   ┌──────────────────────────┐                                      ║
 ║   │ CONTAINER 2: app         │ (Port 3000 Terisolasi di Private Net,║
 ║   │ Image: express-booking   │  TIDAK BISA diakses dari host luar)  ║
 ║   └──────┬─────────────┬─────┘                                      ║
 ║          │             │                                            ║
 ║          │             │ Internal TCP: redis:6379                   ║
 ║          │             ▼                                            ║
 ║          │    ┌──────────────────────────┐                          ║
 ║          │    │ CONTAINER 3: redis       │ (Port 6379 Terisolasi,   ║
 ║          │    │ Volume: redis_data       │  Bebas dari port host)   ║
 ║          │    └──────────────────────────┘                          ║
 ║          │                                                          ║
 ║          │ Internal TCP: postgres:5432                              ║
 ║          ▼                                                          ║
 ║   ┌──────────────────────────┐                                      ║
 ║   │ CONTAINER 4: postgres    │ (Port 5432 terekspos untuk Dev Tool/ ║
 ║   │ Volume: postgres_data    │  DBeaver lokal)                      ║
 ║   └──────────────────────────┘                                      ║
 ╚═════════════════════════════════════════════════════════════════════╝
```

---

### 6.2 Spesifikasi Service & Container Boundary

### Tabel 7: Spesifikasi Container & Port Mapping

| Service Name | Docker Image Base | Port Host | Port Container | Kebijakan Isolasi Jaringan | Volume Mount Persisten |
|---|---|:---:|:---:|---|---|
| **`nginx`** | `nginx:alpine` | **`80:80`** | `80` | **Public Facing Gateway**. Satu-satunya pintu masuk traffic HTTP. | `./nginx/default.conf` (Read-only) |
| **`app`** | Custom Multi-Stage | *None* | `3000` | **Private Isolated (`expose: 3000`)**. Hanya bisa dihubungi oleh Nginx. | None (Stateless Container) |
| **`redis`** | `redis:7-alpine` | *None* | `6379` | **Private Isolated**. Komunikasi eksklusif dengan container `app`. | `redis_data` $\rightarrow$ `/data` |
| **`postgres`** | `postgres:16-alpine` | `5432:5432` | `5432` | Port 5432 dibuka ke host untuk memudahkan manajemen query dev. | `postgres_data` $\rightarrow$ `/var/lib/postgresql/data` |

---

### 6.3 Multi-Stage Dockerfile Optimization

Dockerfile dibangun dalam 2 tahapan (*Multi-Stage Build*) untuk menghasilkan image akhir yang sangat ramping dan aman:
1. **Stage 1 (Builder):** Menggunakan `node:22-alpine`, menginstall semua dependencies (termasuk `devDependencies`), dan mengompilasi TypeScript menjadi JavaScript (`npm run build`).
2. **Stage 2 (Runner):** Hanya menyalin folder `dist/` dan dependencies produksi (`node_modules` prod saja). Menggunakan non-root user demi keamanan runtime. Ukuran image terpangkas hingga **~60MB**.

---

## 7. Spesifikasi Lengkap API & Endpoint Directory

### 7.1 Master Endpoint Directory

Base URL: `http://localhost` *(Melalui Nginx Reverse Proxy)*

### Tabel 8: Direktori Master Endpoint API

| Method | Endpoint | Akses | Rate Limit | Caching | Request Body | Response Sukses | Response Error | Fungsi Bisnis |
|:---:|---|:---:|:---:|:---:|---|:---:|:---:|---|
| `GET` | `/check` | Public | Global | No-Cache | None | `200 OK` | `429` | Health check ketersediaan server. |
| `POST` | `/api/v1/auth/register` | Public | Auth (5/5m) | No-Cache | JSON (`name, email, password`) | `201 Created` | `400`, `409`, `429` | Registrasi akun pengguna baru. |
| `POST` | `/api/v1/auth/login` | Public | Auth (5/5m) | No-Cache | JSON (`email, password`) | `200 OK` | `401`, `429` | Autentikasi dan penerbitan Access & Refresh Token. |
| `GET` | `/api/v1/auth/profile` | Bearer | Global | No-Cache | None | `200 OK` | `401`, `429` | Membaca profil user dari token JWT aktif. |
| `GET` | `/api/v1/booking` | Public | Global | **Redis (60s)** | None | `200 OK` | `429` | Mengambil seluruh daftar booking aktif. |
| `GET` | `/api/v1/booking/:id` | Public | Global | **Redis (60s)** | None (Path Params: `id`) | `200 OK` | `404`, `429` | Mengambil detail satu reservasi booking by ID. |
| `POST` | `/api/v1/booking` | Public/Auth | Booking (10/1m) | **Invalidate** | JSON (`userId, slotTime`) | `201 Created` | `409`, `429` | Reservasi slot dengan proteksi ACID Concurrency Lock. |

---

### 7.2 Format Standar Response Envelope

Seluruh response HTTP distandarisasi menggunakan format Envelope JSON:

#### Format Sukses (`status: "success"`):
```json
{
  "status": "success",
  "message": "Deskripsi aksi berhasil (opsional)",
  "data": {}
}
```

#### Format Gagal / Validasi / Conflict (`status: "fail"`):
```json
{
  "status": "fail",
  "message": "Pesan deskriptif penyebab kegagalan"
}
```

#### Format Internal Server Error (`status: "error"`):
```json
{
  "status": "error",
  "message": "Masalah Server Tidak Diketahui"
}
```

---

### 7.3 Rincian Spesifikasi & Contoh Payload Tiap Endpoint

#### 1. System Health Check
- **Route:** `GET /check`
- **Headers:** Tidak dibutuhkan
- **Contoh Request cURL:**
  ```bash
  curl -i http://localhost/check
  ```
- **Contoh Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Server jalan bosss!",
    "timestamp": "2026-09-10T08:00:00.000Z",
    "datetime": "10/9/2026, 15.00.00 (Timezone: Asia/Jakarta)"
  }
  ```

---

#### 2. Registrasi Pengguna Baru
- **Route:** `POST /api/v1/auth/register`
- **Headers:** `Content-Type: application/json`
- **Request Body Payload:**
  ```json
  {
    "name": "Alex Pratama",
    "email": "alex@example.com",
    "password": "Password123!",
    "role": "USER"
  }
  ```
- **Contoh Response Sukses (`201 Created`):**
  ```json
  {
    "status": "success",
    "message": "Registrasi berhasil",
    "data": {
      "user": {
        "id": "1725950000000",
        "name": "Alex Pratama",
        "email": "alex@example.com",
        "role": "USER"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```

---

#### 3. Login Pengguna
- **Route:** `POST /api/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Request Body Payload:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "user": {
        "id": "1725950000000",
        "name": "Alex Pratama",
        "email": "alex@example.com",
        "role": "USER"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```
- **Contoh Response Gagal (`401 Unauthorized`):**
  ```json
  {
    "status": "fail",
    "message": "Email atau password salah!"
  }
  ```

---

#### 4. Akses Profil Terproteksi (Protected Route)
- **Route:** `GET /api/v1/auth/profile`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Contoh Request cURL:**
  ```bash
  curl -i -H "Authorization: Bearer eyJhbGciOi..." http://localhost/api/v1/auth/profile
  ```
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": {
      "userId": "1725950000000",
      "email": "alex@example.com",
      "role": "USER",
      "iat": 1725950000,
      "exp": 1725950900
    }
  }
  ```
- **Contoh Response Gagal (`401 Unauthorized`):**
  ```json
  {
    "status": "fail",
    "message": "Token tidak valid atau telah kedaluwarsa"
  }
  ```

---

#### 5. Pembuatan Reservasi Booking (Anti-Concurrency Lock)
- **Route:** `POST /api/v1/booking`
- **Headers:** `Content-Type: application/json`
- **Request Body Payload:**
  ```json
  {
    "userId": "1725950000000",
    "slotTime": "2026-09-10 10:00"
  }
  ```
- **Contoh Response Sukses (`201 Created`):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "1725950123456",
      "userId": "1725950000000",
      "slotTime": "2026-09-10 10:00",
      "status": "CONFIRMED",
      "createdAt": "2026-09-10T08:02:03.000Z",
      "updatedAt": "2026-09-10T08:02:03.000Z"
    }
  }
  ```
- **Contoh Response Konflik Concurrency (`409 Conflict`):**
  ```json
  {
    "status": "fail",
    "message": "Slot waktu sudah terisi sebelumnya"
  }
  ```

---

#### 6. Membaca Seluruh Daftar Booking (Cached Read)
- **Route:** `GET /api/v1/booking`
- **Headers:** Tidak dibutuhkan
- **Karakteristik:** Eksekusi pertama membaca PostgreSQL (Cache Miss), request berulang selama 60 detik langsung disajikan dari RAM Redis dalam waktu **< 5 milidetik**.
- **Contoh Response (`200 OK`):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "1725950123456",
        "userId": "1725950000000",
        "slotTime": "2026-09-10 10:00",
        "status": "CONFIRMED",
        "createdAt": "2026-09-10T08:02:03.000Z",
        "updatedAt": "2026-09-10T08:02:03.000Z"
      }
    ]
  }
  ```

---

## 8. Automated Testing & Quality Assurance

Project divalidasi melalui serangkaian automated test komprehensif menggunakan framework **Vitest** dan **Supertest**. Pengujian mencakup pengujian unit (unit tests dengan mocking) dan pengujian integrasi end-to-end (integration tests).

### 8.1 Matriks Cakupan Test Suite (Vitest + Supertest)

### Tabel 10: Matriks Cakupan Pengujian Otomatis

| Kategori Test | File Pengujian | Skenario Uji | Validasi / Assertions | Status |
|---|---|---|---|:---:|
| **Integration** | `tests/integration/booking.api.test.ts` | `GET /api/v1/booking` | Status `200 OK`, envelope `status: success`, data bertipe array. | ✅ PASS |
| **Integration** | `tests/integration/booking.api.test.ts` | `GET /check` | Status `200 OK`, properti `message` server status ada. | ✅ PASS |
| **Integration** | `tests/integration/auth.api.test.ts` | `POST /api/v1/auth/register` | Status `201 Created`, token JWT dan data user terbentuk. | ✅ PASS |
| **Integration** | `tests/integration/auth.api.test.ts` | `POST /api/v1/auth/login` | Status `200 OK`, kredensial cocok, access & refresh token valid. | ✅ PASS |
| **Integration** | `tests/integration/auth.api.test.ts` | `GET /api/v1/auth/profile` (No Token) | Status `401 Unauthorized`, request tanpa header Authorization diblokir. | ✅ PASS |
| **Integration** | `tests/integration/auth.api.test.ts` | `GET /api/v1/auth/profile` (With Token) | Status `200 OK`, pembacaan claims `userId` dari JWT terverifikasi. | ✅ PASS |
| **Unit Test** | `tests/unit/booking.service.test.ts` | `getAllBookings()` (Happy Path) | Cache fetcher terpanggil, data array booking dari repo kembali utuh. | ✅ PASS |
| **Unit Test** | `tests/unit/booking.service.test.ts` | `getBookingById()` (Negative Path) | Melempar error `BOOKING_NOT_FOUND` jika record ID tidak ada di DB. | ✅ PASS |
| **Unit Test** | `tests/unit/booking.service.test.ts` | `createBooking()` (Transaction Path) | Menjalankan `createTransactional()` dan trigger cache invalidation. | ✅ PASS |
| **Unit Test** | `tests/unit/auth.service.test.ts` | `register()` (Duplicate Email) | Melempar error `EMAIL_ALREADY_EXISTS` jika email sudah ada. | ✅ PASS |
| **Unit Test** | `tests/unit/auth.service.test.ts` | `register()` (Happy Path) | Data user tersimpan, token `accessToken` & `refreshToken` ter-generate. | ✅ PASS |

---

### 8.2 Eksekusi Test Suite

```bash
# Menjalankan seluruh test suite secara otomatis:
npm run test

# Menjalankan test dalam mode pantau (watch mode):
npm run test:watch

# Menghasilkan laporan coverage pengujian kode:
npm run test:coverage
```

---

## 9. Konfigurasi Environment Variables

Seluruh variabel konfigurasi sensitif dipisahkan dari codebase dan dideklarasikan melalui file `.env`. Gunakan `.env.example` sebagai referensi:

### Tabel 11: Dokumentasi Variabel Lingkungan (.env)

| Nama Variabel | Tipe Data | Contoh Nilai Default | Keterangan & Tujuan |
|---|---|---|---|
| `PORT` | `Number` | `3000` | Port internal tempat Express server mendengarkan koneksi. |
| `NODE_ENV` | `String` | `production` / `dev` | Mode lingkungan aplikasi (`dev` mengaktifkan bypass rate limiter saat testing). |
| `DB_HOST` | `String` | `postgres` (Docker) / `localhost` | Hostname koneksi database PostgreSQL. |
| `DB_PORT` | `Number` | `5432` | Port listener database PostgreSQL. |
| `DB_USER` | `String` | `postgres` | Username kredensial PostgreSQL. |
| `DB_PASSWORD` | `String` | `postgres` | Password kredensial PostgreSQL. |
| `DB_NAME` | `String` | `booking_engine_db` | Nama database relasional. |
| `REDIS_HOST` | `String` | `redis` (Docker) / `localhost` | Hostname koneksi database Redis. |
| `REDIS_PORT` | `Number` | `6379` | Port listener Redis in-memory. |
| `JWT_SECRET` | `String` | `supersecret_access_key` | Secret key enkripsi penandatanganan Access Token. |
| `JWT_REFRESH_SECRET` | `String` | `supersecret_refresh_key` | Secret key enkripsi penandatanganan Refresh Token. |
| `EXPIRED_ACCESS_TOKEN` | `String` | `15m` | Jangka waktu masa aktif Access Token (15 menit). |
| `EXPIRED_REFRESH_TOKEN` | `String` | `7d` | Jangka waktu masa aktif Refresh Token (7 hari). |

---

## 10. Panduan Instalasi & Menjalankan Sistem (Quick Start)

### Metode 1: Menggunakan Docker Compose (Direkomendasikan)

Metode ini akan mengorkestrasikan Nginx, Express App, PostgreSQL, dan Redis secara otomatis:

```bash
# 1. Clone repository dari GitHub
git clone https://github.com/username/express-booking-engine-api.git
cd express-booking-engine-api

# 2. Siapkan file konfigurasi environment
cp .env.example .env

# 3. Bangun dan jalankan seluruh container di background
docker compose up -d --build

# 4. Jalankan script migrasi skema database di dalam container aplikasi
docker compose exec app node dist/databases/migrate.js

# 5. Uji verifikasi gateway Nginx
curl -i http://localhost/check
```

---

### Metode 2: Menjalankan Secara Manual (Bare-Metal / Local Dev)

Pastikan service PostgreSQL lokal (Port 5432) dan Redis lokal (Port 6379) sudah berjalan di sistem Anda:

```bash
# 1. Install seluruh package dependencies
npm install

# 2. Siapkan file .env lokal
cp .env.example .env

# 3. Jalankan migrasi database
npx tsx src/databases/migrate.ts

# 4. Jalankan server dalam mode development (Hot-Reload)
npm run dev
```

---

## 11. Struktur Direktori Proyek

```text
express-booking-engine-api/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD Automated Pipeline (Lint, Build, Test)
├── docs/
│   └── walkthrough_sprint_14_hari.md # Catatan Arsitektural & Jurnal Sprint 14 Hari
├── nginx/
│   └── default.conf              # Reverse Proxy Config, Gzip, & OWASP Headers
├── src/
│   ├── config/
│   │   ├── database.ts           # pg.Pool PostgreSQL Client Pool
│   │   └── redis.ts              # ioredis In-Memory Client
│   ├── controllers/
│   │   ├── auth.controller.ts    # Transport Handler Register, Login, Profile
│   │   └── booking.controller.ts # Transport Handler Create & Get Bookings
│   ├── databases/
│   │   └── migrate.ts            # DDL Migration Script (Table & Constraints)
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # JWT Authenticate Guard & RBAC Authorizer
│   │   ├── error.middleware.ts   # Centralized Global Error Handler (Anti-Crash)
│   │   └── rateLimiter.middleware.ts # Multi-Tier Distributed Rate Limiter
│   ├── repositories/
│   │   ├── booking.repository.ts # Raw SQL ACID Transactions & SELECT FOR UPDATE
│   │   └── user.repository.ts    # Raw SQL User Operations
│   ├── routes/
│   │   ├── auth.routes.ts        # Routing Endpoint Autentikasi
│   │   ├── booking.routes.ts     # Routing Endpoint Reservasi Booking
│   │   └── index.ts              # Router Agregator Express
│   ├── services/
│   │   ├── auth.service.ts       # Logika Bisnis Auth, Bcrypt, & JWT Signing
│   │   └── booking.service.ts    # Logika Bisnis Booking & Cache-Aside Invalidation
│   ├── types/
│   │   ├── auth.types.ts         # Interface User, RegisterDTO, LoginDTO, Tokens
│   │   ├── booking.types.ts      # Interface Booking & CreateBookingDTO
│   │   └── express.d.ts          # Express Request Type Expansion (req.user)
│   ├── utils/
│   │   └── cache.ts              # Helper Reusable Cache-Aside & Invalidation
│   └── app.ts                    # Inisialisasi Express & Middleware Agregator
├── tests/
│   ├── integration/
│   │   ├── auth.api.test.ts      # Integration Test Alur Autentikasi E2E
│   │   └── booking.api.test.ts   # Integration Test Alur Booking & Concurrency
│   └── unit/
│       ├── auth.service.test.ts  # Unit Test Logika Bisnis Auth Service
│       └── booking.service.test.ts # Unit Test Logika Bisnis Booking Service
├── Dockerfile                    # Multi-Stage Build Image (~60MB Size)
├── docker-compose.yml            # Multi-Container Orchestration
├── vitest.config.ts              # Konfigurasi Testing Runner Vitest
├── tsconfig.json                 # Konfigurasi Compiler TypeScript Strict
├── .dockerignore                 # Filter Konteks Docker Daemon
├── .gitignore                    # Proteksi Credential & Dependencies Git
├── .env.example                  # Template Variabel Environment
└── package.json                  # Dependencies & Script Manajemen Proyek
```

### Tabel 12: Deskripsi Pembagian Tanggung Jawab Direktori

| Direktori | Tanggung Jawab Teknis |
|---|---|
| `nginx/` | Konfigurasi reverse proxy, SSL termination, offloading kompresi Gzip, dan security header. |
| `src/config/` | Inisialisasi koneksi pool database relasional (`pg`) dan client in-memory (`ioredis`). |
| `src/controllers/` | Menerima request HTTP, mengekstrak DTO, memanggil service layer, dan merespon JSON envelope. |
| `src/databases/` | Script DDL database migrasi untuk pembuatan tabel dan penambahan index / constraint ACID. |
| `src/middlewares/` | Penjaga gerbang request: verifikasi JWT bearer token, otorisasi RBAC, rate limiter, penanganan error terpusat. |
| `src/repositories/` | Murni menjalankan query raw SQL, transaksi atomik (`BEGIN/COMMIT/ROLLBACK`), dan row locking (`FOR UPDATE`). |
| `src/services/` | Otak logika bisnis aplikasi, koordinasi cache Redis, hashing password, dan kalkulasi aturan bisnis. |
| `src/types/` | Kontrak tipe data TypeScript, DTO input form, dan perluasan tipe native Express (`req.user`). |
| `src/utils/` | Fungsi pembantu umum independen, seperti fungsi pembungkus Cache-Aside Redis. |
| `tests/` | Otomasi pengujian software (Unit Testing & Integration Testing) menjamin stabilitas sistem. |
