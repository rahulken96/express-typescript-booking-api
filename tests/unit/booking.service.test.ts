import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingService } from "@/services/booking.service";
import { BookingRepository } from "@/repositories/booking.repository";

// Mock modul cache agar tidak memanggil Redis asli saat unit testing
vi.mock("@/utils/cache", () => ({
    getOrSetCache: vi.fn((key, ttl, fetcher) => fetcher()),
    invalidateCache: vi.fn(),
}));

describe("BookingService (Unit Test)", () => {
    let bookingService: BookingService;
    let mockBookingRepo: Partial<BookingRepository>;

    // Dijalankan sebelum setiap block test (`it`) untuk isolasi state (mencegah leak antar test)
    beforeEach(() => {
        // Mock implementasi method repository menggunakan vi.fn()
        mockBookingRepo = {
            findAll: vi.fn(),
            findById: vi.fn(),
            findBySlot: vi.fn(),
            createTransactional: vi.fn(),
        };

        // Dependency Injection: inject repository palsu ke service
        bookingService = new BookingService(mockBookingRepo as BookingRepository);
    });

    // Test Case 1: Happy Path - Ambil semua data booking
    it("harus mengembalikan daftar booking saat getAllBookings dipanggil", async () => {
        // [LANGKAH 1: ARRANGE - Persiapan Skenario & Data]
        // 1a. Siapkan data dummy yang diharapkan keluar dari database
        const mockBookings = [
            {
                id: "1",
                userId: "usr-1",
                slotTime: "2026-09-10T10:00:00Z",
                status: "CONFIRMED" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        // 1b. Intercept DB: saat service panggil bookingRepo.findAll(),
        // jangan query database asli, tapi paksa return Promise.resolve(mockBookings).
        (mockBookingRepo.findAll as any).mockResolvedValue(mockBookings);

        // [LANGKAH 2: ACT - Eksekusi Unit Yang Diuji]
        // Jalankan method service. Flow internal:
        // bookingService.getAllBookings()
        //   -> masuk getOrSetCache() (kena mock di line 6 -> langsung execute fetcher)
        //   -> fetcher memanggil mockBookingRepo.findAll()
        //   -> mock mengembalikan data mockBookings di atas.
        const result = await bookingService.getAllBookings();

        // [LANGKAH 3: ASSERT - Validasi & Verifikasi]
        // 3a. Validasi Output: nilai return service harus identik dengan mockBookings
        expect(result).toEqual(mockBookings);

        // 3b. Validasi Interaksi: pastikan service benar memanggil findAll() tepat 1 kali
        // (menjamin data tidak di-fetch berulang atau ke-skip)
        expect(mockBookingRepo.findAll).toHaveBeenCalledTimes(1);
    });

    // Test Case 2: Negative Path - Data booking tidak ditemukan berdasarkan ID
    it("harus melempar error BOOKING_NOT_FOUND jika ID tidak ada", async () => {
        // [Arrange] Simulasikan database mengembalikan null (data tidak ada)
        (mockBookingRepo.findById as any).mockResolvedValue(null);

        // [Act & Assert] Pastikan promise melempar error dengan message yang tepat
        await expect(bookingService.getBookingById("id-palsu")).rejects.toThrow("BOOKING_NOT_FOUND");
    });

    // Test Case 3: Happy Path - Pembuatan booking baru melalui database transaction
    it("harus berhasil membuat booking baru via transaksi", async () => {
        // [Arrange] Siapkan input booking dan hasil return simulasi database
        const newBookingInput = {
            userId: "usr-1",
            slotTime: "2026-09-10 11:00",
        };

        const createdBooking = {
            id: "100",
            ...newBookingInput,
            status: "CONFIRMED" as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        (mockBookingRepo.createTransactional as any).mockResolvedValue(createdBooking);

        // [Act] Jalankan method createBooking
        const result = await bookingService.createBooking(newBookingInput);

        // [Assert] Pastikan hasil sesuai dan method repository dipanggil dengan parameter yang benar
        expect(result).toEqual(createdBooking);
        expect(mockBookingRepo.createTransactional).toHaveBeenCalledWith(newBookingInput);
    });
});
