import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';

/**
 * CONTROLLER LAYER (Setara BookingController.php di Laravel)
 * Tanggung Jawab: Menerima HTTP Request ($request), panggil Service, return Response JSON ($response->json()).
 */
export class BookingController {
  // Dependency Injection: Setara __construct(protected BookingService $bookingService) di Laravel
  constructor(
    private bookingService: BookingService
  ) {}

  // Arrow function: Dipakai agar 'this.bookingService' tidak hilang konteks saat dipanggil Express Router
  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.bookingService.getAllBookings();
      // res.status(200).json(): Setara return response()->json(['status' => 'success', 'data' => $data], 200) di Laravel
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      // next(err): Lempar exception ke Global Error Handler (Setara handler.php / abort() di Laravel)
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.params.id as string: Setara mengambil $request->route('id') / $id di Laravel
      const data = await this.bookingService.getBookingById(req.params.id as string);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.body: Setara $request->only(['userId', 'slotTime']) atau $request->validated() di Laravel
      const { userId, slotTime } = req.body;
      const data = await this.bookingService.createBooking({ userId, slotTime });
      // res.status(201).json(): Setara return response()->json($data, 201) di Laravel
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };
}
