import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {
    constructor(
        private authService: AuthService
    ) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.register(req.body);
            return res.status(201).json({
                status: "success",
                message: "Registrasi berhasil",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.login(req.body);
            return res.status(200).json({
                status: "success",
                message: "Login berhasil",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    profile = async (req: Request, res: Response) => {
        return res.status(200).json({
            status: "success",
            data: req.user,
        });
    };
}
