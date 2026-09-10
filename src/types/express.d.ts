import { JwtPayload } from "./auth.types";

declare global {
    namespace Express {
        interface Request {
            // Tambahkan properti user yang akan diisi oleh authMiddleware
            user?: JwtPayload;
        }
    }
}
