/* ============== Bentuk Model ================= */

/**
 * ENTITY MODEL (Tabel PostgreSQL: users)
 * Representasi 1 baris utuh data user di database.
 * Setara dengan: Eloquent Model App\Models\User di Laravel.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional saat di-return ke response (agar hash tidak bocor)
  role: 'ADMIN' | 'USER';
  createdAt?: Date;
  updatedAt?: Date;
}

/* ============== Bentuk Form Request ================= */

/**
 * DATA TRANSFER OBJECT (DTO) - Input Registrasi
 * Format payload yang dikirim klien via HTTP POST body saat mendaftar.
 * Setara dengan: App\Http\Requests\RegisterRequest di Laravel.
 */
export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

/**
 * DATA TRANSFER OBJECT (DTO) - Input Login
 * Format payload yang dikirim klien via HTTP POST body saat login.
 * Setara dengan: App\Http\Requests\LoginRequest di Laravel.
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/* ============== Bentuk Resource (Format Output/Mapping) ================= */

/**
 * RESPONSE CONTRACT - Token Hasil Autentikasi
 * Format balasan saat user berhasil login / register.
 */
export interface AuthTokens {
  accessToken: string;  // Token durasi pendek (15m) untuk akses API
  refreshToken: string; // Token durasi panjang (7d) untuk perpanjang accessToken
}

/**
 * JWT PAYLOAD CONTRACT
 * Struktur data yang disisipkan (di-encode) ke dalam token JWT.
 * Data ini yang akan dibaca oleh authMiddleware dan ditempel ke req.user,
 * sekaligus data yang akan selalu dibawah oleh user sebagai akses sampai re-login atau update profile
 */
export interface JwtPayload {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
