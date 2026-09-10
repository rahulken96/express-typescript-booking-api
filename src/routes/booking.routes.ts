import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { BookingService } from '../services/booking.service';
import { BookingRepository } from '../repositories/booking.repository';
import { bookingLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

// Inisialisasi dependency secara hierarki
const repo = new BookingRepository();
const service = new BookingService(repo);
const controller = new BookingController(service);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', bookingLimiter, controller.create);

export default router;