# Sprint Production-grade Backend 14 Hari (2 Minggu)

> **Target Akhir:** Membangun *Production-Ready Booking API* (Node.js + TypeScript + PostgreSQL + JWT/RBAC + Redis + Testing + Docker + CI/CD + Deploy).

---

## 1. Peta Rencana Harian (Hari 1–14)

| Hari | Fase | Topik Utama | Target Output |
|---|---|---|---|
| **H1** | Fondasi | Node.js + TypeScript Setup & Types | Project TS running, endpoint `GET /api/health` jalan |
| **H2** | Arsitektur | Layered Architecture Express (Controller-Service-Repo) | CRUD dummy Booking & User terpisah rapi 3 layer |
| **H3** | Database | Setup PostgreSQL, schema & migrasi | Table `users`, `bookings`, `slots` terbuat di PostgreSQL |
| **H4** | Database | Query SQL, JOIN, DB Transaction + Concurrency Lock | Logic create booking anti double-booking |
| **H5** | Security | Register, Login, password hashing (bcrypt), Zod validation | Endpoint auth aman + validasi input ketat |
| **H6** | Security | JWT access token, refresh token, auth middleware, RBAC | Protected routes (admin/user) berfungsi penuh |
| **H7** | Polish W1 | Error handling terpusat, review Postman | **Checkpoint 1:** API Local stabil & aman |
| **H8** | Caching | Redis setup via Docker, cache-aside pattern | GET bookings kena cache Redis + TTL |
| **H9** | Performance | Cache invalidation + rate limiting endpoint auth | Cache auto-clear saat create booking, anti brute-force |
| **H10** | Quality | Automated integration test (Vitest / Supertest) | Test script auth & booking pass tanpa error |
| **H11** | DevOps | Dockerfile multi-stage + docker-compose.yml | 1 perintah `docker compose up` jalankan App + DB + Redis |
| **H12** | Cloud | VPS Linux / Railway / Render setup | Container berjalan di server cloud |
| **H13** | Production | Nginx reverse proxy + SSL / Domain | API bisa diakses publik lewat HTTPS |
| **H14** | CI/CD | GitHub Actions (Auto Test & Deploy) + README CV | **Checkpoint 2:** Live production API + CI/CD aktif |

---

## 2. Step-by-Step Pengerjaan Detail: Hari 1–2

### **Hari 1: Inisialisasi Project TypeScript & Express ✅**

#### Langkah 1.1: Init Project & Dependencies
Jalankan di terminal:
```bash
mkdir booking-api
cd booking-api
npm init -y
```
> **Fungsi:** Membuat folder project dan membuat file `package.json` dengan konfigurasi default.

---

Install dependency runtime (dibutuhkan aplikasi saat berjalan di server):
```bash
npm install express dotenv
```
> **Penjelasan Package:**
> - `express`: Framework backend minimalis untuk menangani HTTP request, routing URL, middleware, dan response JSON.
> - `dotenv`: Utility untuk membaca variabel konfigurasi dari file `.env` (seperti `PORT`, `DATABASE_URL`, secret key) ke dalam `process.env`.

---

Install dependency development (hanya dipakai saat coding/development, tidak dipakai di production):
```bash
npm install -D typescript @types/node @types/express tsx
```
> **Penjelasan Package Dev (`-D`):**
> - `typescript`: Compiler resmi (`tsc`) untuk mengecek error tipe data dan mengubah kode `.ts` menjadi `.js`.
> - `@types/node`: Kamus tipe data TypeScript untuk fitur bawaan Node.js (seperti `process.env`, `Buffer`, `path`).
> - `@types/express`: Kamus tipe data TypeScript untuk Express (memberikan autocomplete dan type safety untuk `Request`, `Response`, `NextFunction`).
> - `tsx`: TypeScript executor modern berbasis `esbuild` (pengganti `nodemon` + `ts-node`). Fungsinya menjalankan file TypeScript secara langsung dan otomatis restart server saat file disimpan (`watch mode`), tanpa perlu compile manual tiap kali coding.

---

#### Langkah 1.2: Inisialisasi & Konfigurasi `tsconfig.json`

Generate file `tsconfig.json` bawaan resmi TypeScript via terminal:
```bash
npx tsc --init
```

File hasil generate `npx tsc --init` bersifat *general-purpose* (banyak opsi bawaan React / komentar yang belum aktif). Sesuaikan isi `tsconfig.json` menjadi konfigurasi khusus backend Express yang bersih:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```
> **Kenapa Diubah Seperti Ini?**
> - Mengaktifkan `"rootDir": "./src"` dan `"outDir": "./dist"` agar hasil compile file JavaScript tidak berantakan di dalam `src/`.
> - Membuang opsi frontend React bawaan (seperti `jsx: react-jsx`).
> - Menambahkan `"include": ["src/**/*"]` agar compiler hanya memproses source code di dalam folder `src/`.

---

#### Langkah 1.3: Konfigurasi `package.json` Scripts

Buka file `package.json`. Awalnya bagian `"scripts"` hanya berisi script test bawaan:
```json
// Kondisi awal bawaan npm init:
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

Ubah bagian `"scripts"` menjadi:
```json
"scripts": {
  "dev": "tsx watch src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js"
}
```
> **Kenapa Diubah Begini?**
> - `"dev"`: Menjalankan file `.ts` saat masa development menggunakan `tsx watch`. Server otomatis reload tiap kali kamu save file tanpa perlu build manual.
> - `"build"`: Menggunakan compiler `tsc` untuk mengubah seluruh kode `.ts` di folder `src/` menjadi `.js` siap deploy di folder `dist/`.
> - `"start"`: Menjalankan file JavaScript hasil compile di production (`node dist/app.js`), menghemat memori server karena tidak membebani proses compile saat aplikasi running.

---

#### Langkah 1.4: Buat Entry Point `src/app.ts`

Buat folder `src` dan file `src/app.ts`:
```typescript
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// 1. Muat environment variable dari file .env ke process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware bawaan Express untuk mem-parsing body JSON dari request client
app.use(express.json());

// 3. Endpoint Health Check: Standar monitoring industri untuk cek apakah server hidup
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 4. Jalankan server di port yang ditentukan
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

#### Langkah 1.5: Verifikasi Hari 1
Jalankan command di terminal:
```bash
npm run dev
```
Buka browser atau Postman ke `http://localhost:3000/api/health`.
- **Hasil:** Muncul status `200 OK` dengan response JSON:
  ```json
  {
    "status": "success",
    "message": "Server is healthy",
    "timestamp": "2026-09-03T16:55:00.000Z"
  }
  ```

---

### **Hari 2: Implementasi Layered Architecture (Controller - Service - Repository) ✅**

#### Masalah yang Ingin Dihindari:
*Junior developer biasanya menaruh koneksi database, validasi, rumus bisnis, dan response HTTP bercampur di dalam 1 file route.* 
**Dampak:** Code sulit di-test, berantakan, dan jika database diganti harus merombak seluruh file.

---

#### Langkah 2.1: Susun Struktur Folder
Buat struktur folder berikut di dalam `src/`:
```text
src/
├── types/               # Kontrak tipe data & DTO
│   └── booking.types.ts
├── repositories/        # Layer Akses Data (Query DB / Array)
│   └── booking.repository.ts
├── services/            # Layer Logika Bisnis (Aturan & Validasi Bisnis)
│   └── booking.service.ts
├── controllers/         # Layer HTTP (Menerima Request & Mengirim Response)
│   └── booking.controller.ts
├── middlewares/         # Interceptor (Error Handler & Security)
│   └── error.middleware.ts
├── routes/              # Dispatcher Endpoint URL
│   └── booking.routes.ts
└── app.ts               # Entry point utama aplikasi
```

#### Padanan Komponen Express vs Laravel:

| Layer di Express + TS | Equivalen di Laravel | Fungsi & Tanggung Jawab |
|---|---|---|
| `routes/booking.routes.ts` | `routes/api.php` | Pemetaan URL endpoint ke Controller (`Route::get(...)`). |
| `controllers/booking.controller.ts` | `app/Http/Controllers/BookingController.php` | Terima Request, panggil Service, return Response JSON. |
| `services/booking.service.ts` | `app/Services/BookingService.php` / Action | Eksekusi aturan bisnis (cek bentrok slot, kalkulasi harga). |
| `repositories/booking.repository.ts` | Eloquent Model / Repository Pattern | Tempat query database murni (`SELECT`, `INSERT`, `UPDATE`). |
| `types/booking.types.ts` | `FormRequest` (`StoreBookingRequest.php`) | Menjaga aturan tipe data yang boleh masuk dari client. |
| `middlewares/error.middleware.ts` | `app/Exceptions/Handler.php` | Menangkap error internal dan memformat response HTTP 40x/500. |
| `app.ts` | `public/index.php` + `bootstrap/app.php` | Bootstrapping server & mendaftarkan middleware global. |

---

#### Langkah 2.2: Buat Type Interface (`src/types/booking.types.ts`)
```typescript
// Struktur objek Booking lengkap yang disimpan di sistem
export interface Booking {
  id: string;
  userId: string;
  slotTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
}

// DTO (Data Transfer Object): Data yang BOLEH dikirim oleh client saat membuat booking baru
export interface CreateBookingDTO {
  userId: string;
  slotTime: string;
}
```
> **Kenapa Pakai DTO?**
> Mencegah client mengirim data manipulasi (seperti langsung memasukkan `status: "CONFIRMED"` atau inject `id` sembarangan).

---

#### Langkah 2.3: Buat Data Access Layer (`src/repositories/booking.repository.ts`)
> *Gunakan in-memory array sebagai simulasi database sebelum migrasi ke PostgreSQL di Hari 3.*

```typescript
import { Booking, CreateBookingDTO } from '../types/booking.types.js';

export class BookingRepository {
  // Penyimpanan data sementara di memori RAM
  private bookings: Booking[] = [];

  async findAll(): Promise<Booking[]> {
    return this.bookings;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.id === id) || null;
  }

  async findBySlot(slotTime: string): Promise<Booking | null> {
    return this.bookings.find((b) => b.slotTime === slotTime && b.status !== 'CANCELLED') || null;
  }

  async create(data: CreateBookingDTO): Promise<Booking> {
    const newBooking: Booking = {
      id: String(Date.now()),
      userId: data.userId,
      slotTime: data.slotTime,
      status: 'CONFIRMED',
      createdAt: new Date()
    };
    this.bookings.push(newBooking);
    return newBooking;
  }
}
```
> **Tanggung Jawab Repository:** Murni membaca dan menyimpan data. Di Hari 3, isi method di class ini akan diganti menjadi query PostgreSQL (`db.query('SELECT ...')`).

---

#### Langkah 2.4: Buat Business Logic Layer (`src/services/booking.service.ts`)
```typescript
import { BookingRepository } from '../repositories/booking.repository.js';
import { CreateBookingDTO, Booking } from '../types/booking.types.js';

export class BookingService {
  // Menerima repository via Dependency Injection
  constructor(private bookingRepo: BookingRepository) {}

  async getAllBookings(): Promise<Booking[]> {
    return this.bookingRepo.findAll();
  }

  async getBookingById(id: string): Promise<Booking> {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }
    return booking;
  }

  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    // ATURAN BISNIS: Mencegah double-booking pada slot waktu yang sama
    const existing = await this.bookingRepo.findBySlot(data.slotTime);
    if (existing) {
      throw new Error('SLOT_ALREADY_BOOKED');
    }
    return this.bookingRepo.create(data);
  }
}
```
> **Tanggung Jawab Service:** Berpikir logika bisnis. Service tidak peduli apakah data disimpan di Memory atau Database SQL; tugasnya memastikan tidak ada 2 booking pada waktu yang sama.

---

#### Langkah 2.5: Buat HTTP Transport Layer (`src/controllers/booking.controller.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';

export class BookingController {
  constructor(private bookingService: BookingService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.bookingService.getAllBookings();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err); // Lempar error ke middleware
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.bookingService.getBookingById(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, slotTime } = req.body;
      const data = await this.bookingService.createBooking({ userId, slotTime });
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };
}
```
> **Tanggung Jawab Controller:** Hanya membaca input dari request HTTP (`req.body`, `req.params`), memanggil `Service`, lalu mengembalikan response JSON beserta HTTP status code (`200`, `201`).

---

#### Langkah 2.6: Buat Global Error Handler (`src/middlewares/error.middleware.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';

// Middleware 4 parameter: Express otomatis mengenalinya sebagai Error Handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.message === 'BOOKING_NOT_FOUND') {
    return res.status(404).json({ status: 'fail', message: 'Booking tidak ditemukan' });
  }
  if (err.message === 'SLOT_ALREADY_BOOKED') {
    return res.status(409).json({ status: 'fail', message: 'Slot waktu sudah terisi' });
  }

  // Jika error tidak dikenal, log ke console dan kirim 500
  console.error('[UNHANDLED ERROR]:', err);
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
};
```
> **Tanggung Jawab Error Handler:** Mengubah semua `throw new Error()` di service menjadi response JSON terstandar dengan HTTP code yang benar (`404 Not Found`, `409 Conflict`, `500 Server Error`).

---

#### Langkah 2.7: Daftarkan Routes & Sambungkan di `src/app.ts`

Buat file `src/routes/booking.routes.ts`:
```typescript
import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';
import { BookingService } from '../services/booking.service.js';
import { BookingRepository } from '../repositories/booking.repository.js';

const router = Router();

// Inisialisasi dependency secara hierarki
const repo = new BookingRepository();
const service = new BookingService(repo);
const controller = new BookingController(service);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);

export default router;
```

Update file `src/app.ts`:
```typescript
import express from 'express';
import dotenv from 'dotenv';
import bookingRoutes from './routes/booking.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 1. Daftarkan router booking
app.use('/api/bookings', bookingRoutes);

// 2. Daftarkan error handler (Wajib ditaruh paling bawah setelah semua route)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

---

#### Langkah 2.8: Verifikasi Hari 2
1. Jalankan `npm run dev`.
2. **Test 1: Buat Booking Baru**
   - `POST http://localhost:3000/api/v1/booking`
   - Body: `{"userId": "user-1", "slotTime": "2026-09-04T10:00:00Z"}`
   - *Status:* `201 Created`
3. **Test 2: Coba Rebutan Slot Sama (Simulasi Konflik)**
   - Ulangi kirim request yang sama persis.
   - *Status:* `409 Conflict` (`"Slot waktu sudah terisi sebelumnya"`).
4. **Test 3: Ambil Daftar Booking**
   - `GET http://localhost:3000/api/v1/booking`
   - *Status:* `200 OK` dengan data array booking.

---

## 3. Step-by-Step Pengerjaan Detail: Hari 3–4 (PostgreSQL & Concurrency Locking)

> **Tujuan Blok Ini:** 
> 1. Mengganti penyimpanan in-memory RAM dengan database **PostgreSQL sungguhan**.
> 2. Menyelesaikan masalah **Race Condition (rebutan slot)** di tingkat database menggunakan **Constraint & Database Transaction (`SELECT ... FOR UPDATE`)**.

---

### **Hari 3: Setup PostgreSQL, Migrasi Schema, & Refactor Repository ✅**

Di Hari 2, data masih hilang saat server di-restart. Sekarang kita sambungkan ke PostgreSQL menggunakan driver resmi `pg` (*node-postgres*).

#### Langkah 3.1: Install Driver PostgreSQL & Tooling
Jalankan di terminal:
```bash
npm install pg
npm install -D @types/pg
```
> **Penjelasan Package:**
> - `pg` (*node-postgres*): Driver PostgreSQL resmi untuk Node.js (setara ekstensi `pdo_pgsql` di PHP/Laravel).
> - `@types/pg`: Kamus tipe data TypeScript untuk `Pool`, `Client`, dan query result.

---

#### Langkah 3.2: Siapkan Database & File `.env`

Jika kamu punya Docker, jalankan container PostgreSQL dengan 1 command:
```bash
docker run -d --name postgres-booking -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booking_db -p 5432:5432 postgres:16
```
*(Atau gunakan PostgreSQL lokal / pgAdmin yang sudah terpasang di komputermu).*

Buka file `.env` di root project dan tambahkan kredensial koneksi:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=booking_db
```
> **Padanan Laravel:** Persis seperti konfigurasi `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_DATABASE` di file `.env` Laravel.

---

#### Langkah 3.3: Buat Connection Pool (`src/config/database.ts`)

Buat file baru `src/config/database.ts`:
```typescript
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection Pool: Mengelola sekumpulan koneksi siap pakai agar tidak perlu handshake TCP berulang kali di tiap request
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'booking_db',
  max: 10, // Maksimal 10 koneksi simultan di pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listener untuk memantau status koneksi pool
pool.on('connect', () => {
  console.log('[DATABASE]: Terhubung ke PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DATABASE ERROR]:', err);
});
```
> **Kenapa Pakai `Pool` Bukan `Client` Biasa?**
> - Single `Client` hanya bisa menjalankan 1 query dalam satu waktu. Jika ada 100 user memanggil API bersamaan, mereka harus antre.
> - `Pool` membuka beberapa koneksi sekaligus (multithreaded/pooled) sehingga request dari banyak user bisa diproses paralel (seperti connection pool PDO Laravel di production).

---

#### Langkah 3.4: Buat Script Migrasi Schema (`src/database/migrate.ts`)

Di Laravel kita punya `php artisan migrate`. Di Express TS, kita buat script DDL SQL sederhana untuk membuat tabel.

Buat file `src/database/migrate.ts`:
```typescript
import { pool } from '../config/database.js';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('[MIGRATION]: Menjalankan migrasi tabel...');

    // 1. Buat Tabel Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Buat Tabel Bookings
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        slot_time VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[MIGRATION SUKSES]: Tabel users & bookings berhasil disiapkan.');
  } catch (err) {
    console.error('[MIGRATION GAGAL]:', err);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
```

Tambahkan script `migrate` di `package.json`:
```json
"scripts": {
  "dev": "tsx watch src/app.ts",
  "build": "tsc",
  "start": "node dist/app.js",
  "migrate": "tsx src/database/migrate.ts"
}
```

Jalankan migrasi di terminal:
```bash
npm run migrate
```

---

#### Langkah 3.5: Refactor `BookingRepository` ke Query PostgreSQL

> **Bukti Kekuatan 3-Layer Architecture:**
> Kita **HANYA MENGUBAH file ini (`booking.repository.ts`)**. 
> File `booking.service.ts`, `booking.controller.ts`, dan `routes` **0 baris diubah** karena mereka hanya bergantung pada kontrak method `findAll()`, `findById()`, dan `create()`.

Ubah file `src/repositories/booking.repository.ts`:
```typescript
import { pool } from '../config/database.js';
import { Booking, CreateBookingDTO } from '../types/booking.types.js';

/**
 * REPOSITORY LAYER (PostgreSQL Implementation)
 * Tanggung Jawab: Murni eksekusi query database menggunakan SQL murni.
 */
export class BookingRepository {
  async findAll(): Promise<Booking[]> {
    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      ORDER BY created_at DESC;
    `;
    const result = await pool.query<Booking>(query);
    return result.rows;
  }

  async findById(id: string): Promise<Booking | null> {
    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      WHERE id = $1;
    `;
    const result = await pool.query<Booking>(query, [id]);
    return result.rows[0] || null;
  }

  async findBySlot(slotTime: string): Promise<Booking | null> {
    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      WHERE slot_time = $1 AND status != 'CANCELLED';
    `;
    const result = await pool.query<Booking>(query, [slotTime]);
    return result.rows[0] || null;
  }

  async create(data: CreateBookingDTO): Promise<Booking> {
    const id = String(Date.now());
    const query = `
      INSERT INTO bookings (id, user_id, slot_time, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'CONFIRMED', NOW(), NOW())
      RETURNING id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt";
    `;
    const values = [id, data.userId, data.slotTime];
    const result = await pool.query<Booking>(query, values);
    return result.rows[0];
  }
}
```
> **Catatan Teknis SQL:**
> - `$1, $2, $3`: Parameterized query bawaan PostgreSQL (Mencegah SQL Injection, setara PDO binding di Laravel).
> - `RETURNING *`: Fitur unggulan PostgreSQL untuk mengembalikan baris yang baru saja di-insert tanpa perlu query `SELECT` tambahan.
> - `slot_time as "slotTime"`: Mapping snake_case kolom PostgreSQL ke camelCase properti TypeScript.

---

#### Langkah 3.6: Verifikasi Hari 3
1. Jalankan server: `npm run dev`. Pastikan log terminal memunculkan `[DATABASE]: Terhubung ke PostgreSQL`.
2. Kirim `POST http://localhost:3000/api/v1/booking` lewat Postman:
   ```json
   {
     "userId": "usr-pg-1",
     "slotTime": "2026-09-05T09:00:00Z"
   }
   ```
3. Restart server Node.js kamu (`Ctrl+C` lalu `npm run dev` lagi).
4. Kirim `GET http://localhost:3000/api/v1/booking`.
   - **Hasil Sukses:** Data booking **tetap ada** karena sudah tersimpan permanen di tabel PostgreSQL!

---

### **Hari 4: Menangani Race Condition (Database Constraint & Transaction Lock) ✅**

#### Masalah Nyata di Industri (The Double-Booking Problem):
Sekarang kode validasi kita di `BookingService` mengecek slot lewat:
```typescript
const existing = await this.bookingRepo.findBySlot(data.slotTime);
if (existing) throw new Error("SLOT_ALREADY_BOOKED");
await this.bookingRepo.create(data);
```
**Celah Bahaya (Race Condition):**
Jika User A dan User B menekan tombol booking di milidetik yang sama:
1. User A: `findBySlot()` -> Hasil: Kosong.
2. User B: `findBySlot()` -> Hasil: Kosong (karena User A belum sempat selesai menulis ke DB).
3. User A: `create()` -> Sukses booking!
4. User B: `create()` -> Sukses booking juga!
**Akibat:** Dua orang berhasil booking 1 slot waktu yang sama (*Double Booking Disaster*).

Di Hari 4 kita pasang **2 Lapis Pertahanan Standar Industri**.

---

#### Langkah 4.1: Lapis Pertahanan 1 — Database Unique Constraint
Pertahanan paling kokoh di backend: **Database Constraint**. Database tidak akan pernah membiarkan 2 baris memiliki slot yang sama, seberapa pun cepatnya request paralel masuk.

Update file `src/database/migrate.ts` untuk menambahkan Unique Constraint:
```typescript
// Tambahkan baris ini di dalam migrate.ts setelah pembuatan tabel:
await client.query(`
  ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS unique_active_slot;

  ALTER TABLE bookings 
  ADD CONSTRAINT unique_active_slot UNIQUE (slot_time);
`);
```
Jalankan ulang: `npm run migrate`.

---

#### Langkah 4.2: Update Error Middleware untuk Tangkap Kode Error PostgreSQL

Jika ada 2 request paralel menembus validasi service, PostgreSQL akan menolak request kedua dengan kode error `23505` (*Unique Violation*). Tangkap kode ini di `src/middlewares/error.middleware.ts`.

Update `src/middlewares/error.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // 1. Error dari Aturan Bisnis Service
  if (err.message === 'BOOKING_NOT_FOUND') {
    return res.status(404).json({ status: 'fail', message: 'Booking tidak ditemukan' });
  }
  if (err.message === 'SLOT_ALREADY_BOOKED') {
    return res.status(409).json({ status: 'fail', message: 'Slot waktu sudah terisi sebelumnya' });
  }

  // 2. Error dari Database Constraint PostgreSQL (Kode 23505 = Unique Violation / Bentrok Concurrency)
  if (err.code === '23505') {
    return res.status(409).json({ 
      status: 'fail', 
      message: 'Slot waktu baru saja diambil oleh pengguna lain. Silakan pilih slot lain.' 
    });
  }

  console.error('[UNHANDLED ERROR]:', err);
  return res.status(500).json({ status: 'error', message: 'Masalah Server Tidak Diketahui' });
};
```

---

#### Langkah 4.3: Lapis Pertahanan 2 — Database Transaction (`BEGIN ... COMMIT ... ROLLBACK`)

*Padanan Laravel:* `DB::transaction(function() { ... })`.

Di Node.js PostgreSQL, transaksi atomik dilakukan dengan cara meminjam 1 client khusus dari pool, lalu menjalankan `BEGIN`, rangkaian query, dan `COMMIT`. Jika ada error, lakukan `ROLLBACK`.

Tambahkan method `createTransactional` di `src/repositories/booking.repository.ts`:

```typescript
  // Method transaksi dengan proteksi ACID penuh
  async createTransactional(data: CreateBookingDTO): Promise<Booking> {
    // 1. Pinjam 1 client khusus dari Pool untuk sesi transaksi ini
    const client = await pool.connect();

    try {
      // 2. Mulai Transaksi (Setara DB::beginTransaction() di Laravel)
      await client.query('BEGIN');

      // 3. Cek slot dengan Row-Level Lock jika diperlukan (mencegah modifikasi data selama transaksi)
      const checkQuery = `
        SELECT id FROM bookings 
        WHERE slot_time = $1 AND status != 'CANCELLED' 
        FOR UPDATE;
      `;
      const existing = await client.query(checkQuery, [data.slotTime]);

      if (existing.rows.length > 0) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 4. Eksekusi Simpan Data
      const id = String(Date.now());
      const insertQuery = `
        INSERT INTO bookings (id, user_id, slot_time, status, created_at, updated_at)
        VALUES ($1, $2, $3, 'CONFIRMED', NOW(), NOW())
        RETURNING id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt";
      `;
      const result = await client.query<Booking>(insertQuery, [id, data.userId, data.slotTime]);

      // 5. Commit Transaksi jika semua sukses (Setara DB::commit())
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      // 6. Rollback semua perubahan jika ada kegagalan (Setara DB::rollBack())
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 7. WAJIB: Kembalikan client ke Pool agar tidak terjadi Connection Leak!
      client.release();
    }
  }
```
> **Aturan Emas Connection Pool:** 
> Setiap kali menggunakan `const client = await pool.connect()`, blok `finally { client.release(); }` **WAJIB ADA**. Jika lupa di-release, koneksi pool akan habis dan server akan macet (*hang*).

---

#### Langkah 4.4: Hubungkan ke `BookingService`

Update method `createBooking` di `src/services/booking.service.ts` agar memanggil method transactional:

```typescript
    async createBooking(data: CreateBookingDTO): Promise<Booking> {
        // Sekarang delegasikan ke repository transactional yang sudah aman dari race condition
        return this.bookingRepo.createTransactional(data);
    }
```

---

#### Langkah 4.5: Verifikasi Hari 4 (Uji Anti-Race Condition)
1. Buka 2 tab Postman atau jalankan 2 perintah curl secara simultan:
   ```bash
   curl -X POST http://localhost:3000/api/v1/booking -H "Content-Type: application/json" -d "{\"userId\":\"user-A\",\"slotTime\":\"2026-09-06T14:00:00Z\"}" & curl -X POST http://localhost:3000/api/v1/booking -H "Content-Type: application/json" -d "{\"userId\":\"user-B\",\"slotTime\":\"2026-09-06T14:00:00Z\"}"
   ```
2. **Hasil yang Harus Terjadi:**
   - Request pertama: HTTP `201 Created` (Booking berhasil dibuat).
   - Request kedua: HTTP `409 Conflict` (`"Slot waktu sudah terisi sebelumnya"` atau `"Slot waktu baru saja diambil oleh pengguna lain"`).
3. Cek database PostgreSQL: **Hanya ada tepat 1 baris** untuk slot tersebut. Double-booking berhasil dicegah 100%!

---

# HARI 5–6: Authentication & Authorization (JWT, Bcrypt & RBAC) ✅

Target: Sistem registrasi dan login aman, hashing password dengan `bcrypt`, penerbitan Access Token + Refresh Token (JWT), `authMiddleware` pelindung route, serta proteksi Role-Based Access Control (`ADMIN` vs `USER`).

---

## 1. Konsep & Padanan Laravel vs Express TS

| Fitur | Laravel Ecosystem | Express.js + TS Native |
| :--- | :--- | :--- |
| **Password Hashing** | `Hash::make($password)` (Bcrypt) | `bcrypt.hash(password, 10)` |
| **Token Auth** | Laravel Sanctum / Passport | `jsonwebtoken` (`jwt.sign`, `jwt.verify`) |
| **Protect Route** | `auth:sanctum` Middleware | Custom `authMiddleware(req, res, next)` |
| **RBAC / Role Gate** | Gate / Policy `authorize('admin')` | Custom `roleMiddleware(['ADMIN'])` |
| **Current User Context**| `Auth::user()` atau `$request->user()` | `req.user` (lewat Express Request Type Extension) |

---

## 2. Instalasi Dependensi Hari 5–6

Jalankan perintah berikut di folder `express-booking-engine-api`:

```bash
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

---

## 3. Langkah Implementasi Hari 5–6

### Langkah 5.1: Definisikan Types Auth & User

Buat file `src/types/auth.types.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'USER';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
```

---

### Langkah 5.2: Perluas Type Definition Express `Request`

Agar TypeScript tidak error saat kita mengakses `req.user`, buat deklarasi global di `src/types/express.d.ts`:

```typescript
import { JwtPayload } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
```

---

### Langkah 5.3: Buat `UserRepository`

Buat file `src/repositories/user.repository.ts`:

```typescript
import { pool } from '../config/database';
import { User, RegisterDTO } from '../types/auth.types';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, name, email, password, role, created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE email = $1;
    `;
    const result = await pool.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, name, email, role, created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1;
    `;
    const result = await pool.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async create(data: RegisterDTO & { id: string; passwordHash: string }): Promise<User> {
    const query = `
      INSERT INTO users (id, name, email, password, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, created_at as "createdAt", updated_at as "updatedAt";
    `;
    const role = data.role || 'USER';
    const result = await pool.query<User>(query, [data.id, data.name, data.email, data.passwordHash, role]);
    return result.rows[0];
  }
}
```

---

### Langkah 5.4: Buat `AuthService`

Buat file `src/services/auth.service.ts`:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { RegisterDTO, LoginDTO, User, AuthTokens, JwtPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'supersecret_access_key';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecret_refresh_key';

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  async register(data: RegisterDTO): Promise<{ user: User; tokens: AuthTokens }> {
    // 1. Cek email unik
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 2. Hash password (Cost factor 10)
    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = `usr-${Date.now()}`;

    // 3. Simpan ke database
    const user = await this.userRepo.create({
      ...data,
      id,
      passwordHash,
    });

    // 4. Buat JWT
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async login(data: LoginDTO): Promise<{ user: User; tokens: AuthTokens }> {
    // 1. Cari user berdasarkan email
    const user = await this.userRepo.findByEmail(data.email);
    if (!user || !user.password) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 2. Verifikasi password hash
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 3. Buat JWT
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Jangan return password hash ke response
    delete user.password;
    return { user, tokens };
  }

  generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }
}
```

---

### Langkah 5.5: Buat `authMiddleware` & `roleMiddleware`

Buat file `src/middlewares/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'supersecret_access_key';

// Middleware Autentikasi: Memastikan Bearer Token valid
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'fail', message: 'Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    req.user = decoded; // Setara Auth::user()
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Token tidak valid atau telah kedaluwarsa' });
  }
};

// Middleware Otorisasi (RBAC): Membatasi hak akses role tertentu
export const authorizeRole = (allowedRoles: Array<'ADMIN' | 'USER'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'Akses ditolak: Hak akses tidak mencukupi' });
    }
    next();
  };
};
```

---

### Langkah 5.6: Buat `AuthController` & Routing

Buat file `src/controllers/auth.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json({
        status: 'success',
        message: 'Registrasi berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json({
        status: 'success',
        message: 'Login berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  profile = async (req: Request, res: Response) => {
    return res.status(200).json({
      status: 'success',
      data: req.user,
    });
  };
}
```

Buat file `src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.profile);

export default router;
```

Tambahkan rute di `src/app.ts`:
```typescript
import authRoutes from './routes/auth.routes';
// ...
app.use('/api/v1/auth', authRoutes);
```

---

# HARI 7: Redis Caching (Cache-Aside Pattern) & Invalidation ✅

Target: Mengoptimasi query read-heavy (seperti pencarian slot booking) menggunakan Redis in-memory storage, mengimplementasikan pola **Cache-Aside**, serta menangani **Cache Invalidation** otomatis agar data tidak *stale* (basi).

---

## 1. Konsep & Padanan Laravel vs Express TS

| Konsep | Laravel | Express.js + TypeScript | Penjelasan Industri |
| :--- | :--- | :--- | :--- |
| **Redis Client** | `Predis` / `PhpRedis` | `ioredis` | Driver TCP performa tinggi, non-blocking, mendukung auto-reconnect |
| **Cache Pattern** | `Cache::remember('key', 60, fn() => ...)` | Helper `getOrSetCache(key, ttl, fn)` | Cek Redis dulu; jika kosong (MISS), query DB dan simpan ke Redis |
| **Invalidation** | `Cache::forget('key')` | `invalidateCache('key')` (`redis.del`) | Hapus cache saat ada data baru masuk agar user lain membaca data teranyar |
| **Data Format** | Otomatis di-serialize oleh Laravel | `JSON.stringify()` & `JSON.parse()` | Redis menyimpan string, sehingga objek JS perlu di-serialize |

---

## 2. Deep-Dive Konsep: Cache-Aside & Masalah "Stale Data"

### Mengapa Cache-Aside?
Dalam sistem backend industri, pola **Cache-Aside** adalah standar emas karena:
1. **Aplikasi mengontrol logika**: Aplikasi bertanggung jawab membaca dan menulis ke cache.
2. **Resilience (Daya Tahan)**: Jika Redis mati/crash, aplikasi tetap berjalan normal dengan langsung membaca database PostgreSQL (Graceful Degradation).

### Diagram Alur Cache-Aside:
```text
               [ Client: GET /slots?date=2026-09-10 ]
                                 │
                                 ▼
                      [ Cek Redis Key: slots:2026-09-10 ]
                       /                              \
             (Cache HIT: Ada)                 (Cache MISS: Kosong)
                   │                                    │
         [ Return JSON Langsung ]             [ Query ke PostgreSQL ]
             (~2 - 5 ms)                                │
                                                        ▼
                                             [ Simpan ke Redis (TTL 60s) ]
                                                        │
                                                        ▼
                                             [ Return JSON ke Client ]
                                                     (~30 - 60 ms)
```

### Jebakan "Stale Data" (Data Basi):
Jika user A memesan jam 10:00, tetapi data slot jam 10:00 masih tersimpan di Redis selama 60 detik berikutnya, maka user B akan mengira jam 10:00 masih kosong.
* **Solusi Mutlak**: Setiap kali ada operasi `POST /booking` yang berhasil, kita **WAJIB** menghapus (*invalidate*) key cache tanggal tersebut (`redis.del('slots:2026-09-10')`).

### Mitigasi Kasus Nyata di Industri:
1. **Anti-Stampede (Dog-piling Mitigation)**:
   * Jika ribuan key punya durasi persis 60 detik, semuanya akan expired di detik yang sama dan membuat PostgreSQL diserbu jutaan query (*stampede*).
   * **Solusi**: Tambahkan **TTL Jitter** (acak 1-10 detik ekstra). Waktu expired tiap key tersebar alami.
2. **Anti-Penetration (Null Caching)**:
   * Jika user/bot mencari ID yang tidak ada di database (`GET /booking/id-ngasal`), database selalu di-query dan return kosong (*Cache Penetration*).
   * **Solusi**: Jika database mengembalikan `null`/kosong, simpan nilai `null` di Redis dengan **TTL pendek (30 detik)**. Request berikutnya langsung dijawab dari Redis tanpa menyentuh database.

---

## 3. Langkah Implementasi Hari 7

### Langkah 7.1: Instalasi `ioredis`

Jalankan terminal:
```bash
npm install ioredis
  npm install -D @types/ioredis
```

#### Penjelasan Kegunaan Package:
* **`ioredis`** (Production Dependency):
  * Library client / driver Redis untuk Node.js standar industri yang paling stabil dan berkinerja tinggi.
  * Menghubungkan aplikasi Express.js ke server Redis via protokol TCP.
  * Fitur utama: Native async/await (Promise), auto-reconnect otomatis jika koneksi terputus, support Cluster & Sentinel, dan performa query memori yang sangat cepat (~1-3 ms).
  * *Padanan Laravel*: Setara dengan ekstensi PHP `ext-redis` (PhpRedis) atau library `predis/predis` di Composer.
* **`@types/ioredis`** (Development Dependency):
  * Berisi *type definition* (kontrak tipe data) khusus TypeScript untuk `ioredis`.
  * Memberikan fitur auto-complete / IntelliSense di VS Code saat mengetik perintah Redis (`redis.get`, `redis.set`, `redis.del`) dan memvalidasi tipe argumen agar terhindar dari bug runtime.

Tambahkan variabel environment di `.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

### Langkah 7.2: Koneksi Redis Client yang Tahan Banting

Buat file `src/config/redis.ts`:

```typescript
import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true, // Tidak langsung crash aplikasi jika Redis belum menyala
  maxRetriesPerRequest: 3,
  family: 4, // Paksa IPv4 agar DNS internal Docker di Alpine Linux tidak timeout (EAI_AGAIN)
});

redis.on('connect', () => {
  console.log('✅ Redis Client Connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
});
```

---

### Langkah 7.3: Buat Helper Cache Reusable (Dengan Proteksi Anti-Stampede & Anti-Penetration)

Buat file `src/utils/cache.ts`:

```typescript
import { redis } from '../config/redis';

/**
 * Mengambil data dari cache dengan proteksi Anti-Stampede (TTL Jitter) & Anti-Penetration (Null Caching).
 * @param key Redis cache key
 * @param ttlSeconds Durasi kadaluwarsa dasar dalam detik
 * @param fetcher Fungsi fallback mengambil data asli dari Database jika cache miss
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key);
    // Anti-Penetration: cached !== null berarti key ada di Redis (walau isinya string "null")
    if (cached !== null) {
      console.info(`[✅ Cache HIT] Key "${key}"`);
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    // Jika Redis down, log warning dan bypass ke Database (Graceful Degradation)
    console.warn(`[⚠️ Cache Warning] Gagal membaca key "${key}":`, error);
  }

  // Cache MISS -> ambil data asli dari Database
  const freshData = await fetcher();

  try {
    // 1. Anti-Stampede: Tambahkan acak (jitter) 1-10 detik agar ribuan key tidak expired serempak
    const jitter = Math.floor(Math.random() * 10);
    const actualTtl = ttlSeconds + jitter;

    if (freshData !== null && freshData !== undefined) {
      console.info(`[✅ Cache SET] Menulis key "${key}" (TTL: ${actualTtl}s)`);
      await redis.set(key, JSON.stringify(freshData), 'EX', actualTtl);
    } else {
      // 2. Anti-Penetration: Data tidak ada di DB, simpan "null" dengan TTL pendek (30 detik)
      console.info(`[🛡️ Cache Anti-Penetration] Menulis key kosong "${key}" (TTL: 30s)`);
      await redis.set(key, JSON.stringify(null), 'EX', 30);
    }
  } catch (error) {
    console.warn(`[⚠️ Cache Warning] Gagal menulis key "${key}":`, error);
  }

  return freshData;
}

/**
 * Menghapus cache key saat data diperbarui / ditambah (Cache Invalidation)
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      console.info(`[✅ Cache] Berhasil menghapus cache keys: ${keys.join(', ')}`);
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn('[⚠️ Cache Warning] Gagal menghapus cache keys:', error);
  }
}
```

---

### Langkah 7.4: Terapkan Caching pada `BookingService`

Kita tidak perlu menambah route atau mengubah `booking.repository.ts`. Caching cukup dipasang di Service Layer (`src/services/booking.service.ts`) pada method `getAllBookings()` dan `createBooking()`:

Update `src/services/booking.service.ts`:

```typescript
import { BookingRepository } from '../repositories/booking.repository';
import { Booking, CreateBookingDTO } from '../types/booking.types';
import { getOrSetCache, invalidateCache } from '../utils/cache';

export class BookingService {
  constructor(private bookingRepo: BookingRepository) {}

  async getAllBookings(): Promise<Booking[]> {
    // 1. Cache-Aside Pattern: Cek Redis dulu, jika kosong baru query PostgreSQL
    return await getOrSetCache('bookings:all', 60, async () => {
      return await this.bookingRepo.findAll();
    });
  }

  async getBookingById(id: string): Promise<Booking> {
    return await getOrSetCache(`booking:${id}`, 60, async () => {
      const booking = await this.bookingRepo.findById(id);
      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }
      return booking;
    });
  }

  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    // 1. Eksekusi booking dengan transaksi atomik & lock (Hari 4)
    const booking = await this.bookingRepo.createTransactional(data);

    // 2. Cache Invalidation: Hapus cache daftar booking agar list langsung terupdate
    await invalidateCache('bookings:all');

    return booking;
  }
}
```

> **Bukti Keunggulan Layered Architecture:**
> Repository, Controller, dan Routes **0 baris diubah**. Caching murni urusan Service layer.

---

## 4. Pengujian & Verifikasi Hari 7

1. **Uji Kecepatan Cache HIT vs MISS**:
   * Request 1: `GET http://localhost:5000/api/v1/booking`
     * Terminal: `[Cache MISS] -> Ambil dari PostgreSQL -> Disimpan ke Redis`
     * Response time: ~30-50 ms
   * Request 2: `GET http://localhost:5000/api/v1/booking` (Kirim lagi)
     * Terminal: `[✅ Cache] Berhasil membaca key "bookings:all"`
     * Response time: ~1-3 ms (Super cepat!)

2. **Uji Cache Invalidation**:
   * Kirim `POST http://localhost:5000/api/v1/booking` dengan slot baru.
   * Terminal: `[✅ Cache] Berhasil menghapus cache keys: bookings:all`
   * Kirim lagi `GET http://localhost:5000/api/v1/booking`:
     * Cache otomatis di-fetch ulang dari DB dan memuat data booking yang baru saja dibuat.

---

# HARI 8: Rate Limiting & Anti-Brute Force (Security Layer) ✅

Target: Melindungi endpoint kritis dari serangan DDoS, scraping, dan serangan Brute-force password menggunakan distributed rate limiter berbasis Redis.

---

## 1. Konsep & Padanan Laravel vs Express TS

| Konsep | Laravel | Express.js + TypeScript | Penjelasan Industri |
| :--- | :--- | :--- | :--- |
| **Throttle Middleware** | `throttle:60,1` / `RateLimiter::for()` | `express-rate-limit` | Middleware pembatas frekuensi request per client IP |
| **Storage Adapter** | Redis Cache Driver | `rate-limit-redis` | Menyimpan counter request di Redis agar konsisten di server cluster |
| **Status Response** | `429 Too Many Requests` | `429 Too Many Requests` | Kode status HTTP resmi standar RFC 6585 |
| **Standar Headers** | `Retry-After`, `X-RateLimit-*` | `standardHeaders: true` (`RateLimit-*`) | Memberitahu client sisa kuota request dan kapan kuota direset |

---

## 2. Deep-Dive Konsep Keamanan: Mengapa Harus Redis Store?

### Masalah Memory Store Bawaan:
Secara default, library rate limiter menyimpan hitungan request di memori RAM Node.js lokal.
* Jika server dijalankan dengan **PM2 Cluster (4 worker)** atau dideploy di **2 Server / Container**, setiap worker memiliki memori sendiri.
* Akibatnya: Jika batasnya 5 request, attacker bisa menembakkan 5 x 4 = 20 request sebelum diblokir.
* **Solusi**: Gunakan **Redis** sebagai centralized counter. Semua worker dan container memeriksa kuota dari database Redis yang sama.

---

## 3. Langkah Implementasi Hari 8

### Langkah 8.1: Instalasi Package Rate Limiter

Jalankan terminal:
```bash
npm install express-rate-limit rate-limit-redis
```

---

### Langkah 8.2: Buat Middleware Rate Limiter Bertingkat

Buat file `src/middlewares/rateLimiter.middleware.ts`:

```typescript
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../config/redis';

/**
 * 1. Global Rate Limiter
 * Kegunaan: Melindungi seluruh API dari serangan DDoS dan spam request umum.
 * Batasan: Maksimal 100 request per 15 menit per IP address.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Jendela waktu hitung kuota: 15 menit (dalam milidetik)
  max: 100,                 // Batas maksimal request yang diizinkan per IP dalam 1 window
  standardHeaders: true,    // Mengirim header standar RFC (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
  legacyHeaders: false,     // Menonaktifkan header usang (X-RateLimit-*)
  message: {
    status: 'fail',
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  /**
   * Adapter Penyimpanan State (RedisStore):
   * Mengalihkan pencatatan hitungan request dari RAM lokal Node.js ke database Redis terpusat.
   * Keuntungan: Jika server dijalankan di multi-worker/cluster (PM2, Docker 2 container),
   * batasan kuota tetap akurat & sinkron di seluruh instance server.
   */
  store: new RedisStore({
    // sendCommand: Jembatan eksekusi script Lua atomik (INCR, EXPIRE) dari adapter ke client ioredis
    // @ts-expect-error - Penyesuaian selisih tipe signature tuple argumen antara ioredis dan rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
    // prefix: Namespace/awalan key di Redis agar terisolasi rapi (contoh di Redis: rl:global:127.0.0.1)
    prefix: 'rl:global:',
  }),
});

/**
 * 2. Auth Limiter (Ketat)
 * Kegunaan: Mencegah serangan Brute-force & Credential Stuffing pada login dan registrasi.
 * Batasan: Maksimal 5 percobaan per 5 menit per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // Jendela waktu: 5 menit
  max: 5,                  // Maksimal 5 percobaan
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Terlalu banyak percobaan autentikasi. Akses ditangguhkan sementara selama 5 menit.',
  },
  store: new RedisStore({
    // @ts-expect-error - compatibility signature ioredis call
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:auth:', // Key khusus auth (contoh di Redis: rl:auth:127.0.0.1)
  }),
});

/**
 * 3. Booking Limiter
 * Kegunaan: Mencegah Bot / Ticket Scalper membanjiri antrean atau memborong slot order.
 * Batasan: Maksimal 10 transaksi booking per 1 menit per IP.
 */
export const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Jendela waktu: 1 menit
  max: 10,                 // Maksimal 10 request
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Terlalu banyak order dibuat dalam waktu singkat. Harap tunggu sebentar.',
  },
  store: new RedisStore({
    // @ts-expect-error - compatibility signature ioredis call
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:booking:', // Key khusus booking (contoh di Redis: rl:booking:127.0.0.1)
  }),
});
```

---

### Langkah 8.3: Pasang Limiter pada Rute

1. Pasang `authLimiter` di `src/routes/auth.routes.ts`:
```typescript
import { authLimiter } from '../middlewares/rateLimiter.middleware';

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
```

2. Pasang `bookingLimiter` di `src/routes/booking.routes.ts`:
```typescript
import { bookingLimiter } from '../middlewares/rateLimiter.middleware';

router.post('/', bookingLimiter, bookingController.createBooking);
```

3. Pasang `globalLimiter` di `src/app.ts`:
```typescript
import { globalLimiter } from './middlewares/rateLimiter.middleware';

// Pasang sebelum rute endpoint
app.use(globalLimiter);
```

---

## 4. Pengujian & Verifikasi Hari 8

1. **Uji Brute-Force Auth**:
   * Kirim request salah ke `POST /api/v1/auth/login` sebanyak 5 kali.
   * Pada request ke-6, server langsung memblokir dengan status `429 Too Many Requests`.
   * Cek header respon: terdapat header `Retry-After` (menunjukkan sisa detik blokir) dan `RateLimit-Remaining: 0`.

2. **Cek Key di Redis**:
   * Buka Redis CLI / Redis GUI:
   * Key `rl:auth:<ip_address>` dan `rl:global:<ip_address>` otomatis tercatat dan memiliki TTL mundur sesuai konfigurasi window waktu.

---

# HARI 9: Unit Testing & Mocking (Vitest) ✅

Target: Menjamin logika bisnis di Service Layer (`BookingService` & `AuthService`) bebas bug dan tahan regresi menggunakan **Vitest**, serta teknik **Mocking Repository** agar unit test berjalan super cepat (hitungan milidetik) tanpa ketergantungan database fisik.

---

## 1. Konsep & Padanan Laravel vs Express TS

| Konsep | Laravel | Express.js + TypeScript | Penjelasan Industri |
| :--- | :--- | :--- | :--- |
| **Test Runner** | `PHPUnit` / `Pest` | `Vitest` | Test framework modern berbasis Vite, native ESM, auto TypeScript, super cepat |
| **Test Command** | `php artisan test` | `npx vitest run` | Eksekusi seluruh file test suite |
| **Mocking Library** | `Mockery` / `$this->mock()` | `vi.fn()` / `vi.mock()` | Membuat objek palsu peniru Repository agar test terisolasi murni di memori |
| **Assertions** | `$this->assertEquals()` | `expect().toBe()` / `toEqual()` | Pengecekan ekspektasi nilai hasil fungsi |

---

## 2. Deep-Dive Konsep: Mengapa Unit Test Harus Pakai Mocking?

```text
Unit Test Sebenarnya (Terisolasi):
[ Test Runner ] ──► [ BookingService ] ──► [ Mock Repo (Palsu di Memori) ]
                       (Waktu: ~2 ms | Tidak butuh DB nyata)

Bukan Unit Test (Tergabung / Integration):
[ Test Runner ] ──► [ BookingService ] ──► [ PostgreSQL Server Asli ]
                       (Waktu: ~150 ms | Rawan bentrok data di DB)
```

1. **Kecepatan**: Unit test dengan mock bisa menjalankan ratusan test case dalam 1–2 detik.
2. **Determinisme**: Test tidak akan gagal hanya karena koneksi database PostgreSQL lokal mati atau internet putus.
3. **Fokus pada Logic**: Memastikan percabangan `if/else`, validasi hashing, dan exception handling berjalan sesuai aturan bisnis.

---

## 3. Langkah Implementasi Hari 9

### Langkah 9.1: Install Vitest

Jalankan terminal:
```bash
npm install -D vitest @types/node
```

Tambahkan script test di `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

### Langkah 9.2: Buat Konfigurasi `vitest.config.ts`

Buat file `vitest.config.ts` di root project:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    clearMocks: true,
  },
});
```

---

### Langkah 9.3: Buat Unit Test `BookingService`

Buat folder dan file `tests/unit/booking.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from '../../src/services/booking.service';
import { BookingRepository } from '../../src/repositories/booking.repository';

// Mock modul cache agar tidak memanggil Redis asli saat unit testing
vi.mock('../../src/utils/cache', () => ({
  getOrSetCache: vi.fn((key, ttl, fetcher) => fetcher()),
  invalidateCache: vi.fn(),
}));

describe('BookingService (Unit Test)', () => {
  let bookingService: BookingService;
  let mockBookingRepo: Partial<BookingRepository>;

  beforeEach(() => {
    // 1. Buat Mock Repository kosong sebelum tiap test case
    mockBookingRepo = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findBySlot: vi.fn(),
      createTransactional: vi.fn(),
    };

    bookingService = new BookingService(mockBookingRepo as BookingRepository);
  });

  it('harus mengembalikan daftar booking saat getAllBookings dipanggil', async () => {
    const mockBookings = [
      {
        id: '1',
        userId: 'usr-1',
        slotTime: '2026-09-10T10:00:00Z',
        status: 'CONFIRMED' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockBookingRepo.findAll as any).mockResolvedValue(mockBookings);

    const result = await bookingService.getAllBookings();

    expect(result).toEqual(mockBookings);
    expect(mockBookingRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('harus melempar error BOOKING_NOT_FOUND jika ID tidak ada', async () => {
    (mockBookingRepo.findById as any).mockResolvedValue(null);

    await expect(bookingService.getBookingById('id-palsu')).rejects.toThrow(
      'BOOKING_NOT_FOUND'
    );
  });

  it('harus berhasil membuat booking baru via transaksi', async () => {
    const newBookingInput = {
      userId: 'usr-1',
      slotTime: '2026-09-10T11:00:00Z',
    };

    const createdBooking = {
      id: '100',
      ...newBookingInput,
      status: 'CONFIRMED' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockBookingRepo.createTransactional as any).mockResolvedValue(createdBooking);

    const result = await bookingService.createBooking(newBookingInput);

    expect(result).toEqual(createdBooking);
    expect(mockBookingRepo.createTransactional).toHaveBeenCalledWith(newBookingInput);
  });
});
```

---

### Langkah 9.4: Buat Unit Test `AuthService`

Buat file `tests/unit/auth.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';

describe('AuthService (Unit Test)', () => {
  let authService: AuthService;
  let mockUserRepo: Partial<UserRepository>;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    };

    authService = new AuthService(mockUserRepo as UserRepository);
  });

  it('harus menolak registrasi jika email sudah terdaftar', async () => {
    (mockUserRepo.findByEmail as any).mockResolvedValue({
      id: 'usr-1',
      email: 'sudahada@example.com',
    });

    await expect(
      authService.register({
        name: 'User Duplikat',
        email: 'sudahada@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('EMAIL_ALREADY_EXISTS');
  });

  it('harus berhasil registrasi dan mengembalikan token jika data valid', async () => {
    (mockUserRepo.findByEmail as any).mockResolvedValue(null);

    const savedUser = {
      id: 'usr-123',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'USER' as const,
    };

    (mockUserRepo.create as any).mockResolvedValue(savedUser);

    const result = await authService.register({
      name: 'Budi',
      email: 'budi@example.com',
      password: 'passwordRahasia',
    });

    expect(result.user).toEqual(savedUser);
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });
});
```

---

## 4. Pengujian & Verifikasi Hari 9

Jalankan perintah pengujian:
```bash
npm test
```

**Hasil yang diharapkan**:
Semua test case berwarna hijau (`PASS`), dieksekusi dalam < 1 detik tanpa perlu membuka koneksi PostgreSQL/Redis.

---

# HARI 10: Integration Testing HTTP API (Supertest) ✅

Target: Memvalidasi *End-to-End flow* dari endpoint Express secara utuh (Router -> Middleware Rate Limiter -> Auth JWT -> Controller -> Service -> Response HTTP Status Code) menggunakan library **Supertest**.

---

## 1. Konsep & Padanan Laravel vs Express TS

| Konsep | Laravel | Express.js + TypeScript | Penjelasan Industri |
| :--- | :--- | :--- | :--- |
| **HTTP Test Driver** | `$this->getJson('/api/...')` | `request(app).get('/api/...')` (Supertest) | Mengirim request HTTP virtual langsung ke instance aplikasi Express |
| **Status Assertions** | `assertStatus(200)` | `expect(res.status).toBe(200)` | Memvalidasi status code HTTP respon |
| **Header Assertions** | `assertHeader('Authorization')` | `expect(res.headers).toHaveProperty(...)` | Memvalidasi header keamanan atau Bearer token |

---

## 2. Langkah Implementasi Hari 10

### Langkah 10.1: Install Supertest

Jalankan terminal:
```bash
npm install -D supertest @types/supertest
```

---

### Langkah 10.2: Pisahkan Ekspor Instance `app`

Agar Supertest dapat menguji aplikasi tanpa memblokir port `3000` (`EADDRINUSE`), pastikan `src/app.ts` mengekspor instance `app`:

Cek file `src/app.ts`, pastikan baris terakhir memiliki:
```typescript
export default app;
```

---

### Langkah 10.3: Buat Integration Test Auth API

Buat file `tests/integration/auth.api.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Auth API (Integration Test)', () => {
  const testUser = {
    name: 'Tester Integration',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let token: string;

  it('POST /api/v1/auth/register -> harus mengembalikan status 201 dan token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  it('POST /api/v1/auth/login -> harus mengembalikan status 200 dengan token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    token = res.body.data.tokens.accessToken;
  });

  it('GET /api/v1/auth/profile -> ditolak 401 jika tanpa token', async () => {
    const res = await request(app).get('/api/v1/auth/profile');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/profile -> berhasil 200 jika membawa Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('userId');
  });
});
```

---

### Langkah 10.4: Buat Integration Test Booking API

Buat file `tests/integration/booking.api.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Booking API (Integration Test)', () => {
  it('GET /api/v1/booking -> harus mengembalikan status 200 dan array daftar booking', async () => {
    const res = await request(app).get('/api/v1/booking');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /check -> endpoint health check sistem', async () => {
    const res = await request(app).get('/check');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
```

---

## 3. Pengujian & Verifikasi Hari 10

Jalankan test integrasi:
```bash
npm test
```

Tambahkan target test coverage di `package.json`:
```json
"scripts": {
  "test:coverage": "vitest run --coverage"
}
```

---

# HARI 11: Containerization (Production Multi-Stage Dockerfile)

Target: Membungkus aplikasi Express.js ke dalam image Docker yang aman, ringan (berbasis Alpine Linux), dan teroptimasi untuk production menggunakan teknik **Multi-Stage Build**.

---

## 1. Konsep & Padanan Laravel vs Express TS

| Konsep | Laravel | Express.js + TypeScript | Penjelasan Industri |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | PHP-FPM + Nginx Container | Node.js Runtime Container | Mesin tempat mengeksekusi kode aplikasi |
| **Build Artifact** | Tidak perlu compile (PHP interpreted) | `npm run build` -> JavaScript di `dist/` | TypeScript wajib di-compile ke pure JS sebelum jalan di server |
| **Dependency Trimming** | `composer install --no-dev` | `npm prune --production` | Menghapus compiler dev (`tsc`, `@types/*`, `vitest`) dari image final |
| **Image Size** | Standar Ubuntu (~800MB) | Multi-Stage Alpine (~120MB) | Pengecilan drastis ukuran image untuk kecepatan deploy & hemat kuota server |

---

## 2. Deep-Dive Konsep: Multi-Stage Build

```text
[ STAGE 1: BUILDER ]
├── Ambil node:20-alpine (~150MB)
├── Install SEMUA dependency (termasuk TypeScript, Vitest)
├── Eksekusi: npm run build (tsc) -> Menghasilkan folder dist/
└── Buang stage ini!

          ▼ (Hanya salin dist/ dan package.json)

[ STAGE 2: RUNNER (Production Final) ]
├── Ambil node:20-alpine bersih
├── Install HANYA production dependencies (npm install --omit=dev)
├── Salin hasil dist/ dari Stage 1
├── Jalankan sebagai Non-Root User (Keamanan)
└── Ukuran Final Image: Hanya ~100MB!
```

---

## 3. Langkah Implementasi Hari 11

### Langkah 11.1: Buat `.dockerignore`

Buat file `.dockerignore` di root project agar file lokal tidak terkirim ke Docker context:

```text
node_modules
dist
.env
.git
tests
npm-debug.log
```

---

### Langkah 11.2: Buat `Dockerfile` Multi-Stage

Buat file `Dockerfile` di root project:

```dockerfile
# ==========================================
# STAGE 1: Builder (Compile TypeScript ke JS)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Salin manifest dependensi & config ts
COPY package*.json tsconfig*.json ./

# Install dependensi (resolve native binary sesuai OS Linux)
RUN npm install -g npm@latest && npm install

# Salin source code
COPY src/ ./src

# Compile TypeScript menjadi file JavaScript murni di folder dist/
RUN npm run build

# ==========================================
# STAGE 2: Runner (Production Image Bersih)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment production
ENV NODE_ENV=production

# Salin manifest package
COPY package*.json ./

# Install HANYA dependencies production
RUN npm install --omit=dev && npm cache clean --force

# Ambil hasil build JS murni dari Stage 1
COPY --from=builder /app/dist ./dist

# Keamanan: Gunakan user non-root 'node' bawaan image Alpine
USER node

# Expose port aplikasi
EXPOSE 3000

# Perintah menjalankan server production
CMD ["node", "dist/app.js"]
```

---

## 4. Pengujian & Verifikasi Hari 11

1. **Build Image Docker**:
   * **Fungsi**: Membaca instruksi `Dockerfile`, mengompilasi TypeScript menjadi JavaScript (`dist/`), mengunduh dependencies production, dan membungkus seluruh aplikasi menjadi 1 file image mandiri yang siap dideploy ke server mana pun.
   * **Penjelasan Flag**:
     * `-t booking-engine-api:1.0`: Memberikan nama (*name*) dan versi tag pada image.
     * `.` (titik): Menunjuk direktori saat ini sebagai *build context* tempat `Dockerfile` berada.
   ```bash
   docker build -t booking-engine-api:1.0 .
   ```

2. **Periksa Ukuran Image**:
   * **Fungsi**: Memverifikasi bahwa teknik *Multi-Stage Build* berhasil membuang sampah compiler (`tsc`, `@types/*`, `vitest`) dan hanya menyisakan kode runtime yang bersih.
   * **Keuntungan Industri**:
     * Tanpa multi-stage: Ukuran image Node.js membengkak hingga **~800 MB – 1.2 GB**.
     * Dengan multi-stage Alpine: Ukuran terpangkas drastis menjadi hanya **~100 – 140 MB**.
     * Proses push/pull ke server cloud (AWS/DigitalOcean) menjadi **10x lebih cepat** dan sangat hemat bandwidth.
   ```bash
   docker images | grep booking-engine-api
   ```

---

# HARI 12: Multi-Container Orchestration (`docker-compose.yml`) ✅

Target: Menjalankan ekosistem backend lengkap (Aplikasi Express API + PostgreSQL Database + Redis In-Memory Cache) dalam 1 perintah otomatis, lengkap dengan **Healthcheck**, **Persistent Volume**, dan **Isolated Bridge Network**.

---

## 1. Konsep & Padanan Laravel vs Express TS

| Komponen Service | Peran di Ekosistem | Konfigurasi Docker |
| :--- | :--- | :--- |
| **`app`** | Backend API Express.js | Terhubung ke port `3000`, menunggu database & redis siap sebelum booting |
| **`postgres`** | Database utama ACID | PostgreSQL 16 Alpine, port `5432`, volume data persisten |
| **`redis`** | Cache & Rate Limiting store | Redis 7 Alpine, port `6379`, volume persisten |

---

## 2. Deep-Dive Konsep: Service Healthcheck Dependency

Masalah klasik di deployment:
* Container `app` menyala dalam 1 detik.
* Container `postgres` butuh 5 detik untuk inisialisasi file database.
* **Akibat jika tanpa healthcheck**: Aplikasi Express langsung crash dengan error `Connection Refused` karena mencoba konek ke database yang belum siap.

**Solusi Industri**:
Gunakan `healthcheck` pada container database, dan set `condition: service_healthy` pada container aplikasi Express.

---

## 3. Langkah Implementasi Hari 12

### Langkah 12.1: Buat File `docker-compose.yml`

Buat file `docker-compose.yml` di root project:

```yaml
services:
  # 1. Database Relasional PostgreSQL
  postgres:
    image: postgres:16-alpine
    container_name: booking_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-booking_db}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - booking_network

  # 2. Redis In-Memory Cache & Rate Limiter
  redis:
    image: redis:7-alpine
    container_name: booking_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - booking_network

  # 3. Aplikasi Backend Express API
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: booking_api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_NAME: ${DB_NAME:-booking_db}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      JWT_SECRET: ${JWT_SECRET:-secret_jwt_key_production}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-secret_jwt_refresh_key_production}
      EXPIRED_ACCESS_TOKEN: ${EXPIRED_ACCESS_TOKEN:-30m}
      EXPIRED_REFRESH_TOKEN: ${EXPIRED_REFRESH_TOKEN:-3d}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - booking_network

# Volume Persisten (Data tidak hilang saat container dimatikan)
volumes:
  postgres_data:
  redis_data:

# Jaringan Privat Terisolasi (Driver Bridge)
networks:
  booking_network:
    driver: bridge
```

#### Catatan Penting Mengenai `booking_network`:
* **Bebas Dinamai Apa Saja**: `booking_network` adalah **nama buatan kita sendiri** (custom identifier). Bisa diganti misal `backend_net` atau `jaringan_app`.
* **Fungsi DNS Otomatis**:
  Dengan menggabungkan ketiga container (`app`, `postgres`, `redis`) ke dalam satu jaringan bridge yang sama, Docker otomatis membuatkan **DNS Server internal**.
  * Di `app`, kamu tidak perlu pusing mencari IP address PostgreSQL (yang selalu berubah). Cukup panggil nama host-nya: `DB_HOST=postgres`.
  * Begitu juga Redis: cukup panggil `REDIS_HOST=redis`.
* **Isolasi Keamanan**: Database PostgreSQL dan Redis terisolasi di dalam jaringan privat ini, sehingga aplikasi atau container dari luar tidak bisa mengintip atau membobol koneksi database secara langsung.

---

## 4. Pengujian & Verifikasi Hari 12

1. **Jalankan Seluruh Ekosistem**:
   ```bash
   docker compose up -d
   ```

2. **Periksa Status Seluruh Service**:
   ```bash
   docker compose ps
   ```
   *Pastikan status `postgres` dan `redis` adalah `healthy`, dan `express_booking_engine_api` adalah `Up`.*

3. **Jalankan Migrasi Database di Dalam Container**:
   Karena PostgreSQL di container adalah database baru, jalankan migrasi schema:
   ```bash
   docker exec express_booking_engine_api node dist/databases/migrate.js
   ```

4. **Cek Log Aplikasi**:
   ```bash
   docker compose logs -f app
   ```
   *Terminal mencetak: `✅ Redis Client Connected` dan `[DATABASE]: Terhubung ke PostgreSQL`.*

5. **Uji Request API**:
   - `curl http://localhost:3000/check` -> Respon `200 OK` (Rate limiter aktif via Redis).
   - `curl http://localhost:3000/api/v1/booking` -> Respon `200 OK` (`{"status":"success","data":[]}`).

---

## 5. Catatan Perintah Docker Compose Penting & Troubleshooting

### A. Kontrol Container Tanpa Langsung Auto-Run
| Kebutuhan | Perintah | Penjelasan |
|---|---|---|
| **Build & Siapkan Container Saja** | `docker compose up --no-start` | Membuat container, volume, network tapi status tetap `Created` (tidak dijalankan). |
| **Nyalakan Manual Kapan Saja** | `docker compose start [service]` | Menjalankan container yang sudah dibuat sebelumnya (misal: `docker compose start app`). |
| **Nyalakan Sebagian Service Saja** | `docker compose up -d postgres redis` | Hanya menghidupkan database dan cache; container `app` dibiarkan mati. |
| **Mode Standby / Debugging** | Pasang `command: ["sleep", "infinity"]` di service | Container hidup tanpa mengeksekusi aplikasi Node.js. Masuk via `docker compose exec -it app sh` untuk run manual. |

### B. Troubleshooting: Port Collision (`address already in use` / `EAI_AGAIN`)
- **Masalah:** Jika di host WSL/Linux sudah terpasang PostgreSQL atau Redis lokal yang aktif di port `5432` atau `6379`, Docker akan gagal bind port host. Akibatnya container gagal join network bridge dan DNS internal `redis` tidak bisa di-resolve (`getaddrinfo EAI_AGAIN redis`).
- **Solusi 1 (Rekomendasi):** Hapus/komentari baris `ports: - "6379:6379"` pada service redis di `docker-compose.yml`. Container `app` dan `redis` tetap bisa saling panggil via network internal Docker tanpa butuh port host.
- **Solusi 2:** Matikan service lokal di host:
  ```bash
  sudo service redis-server stop
  sudo service postgresql stop
  ```

### C. Pemahaman `docker exec` & Migrasi Database
* **Apa itu `docker exec`?**
  Perintah untuk menyusup dan mengeksekusi program di dalam container yang sedang berjalan dari terminal luar (host).
* **Nyambung ke Database Mana?**
  **Pasti nyambung ke Database di dalam Container.**
  Ketika kamu menjalankan `node dist/databases/migrate.js` lewat `docker exec`, script tersebut berjalan di lingkungan internal container `app`. Script membaca `process.env.DB_HOST` yang bernilai `postgres` (DNS Docker). Sehingga yang dimigrasikan adalah PostgreSQL container (`express_booking_engine_postgres`), **bukan** PostgreSQL lokal WSL ataupun Windows.

#### Daftar Perintah Migrasi Database di Docker:
1. **Eksekusi Migrasi via Docker Compose (Rekomendasi)**:
   ```bash
   docker compose exec app node dist/databases/migrate.js
   ```
2. **Eksekusi Migrasi via Docker Standar (Menggunakan Container Name)**:
   ```bash
   docker exec express_booking_engine_api node dist/databases/migrate.js
   ```
3. **Cek Hasil Tabel Langsung di Dalam PostgreSQL Container (`psql`)**:
   ```bash
   docker compose exec postgres psql -U postgres -d postgres -c "\dt"
   # Catatan: ganti "postgres" setelah -d jika di .env kamu menggunakan nama database lain (misal: booking_db)
   ```

### D. Pengelolaan Environment Variable & File Aplikasi di Container

> **Prinsip Utama Docker (Ephemeral / Disposable):**
> **Jangan pernah mengedit file aplikasi atau file `.env` langsung di dalam container.** Image production (`alpine`) sengaja tidak memiliki text editor (`nano`/`vim`), dan setiap kali container di-restart atau di-rebuild, semua editan manual di dalam container akan **terhapus**.

#### 1. Cara Mengubah Environment Variables (Misal: `JWT_SECRET`, `PORT`, dll)
* **Metode 1: Edit file `.env` di Host (Paling Standar & Direkomendasikan)**
  Cukup ubah nilai variabel di file `.env` yang ada di folder project host kamu:
  ```env
  JWT_SECRET="rahasia_baru_super_aman_2026"
  ```
  Lalu terapkan pembaruan:
  ```bash
  docker compose up -d
  ```
  *Docker Compose otomatis membaca file `.env` host, mendeteksi variabel yang berubah, dan me-recreate container `app` secara mulus.*

* **Metode 2: Tulis Langsung di `docker-compose.yml`**
  Ubah langsung nilainya pada bagian blok `environment:` di `docker-compose.yml`:
  ```yaml
  environment:
    JWT_SECRET: "rahasia_baru_super_aman_2026"
  ```
  Lalu terapkan dengan `docker compose up -d`.

* **Cara Memverifikasi Nilai Env yang Sedang Aktif di Container**:
  ```bash
  docker compose exec app printenv JWT_SECRET
  # atau lihat seluruh env:
  docker compose exec app env
  ```

#### 2. Cara Update Source Code Aplikasi (Setelah Ada Perubahan Kode TS/JS)
Jika kamu memperbaiki bug atau menambahkan route baru di folder `src/`:
```bash
docker compose up -d --build app
```
* **Fungsi `--build app`**: Docker hanya akan meng-compile ulang source code aplikasi Express (`app`) dan me-recreate container `app`, **tanpa menyentuh atau mereset data di PostgreSQL dan Redis**.

### E. Panduan Dual-Mode: Full Docker vs Database Lokal Host

Di dalam file `docker-compose.yml`, kamu bisa bebas beralih antara 2 opsi:

| Opsi | Kapan Dipakai? | Yang Perlu Diubah di `docker-compose.yml` |
|---|---|---|
| **Opsi 1: Full Docker (Default)** | Mau aplikasi mandiri, database & cache terisolasi rapi di dalam container. | 1. Blok service `postgres:` tetap **aktif**.<br>2. Di service `app`: `DB_HOST: postgres`.<br>3. Di `depends_on:` cantumkan `postgres`. |
| **Opsi 2: Database Lokal Host** | Mau hemat RAM / mau pakai database yang terinstall di Windows/WSL agar mudah dilihat di DBeaver tanpa Docker. | 1. Komentari (`#`) seluruh blok service `postgres:`.<br>2. Di service `app`, aktifkan: `extra_hosts: ["host.docker.internal:host-gateway"]`.<br>3. Di `environment:`, ubah: `DB_HOST: host.docker.internal`.<br>4. Di `depends_on:`, komentari (`#`) dependensi `postgres:`. |

---

# HARI 13: Production Gateway - Nginx Reverse Proxy, Security Headers & Gzip Compression

> **Target:** Menempatkan Nginx sebagai *Front-Facing Bastion / Reverse Proxy* di depan Express API. Port `3000` Express dikunci rapat (tertutup dari internet), dan semua request publik wajib lewat Port `80` (HTTP) / `443` (HTTPS) dengan kompresi Gzip dan proteksi Security Headers (OWASP).

```
[ Klien / Browser / Postman ]
             │ (Port 80 / 443)
             ▼
    ┌─────────────────┐
    │  Nginx Gateway  │  <-- Gzip Compression + SSL + Security Headers + Rate Limit
    └────────┬────────┘
             │ (Jaringan Privat Terisolasi: express_booking_net)
             ▼
    ┌─────────────────┐
    │  Express API    │  (Port 3000 terkunci di internal, kebal serangan langsung)
    └────────┬────────┘
        ┌────┴────┐
        ▼         ▼
  [PostgreSQL] [Redis]
```

### 🎯 Tujuan Utama Arsitektur Ini:
1. **Menghindari Vulnerabilitas Node.js Single-Thread:**
   Node.js dirancang untuk logika bisnis, bukan melayani koneksi TCP mentah ribuan user secara bersamaan. Serangan sederhana seperti *Slowloris* (membuka ribuan koneksi lambat) bisa melumpuhkan Express jika diekspos langsung ke publik. Nginx menggunakan arsitektur *event-driven non-blocking epoll* yang mampu menahan puluhan ribu koneksi konkuren secara ringan.
2. **Menyembunyikan Port Aplikasi (`Port Hiding / Obfuscation`):**
   Membuka port non-standar seperti `3000` atau `8080` ke internet memberi petunjuk ke hacker tentang teknologi backend yang dipakai. Dengan Nginx, publik hanya melihat port standar web (`80` / `443`), sementara Express terisolasi di balik firewall internal Docker.
3. **Efisiensi Bandwidth (Gzip):**
   Response JSON dari database seringkali berukuran besar. Nginx memampatkan payload hingga 70% lebih kecil sebelum dikirim ke internet, menghemat kuota server dan mempercepat loading aplikasi klien.
4. **Proteksi OWASP Terpusat:**
   Header keamanan web diterapkan terpusat di pintu gerbang Nginx tanpa membebani komputasi Express API.

---

### Langkah 13.1: Membuat File Konfigurasi Nginx (`nginx/default.conf`)

Buat folder `nginx` di root project dan buat file konfigurasi `nginx/default.conf`:

```nginx
# 1. Upstream Backend Pool
upstream backend_api {
    server app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name localhost;

    # 2. Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        application/json
        text/plain
        application/javascript
        text/css
        application/xml;

    # 3. OWASP Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # 4. Request Body Limit (Anti Buffer Overflow)
    client_max_body_size 10M;

    # 5. Reverse Proxy Rules
    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;

        # Meneruskan Identitas Asli Klien (Krusial untuk Rate Limiter!)
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout Proteksi Server
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

> **🔍 Penjelasan Mendalam Maksud Konfigurasi:**
> - `keepalive 32`:
>   **Tujuan:** Mengaktifkan *TCP connection pooling* antara Nginx dan Express. Nginx tidak perlu repot membuka-tutup socket TCP baru setiap ada request datang. Ini menghemat latency handshake sebesar **10–20ms per request**.
> - `gzip_comp_level 6`:
>   **Tujuan:** Level 6 adalah *sweet spot* (titik optimum) industri antara penghematan ukuran data vs beban CPU. Level di atas 6 memakan CPU sangat boros namun hanya menghemat ukuran kurang dari 1%.
> - `gzip_min_length 256`:
>   **Tujuan:** Jangan mengompresi respon di bawah 256 byte. Respon yang terlalu kecil jika dikompresi justru ukurannya bisa membengkak karena overhead header gzip.
> - `X-Frame-Options "DENY"`:
>   **Tujuan Keamanan:** Mencegah situs lain menyematkan API/halaman kamu ke dalam tag `<iframe>`. Melindungi pengguna dari serangan penipuan **Clickjacking**.
> - `X-Content-Type-Options "nosniff"`:
>   **Tujuan Keamanan:** Melarang browser menebak-nebak tipe data (*MIME-type sniffing*). Jika server mengirim JSON, browser dipaksa membacanya sebagai JSON, mencegah eksekusi file berbahaya yang disamarkan.
> - `client_max_body_size 10M`:
>   **Tujuan Proteksi:** Membatasi ukuran body POST maksimal 10MB. Menangkal serangan **Denial of Service (DoS)** di mana penyerang mengirimkan string JSON berukuran ratusan megabyte untuk menghabiskan RAM server.
> - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`:
>   **Sangat Krusial:** Tanpa header ini, middleware Express (seperti Rate Limiter Redis kita) akan mengira **SEMUA request berasal dari IP Nginx (`172.18.0.x`)**. Akibatnya, jika satu pengguna nakal diblokir oleh Rate Limiter, **seluruh pengguna lain di internet akan ikut terblokir!** Header ini menjaga integritas IP asli pengguna.

---

### Langkah 13.2: Integrasi Nginx ke `docker-compose.yml`

Tambahkan service `nginx` dan isolasi service `app` di dalam jaringan internal:

```yaml
  # 4. Nginx Reverse Proxy Gateway
  nginx:
    image: nginx:alpine
    container_name: express_booking_engine_nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
    networks:
      - express_booking_net
```

> **🎯 Maksud & Tujuan Perubahan:**
> - `image: nginx:alpine`: Menggunakan image Nginx berbasis Alpine Linux yang berukuran sangat mungil (~20MB), menjaga efisiensi RAM dan disk server.
> - `:ro` (*Read-Only* Volume): Konfigurasi `default.conf` di-mount dengan mode baca-saja. Mencegah container merusak atau menimpa file konfigurasi di host jika container diretas.
> - **Kunci Port 3000 pada Service `app`:**
>   Pada service `app`, ubah `ports: - "3000:3000"` menjadi `expose: - "3000"`.
>   *Perbedaan fundamental:*
>   - `ports`: Membuka pintu gerbang ke dunia luar (host OS).
>   - `expose`: Hanya membuka pintu untuk container lain yang satu jaringan di internal Docker (`express_booking_net`). Express menjadi 100% terlindung di belakang Nginx.

---

### Langkah 13.3: Verifikasi & Pengujian Hari 13

1. **Nyalakan Seluruh Stack:**
   ```bash
   docker compose up -d
   ```
2. **Periksa Status Port:**
   ```bash
   docker compose ps
   ```
   *Pastikan hanya port `80` milik Nginx yang terbuka ke host (`0.0.0.0:80->80/tcp`), sedangkan port `3000` Express tidak lagi terbuka di host.*
3. **Uji Request Publik Melalui Nginx (Tanpa Port 3000):**
   ```bash
   curl -i http://localhost/check
   ```
4. **Verifikasi Output Header Respon:**
   Pastikan respon menyertakan header keamanan dan server gateway:
   ```text
   HTTP/1.1 200 OK
   Server: nginx/1.27.x
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   RateLimit-Limit: 100
   RateLimit-Remaining: 99
   Content-Type: application/json; charset=utf-8
   ```

---

# HARI 14: Automated CI/CD Pipeline (GitHub Actions) & Production Deployment

> **Target:** Membangun otomasi pengujian, build image, dan rilis aplikasi secara mulus (*Zero Manual Intervention*). Setiap developer melakukan `git push origin main`, GitHub Actions otomatis mengeksekusi testing, membungkus image Docker, dan mendistribusikannya ke server produksi secara aman.

```
[ Developer ] --( git push main )--> [ GitHub Repository ]
                                              │
                                              ▼
                                   [ GitHub Actions CI/CD ]
                                   ├─ 1. Run Vitest (11/11 tests pass)   <-- Gagal? Stop seketika!
                                   ├─ 2. Build Docker Multi-Stage Image  <-- Menggunakan Buildx
                                   ├─ 3. Push Image to Docker Hub        <-- Tag :latest & :SHA
                                   └─ 4. SSH to VPS -> Auto Deploy       <-- Pull & Live Reload
```

### 🎯 Tujuan Utama CI/CD:
1. **Menghilangkan Human Error ("Jumat Sore Bencana"):**
   Tidak ada lagi developer yang lupa menjalankan test sebelum deploy, atau salah ketik perintah saat SSH ke server produksi.
2. **Kualitas Kode Terjamin (*Quality Gatekeeper*):**
   Jika ada developer yang membuat perubahan kode yang menyebabkan salah satu dari 11 integration test gagal, pipeline akan otomatis **DIBATALKAN**. Kode rusak tidak akan pernah sampai menyentuh server VPS!
3. **Audit Trail & Kemudahan Rollback:**
   Setiap image Docker diberi label sesuai nomor SHA Commit GitHub. Jika rilis baru mengandung bug tersembunyi, sistem bisa di-rollback ke commit sebelumnya dalam hitungan detik.

---

### Langkah 14.1: Menyiapkan GitHub Secrets

> **Tujuan:** Kredensial rahasia (password, token, private key) **dilarang keras** di-hardcode ke dalam repository publik atau file commit Git karena dapat dicuri bot hacker dalam hitungan detik. GitHub Secrets mengenkripsi data sensitif ini menggunakan algoritma enkripsi asimetris NaCl.

Buka repository GitHub $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions** $\rightarrow$ **New repository secret**:

| Nama Secret | Tujuan & Nilai |
|---|---|
| `DOCKERHUB_USERNAME` | Username akun Docker Hub kamu (untuk autentikasi push image). |
| `DOCKERHUB_TOKEN` | Token otorisasi Docker Hub (Generate dari Docker Hub $\rightarrow$ Account Settings $\rightarrow$ Security). |
| `VPS_HOST` | Alamat IP Publik server VPS Linux tempat deploy (misal: `103.187.x.x`). |
| `VPS_USER` | Username login SSH di server VPS (misal: `ubuntu` atau `deployer`). |
| `VPS_SSH_KEY` | Private SSH Key komputer kamu (`id_rsa` / `ed25519`) agar GitHub Actions bisa login ke VPS tanpa password. |

---

### Langkah 14.2: Membuat File Workflow (`.github/workflows/deploy.yml`)

Buat file baru di direktori `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Production Pipeline

# Trigger: Pipeline hanya berjalan jika ada kode yang di-merge/push ke branch main
on:
  push:
    branches: [ "main" ]

jobs:
  # =========================================================================
  # JOB 1: AUTOMATED TESTING (CONTINUOUS INTEGRATION)
  # =========================================================================
  test:
    name: Run Automated Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm' # Caching node_modules agar eksekusi pipeline cepat

      - name: Install Dependencies
        run: npm ci # Menginstall versi eksak sesuai package-lock.json (anti desinkronisasi)

      - name: Run Vitest Unit & Integration Tests
        run: npm run test # Wajib 11/11 test LULUS

  # =========================================================================
  # JOB 2: BUILD & PUSH DOCKER IMAGE
  # =========================================================================
  build-and-push:
    name: Build & Push Docker Image
    needs: test # SYARAT MUTLAK: Hanya jalan jika Job 1 (test) LULUS 100%!
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile
          push: true
          # Tag ganda: 'latest' untuk rilis terkini, dan 'commit SHA' untuk riwayat audit & rollback
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/express-booking-api:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/express-booking-api:${{ github.sha }}

  # =========================================================================
  # JOB 3: AUTO DEPLOYMENT KE VPS (CONTINUOUS DEPLOYMENT)
  # =========================================================================
  deploy:
    name: Deploy to Production VPS
    needs: build-and-push # Hanya jalan jika image sudah sukses ter-upload ke Docker Hub
    runs-on: ubuntu-latest
    steps:
      - name: Execute Remote SSH Commands
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            # 1. Pindah ke direktori project di server VPS
            cd /opt/express-booking-engine-api
            
            # 2. Unduh image aplikasi versi terbaru dari Docker Hub
            docker compose pull app
            
            # 3. Reload container app tanpa mematikan database postgres dan redis
            docker compose up -d --no-deps app
            
            # 4. Jalankan migrasi jika ada pembaruan tabel skema
            docker compose exec app node dist/databases/migrate.js
            
            # 5. Bersihkan image usang agar harddisk VPS tidak penuh
            docker system prune -f
```

> **🔍 Penjelasan Mendalam Perintah Deploy di VPS:**
> - `docker compose pull app`:
>   **Tujuan:** Menarik image matang yang baru saja di-build oleh GitHub Actions. Server VPS tidak perlu melakukan compile TypeScript (`npm run build`) sehingga CPU dan RAM server tetap dingin dan stabil.
> - `docker compose up -d --no-deps app`:
>   **Tujuan:** Opsi `--no-deps` memastikan bahwa Docker **hanya me-reload container Express (`app`)**, tanpa menyentuh, mereset, atau mematikan database PostgreSQL dan Redis. Transaksi database user tetap berjalan mulus (*Near Zero-Downtime Deployment*).
> - `docker compose exec app node dist/databases/migrate.js`:
>   **Tujuan:** Otomatisasi migrasi database di server produksi jika rilis baru membawa tabel atau kolom baru.
> - `docker system prune -f`:
>   **Tujuan:** Menghapus image versi lama yang tidak terpakai (*dangling images*) agar kapasitas harddisk server VPS tidak cepat habis seiring banyaknya rilis.

---

### Langkah 14.3: Panduan README.md Portofolio CV & Showcase Industri

> **Tujuan:** File `README.md` adalah dokumen pembuktian teknis (*Proof of Competence*) di hadapan Tech Lead / Recruiter. README yang berstandar enterprise menjelaskan secara gamblang arsitektur sistem, problem yang dipecahkan, keputusan teknologi yang diambil, dan kemudahan bagi engineer lain untuk menjalankan project hanya dengan 1 perintah.

Susun file `README.md` di root project dengan format profesional berikut:

```markdown
# 🚀 Enterprise Booking Engine API

Production-ready RESTful Booking Engine API dengan arsitektur berlapis (Clean Architecture), konkurensi anti double-booking (ACID Transactions), otentikasi token JWT dengan Refresh Token Rotation, distributed in-memory caching Redis, multi-stage Docker containerization, Nginx Gateway, dan automated CI/CD pipeline.

## 🛠️ Tech Stack & Arsitektur
- **Runtime & Language:** Node.js 22 LTS, TypeScript 5 (Strict Mode).
- **Web Framework:** Express 5.
- **Relational Database:** PostgreSQL 16 (Raw SQL, Repository Pattern, Pessimistic Row-Level Locking).
- **In-Memory Cache & Limiter:** Redis 7 (Cache-Aside pattern, Distributed Rate Limiting via Redis store).
- **Security:** Bcrypt (10 salt rounds), JWT Access Token (30m) & Refresh Token (3d) Rotation, OWASP Security Headers.
- **Testing:** Vitest, Supertest (100% unit & integration test coverage).
- **DevOps & Gateway:** Docker, Docker Compose, Nginx Reverse Proxy, Gzip Compression.
- **CI/CD:** GitHub Actions (Automated Test -> Buildx Multi-stage -> Docker Hub -> SSH Deployment).

## 💡 Masalah Nyata yang Dipecahkan (Engineering Highlights)
1. **Pencegahan Double-Booking (Race Condition):**
   Mengimplementasikan isolasi database ACID dan *Pessimistic Locking* (`SELECT ... FOR UPDATE`) serta *Unique Partial Index*, menjamin tidak akan ada dua pengguna yang berhasil memesan slot/kursi yang sama meski request masuk di milidetik yang identik.
2. **Mitigasi Brute Force & DDoS:**
   Sistem Rate Limiter terdistribusi berbasis Redis mengunci kuota request per IP secara konsisten di seluruh cluster container.
3. **Ultra Fast Data Retrieval:**
   Penerapan pola *Cache-Aside* dengan TTL dinamis dan mekanisme *Auto Cache Invalidation* otomatis saat terjadi transaksi baru.

## ⚡ Quick Start (1 Perintah)
```bash
# 1. Clone repository
git clone https://github.com/username/express-booking-engine-api.git
cd express-booking-engine-api

# 2. Siapkan file konfigurasi environment
cp .env.example .env

# 3. Jalankan seluruh ekosistem (Nginx, Express, Postgres, Redis)
docker compose up -d

# 4. Inisialisasi skema tabel database
docker compose exec app node dist/databases/migrate.js
```
API siap diakses publik pada alamat: `http://localhost/api/v1/booking`.

## 🧪 Menjalankan Automated Test
```bash
npm run test
```

## 📚 Endpoint API Documentation
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Registrasi user baru (Bcrypt hashed) |
| `POST` | `/api/v1/auth/login` | Public | Login & dapatkan Access + Refresh Token |
| `POST` | `/api/v1/auth/refresh` | Public | Rotasi token baru (Refresh Token Rotation) |
| `GET`  | `/api/v1/booking` | Public/User | Ambil semua booking (Terakselerasi Redis Cache) |
| `POST` | `/api/v1/booking` | Bearer Token | Buat reservasi booking baru (Anti Double-Booking) |
| `GET`  | `/check` | Public | Healthcheck status server & Rate Limiter |
```

---

## 7. Checkpoint Kelulusan Sprint 14 Hari (Graduation Checklist 🎓)

Selamat! Kamu telah membangun ekosistem backend standar industri dari nol sampai level production:
- [x] **Fondasi & Arsitektur:** TypeScript Clean Architecture 3-Layer (Controller, Service, Repository).
- [x] **Database & Concurrency:** PostgreSQL Transaction, Migration DDL, Row-Level Locking anti double-booking.
- [x] **Keamanan Otentikasi:** Password hashing Bcrypt, JWT Access Token & Refresh Token, RBAC Middleware.
- [x] **Performance & Scalability:** Cache-Aside Redis dengan TTL, Auto Cache Invalidation, Distributed Rate Limiter.
- [x] **Quality Assurance:** 11/11 Automated Integration Tests dengan Vitest lulus 100%.
- [x] **Containerization:** Multi-stage Dockerfile (hemat image hingga 60MB), Docker Compose multi-service.
- [x] **Production Gateway:** Nginx Reverse Proxy, OWASP Security Headers, Gzip payload compression.
- [x] **DevOps Automation:** GitHub Actions CI/CD pipeline otomatis build, test, dan deploy ke VPS.
- [x] **Portfolio Showcase:** README dokumentasi standar industri siap cantum di CV / LinkedIn!





