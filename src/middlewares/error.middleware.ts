import { Request, Response, NextFunction } from 'express';

// Middleware 4 parameter: Express otomatis mengenalinya sebagai Error Handler
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // 1. Error dari Aturan Bisnis Service
  if (err?.message === 'BOOKING_NOT_FOUND') {
    return res.status(404).json({ status: 'fail', message: 'Booking tidak ditemukan' });
  }
  if (err?.message === 'SLOT_ALREADY_BOOKED') {
    return res.status(409).json({ status: 'fail', message: 'Slot waktu sudah terisi sebelumnya' });
  }
  if (err?.message === 'INVALID_CREDENTIALS') {
    return res.status(401).json({ status: 'fail', message: 'Email atau password salah!' });
  }

  // 2. Error dari Database Constraint PostgreSQL (Kode 23505 = Unique Violation / Bentrok Concurrency)
  if ((err as any)?.code == '23505') {
    return res.status(409).json({ 
      status: 'fail', 
      message: 'Slot waktu .' 
    });
  }

  // Jika error tidak dikenal, log ke console dan kirim 500
  console.error('[UNHANDLED ERROR]:', err);
  return res.status(500).json({ status: 'error', message: 'Masalah Server Tidak Diketahui' });
};