import rateLimit from  'express-rate-limit';
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
  skip: () => process.env.NODE_ENV === "dev", // Bypass rate limiter saat automated test agar tidak kena HTTP 429
  message: {
    status: "fail",
    message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.",
  },
  /**
   * Adapter Penyimpanan State (RedisStore):
   * Mengalihkan pencatatan hitungan request dari RAM lokal Node.js ke database Redis terpusat.
   * Keuntungan: Jika server dijalankan di multi-worker/cluster (PM2, Docker 2 container),
   * batasan kuota tetap akurat & sinkron di seluruh instance server.
   */
  store: new RedisStore({
    // @ts-expect-error - compatibility signature ioredis call
    // sendCommand: Jembatan eksekusi script Lua atomik (INCR, EXPIRE) dari adapter ke client ioredis
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
  skip: () => process.env.NODE_ENV === "dev", // Bypass rate limiter saat automated test
  message: {
    status: "fail",
    message: "Terlalu banyak percobaan autentikasi. Akses ditangguhkan sementara selama 5 menit.",
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
  skip: () => process.env.NODE_ENV === "dev", // Bypass rate limiter saat automated test
  message: {
    status: "fail",
    message: "Terlalu banyak order dibuat dalam waktu singkat. Harap tunggu sebentar.",
  },
  store: new RedisStore({
    // @ts-expect-error - compatibility signature ioredis call
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:booking:', // Key khusus booking (contoh di Redis: rl:booking:127.0.0.1)
  }),
});
