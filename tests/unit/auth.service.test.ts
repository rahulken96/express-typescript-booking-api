import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth.service";
import { UserRepository } from "@/repositories/user.repository";

describe("AuthService (Unit Test)", () => {
    let authService: AuthService;
    let mockUserRepo: Partial<UserRepository>;

    // Reset dan inisialisasi mock sebelum tiap test case berjalan
    beforeEach(() => {
        // Mock method repository agar test fokus ke logic service tanpa akses DB asli
        mockUserRepo = {
            findByEmail: vi.fn(),
            create: vi.fn(),
            findById: vi.fn(),
        };

        // Inject mock ke instance AuthService
        authService = new AuthService(mockUserRepo as UserRepository);
    });

    // Test Case 1: Negative Path - Registrasi ditolak saat email duplikat
    it("harus menolak registrasi jika email sudah terdaftar", async () => {
        // [Arrange] Simulasikan repository menemukan email yang sama di DB
        (mockUserRepo.findByEmail as any).mockResolvedValue({
            id: "usr-1",
            email: "sudahada@example.com",
        });

        // [Act & Assert] Pastikan service melempar error EMAIL_ALREADY_EXISTS
        await expect(
            authService.register({
                name: "User Duplikat",
                email: "sudahada@example.com",
                password: "password123",
            }),
        ).rejects.toThrow("EMAIL_ALREADY_EXISTS");
    });

    // Test Case 2: Happy Path - Registrasi berhasil dan mengembalikan token auth
    it("harus berhasil registrasi dan mengembalikan token jika data valid", async () => {
        // [Arrange] Email belum dipakai (null), dan DB berhasil simpan user baru
        (mockUserRepo.findByEmail as any).mockResolvedValue(null);

        const savedUser = {
            id: "usr-123",
            name: "Budi",
            email: "budi@example.com",
            role: "USER" as const,
        };

        (mockUserRepo.create as any).mockResolvedValue(savedUser);

        // [Act] Jalankan fungsi register
        const result = await authService.register({
            name: "Budi",
            email: "budi@example.com",
            password: "passwordRahasia",
        });

        // [Assert] Verifikasi response user dan ketersediaan JWT token
        expect(result.user).toEqual(savedUser);
        expect(result.tokens.accessToken).toBeDefined();
        expect(result.tokens.refreshToken).toBeDefined();
    });
});
