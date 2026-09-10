import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Connection Pool:
// Mengelola sekumpulan koneksi siap pakai agar tidak perlu handshake TCP berulang kali di tiap request
export const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_NAME || "booking_db",
    max: 5, // Maksimal 5 koneksi simultan di pool
    idleTimeoutMillis: 30000, // 30 detik
    connectionTimeoutMillis: 2000, // 2 detik

    /* Otomatis arahkan semua query pool ke schema 'booking_app' */
    // options: "-c search_path=booking_app,public",
});

// Event listener untuk memantau status koneksi pool
pool.on("connect", () => {
    console.info("[✅ DATABASE]: Terhubung ke PostgreSQL");
});

pool.on("error", (err) => {
    console.error("[❌ DATABASE ERROR]:", err);
});
