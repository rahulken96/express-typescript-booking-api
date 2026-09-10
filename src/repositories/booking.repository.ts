import { Booking, CreateBookingDTO } from '../types/booking.types';
import { pool } from '../config/database';

/**
 * REPOSITORY LAYER (PostgreSQL Implementation)
 * Tanggung Jawab: Murni eksekusi query database menggunakan SQL murni.
 */

export class BookingRepository {
  // Penyimpanan data sementara di memori RAM
  // private bookings: Booking[] = [];

  async findAll(): Promise<Booking[]> {
    // return this.bookings;

    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      ORDER BY created_at DESC;
    `;
    const result = await pool.query<Booking>(query);
    return result.rows;
  }

  async findById(id: string): Promise<Booking | null> {
    // return this.bookings.find((b) => b.id === id) || null;

    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      WHERE id = $1;
    `;
    const result = await pool.query<Booking>(query, [id]);
    return result.rows[0] || null;
  }

  async findBySlot(slotTime: string): Promise<Booking | null> {
    // return this.bookings.find((b) => b.slotTime === slotTime && b.status !== 'CANCELLED') || null;

    const query = `
      SELECT id, user_id as "userId", slot_time as "slotTime", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM bookings
      WHERE slot_time = $1 AND status != 'CANCELLED';
    `;
    const result = await pool.query<Booking>(query, [slotTime]);
    return result.rows[0] || null;
  }

  async create(data: CreateBookingDTO): Promise<Booking> {
    // const newBooking: Booking = {
    //   id: String(Date.now()),
    //   userId: data.userId,
    //   slotTime: data.slotTime,
    //   status: 'CONFIRMED',
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // };
    // this.bookings.push(newBooking);
    // return newBooking;

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
}