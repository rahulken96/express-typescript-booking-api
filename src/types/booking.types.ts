// Struktur objek Booking lengkap yang disimpan di sistem
export interface Booking {
  id: string;
  userId: string;
  slotTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

// DTO (Data Transfer Object): Data yang BOLEH dikirim oleh client saat membuat booking baru
export interface CreateBookingDTO {
  userId: string;
  slotTime: string;
}