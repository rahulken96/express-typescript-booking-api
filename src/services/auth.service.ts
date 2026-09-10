import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from '../repositories/user.repository';
import { RegisterDTO, LoginDTO, User, AuthTokens, JwtPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "supersecret_access_key";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "supersecret_refresh_key";

const EXPIRED_ACCESS_TOKEN = process.env.EXPIRED_ACCESS_TOKEN || "15m";
const EXPIRED_REFRESH_TOKEN = process.env.EXPIRED_REFRESH_TOKEN || "7d";

export class AuthService {
    constructor(
        private userRepo: UserRepository
    ) {}

    // Membuat format req.u
    generateTokens(payload: JwtPayload): AuthTokens {
        const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: EXPIRED_ACCESS_TOKEN as jwt.SignOptions['expiresIn'],
        });
        const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
            expiresIn: EXPIRED_REFRESH_TOKEN as jwt.SignOptions['expiresIn'],
        });
        return { accessToken, refreshToken };
    }

    async register(data: RegisterDTO): Promise<{ user: User; tokens: AuthTokens }> {
        // 1. Cek email unik
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw new Error("EMAIL_ALREADY_EXISTS");
        }

        // 2. Hash password (Cost factor 10)
        const passwordHash = await bcrypt.hash(data.password, 10);
        const id = `usr-${Date.now()}`;

        // 3. Simpan ke database
        const user = await this.userRepo.create({
            ...data,
            id,
            passwordHash,
        });

        // 4. Buat JWT
        const tokens = this.generateTokens({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

        return { user, tokens };
    }

    async login(data: LoginDTO): Promise<{ user: User; tokens: AuthTokens }> {
        // 1. Cari user berdasarkan email
        const user = await this.userRepo.findByEmail(data.email);
        if (!user || !user?.password) {
            throw new Error("INVALID_CREDENTIALS");
        }

        // 2. Verifikasi password hash
        const isValid = await bcrypt.compare(data.password, user.password);
        if (!isValid) {
            throw new Error("INVALID_CREDENTIALS");
        }

        // 3. Buat JWT
        const tokens = this.generateTokens({
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

        // Jangan return password hash ke response
        delete user.password;
        return { user, tokens };
    }
}
