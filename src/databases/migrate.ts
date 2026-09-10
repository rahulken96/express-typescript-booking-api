import { pool } from "../config/database";

const migrate = async () => {
    const clientPool = await pool.connect();
    try {
        console.log("[MIGRATION]: Menjalankan migrasi tabel...");

        // 1. Buat Schema jika belum ada (misal nama schema: "booking_app")
        // await clientPool.query(`CREATE SCHEMA IF NOT EXISTS booking_app;`);

        // 2. `Set "search_path"` agar semua query berikutnya otomatis masuk ke schema ini
        // await clientPool.query(`SET search_path TO booking_app;`);

        // 3. Buat Tabel Users
        await clientPool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(100) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'USER',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Buat Tabel Bookings
        await clientPool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                slot_time VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("[MIGRATION SUKSES]: Tabel users & bookings berhasil disiapkan.");

        await clientPool.query(`
            ALTER TABLE bookings 
            DROP CONSTRAINT IF EXISTS unique_active_slot;

            ALTER TABLE bookings 
            ADD CONSTRAINT unique_active_slot UNIQUE (slot_time);
        `);

        console.log("[MIGRATION SUKSES]: Constraint unique_active_slot berhasil ditambahkan.");
    } catch (err) {
        console.error("[MIGRATION GAGAL]:", err);
    } finally {
        clientPool.release();
        await pool.end();
    }
};

migrate();
