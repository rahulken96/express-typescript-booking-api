import { BookingRepository } from "../repositories/booking.repository";
import { Booking, CreateBookingDTO } from "../types/booking.types";
import { getOrSetCache, invalidateCache } from "../utils/cache";

/**
 * SERVICE LAYER (Setara BookingService.php / Action Class di Laravel)
 * Tempat menaruh seluruh aturan & logika bisnis.
 */
export class BookingService {
    // Dependency Injection: Setara __construct(protected BookingRepository $bookingRepo) di Laravel 8+
    constructor(private bookingRepo: BookingRepository) {}

    // Return type Promise<Booking[]>: Setara public function getAllBookings(): array di Laravel
    async getAllBookings(): Promise<Booking[]> {
        // return this.bookingRepo.findAll();

        return await getOrSetCache("bookings:all", 60, async () => {
            return await this.bookingRepo.findAll();
        });
    }

    // Return type Promise<Booking>: Setara p   ublic function getBookingById(string $id): Booking di Laravel
    async getBookingById(id: string): Promise<Booking> {
        // const booking = await this.bookingRepo.findById(id);
        // if (!booking) {
        //     // Throw Exception: Setara ModelNotFoundException / abort(404) di Laravel
        //     throw new Error("BOOKING_NOT_FOUND");
        // }
        // return booking;

        return await getOrSetCache(`booking:${id}`, 60, async () => {
            const booking = await this.bookingRepo.findById(id);
            if (!booking) {
                throw new Error("BOOKING_NOT_FOUND");
            }
            return booking;
        });
    }

    // DTO Parameter: Setara menerima data tervalidasi dari StoreBookingRequest $request di Laravel
    async createBooking(data: CreateBookingDTO): Promise<Booking> {
        // ATURAN BISNIS: Mencegah double-booking pada slot waktu yang sama
        // const existing = await this.bookingRepo.findBySlot(data.slotTime);
        // if (existing) {
        //     throw new Error("SLOT_ALREADY_BOOKED");
        // }
        // return this.bookingRepo.create(data);

        // return this.bookingRepo.createTransactional(data);

        // 1. Eksekusi booking dengan transaksi atomik & lock (Hari 4)
        const booking = await this.bookingRepo.createTransactional(data);

        // 2. Cache Invalidation: Hapus cache daftar booking agar list langsung terupdate
        await invalidateCache("bookings:all");

        return booking;
    }
}
