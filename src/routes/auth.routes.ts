import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();
const userRepo = new UserRepository();
const authService = new AuthService(userRepo);
const authController = new AuthController(authService);

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/profile', authenticate, authController.profile);

export default router;