import { describe, it, expect } from "vitest";
import request from "supertest"; // Library HTTP assertion untuk simulasi request Express tanpa manual start server
import app from "@/app"; // Instance Express Application utama

describe("Auth API (Integration Test)", () => {
    // [STATE TEST]: Data user dinamis menggunakan timestamp agar selalu unik di database fisik
    const testUser = {
        name: "Tester Integration",
        email: `test-${Date.now()}@example.com`,
        password: "Password123!",
    };

    // Variabel penampung token untuk diteruskan antar skenario test (State Sharing)
    let token: string;

    // Skenario 1: Registrasi User Baru (E2E: Router -> Controller -> Service -> DB Hash Password)
    it("POST /api/v1/auth/register -> harus mengembalikan status 201 dan token", async () => {
        // [Act] Kirim HTTP POST request dengan payload JSON via .send()
        const res = await request(app).post("/api/v1/auth/register").send(testUser);

        // [Assert] Validasi HTTP Status Code 201 (Created) & response envelope
        expect(res.status).toBe(201);
        expect(res.body.status).toBe("success");
        expect(res.body.data.tokens).toHaveProperty("accessToken");
    });

    // Skenario 2: Autentikasi / Login (E2E: Validasi bcrypt compare & sign JWT token)
    it("POST /api/v1/auth/login -> harus mengembalikan status 200 dengan token", async () => {
        // [Act] Kirim HTTP POST login menggunakan kredensial user yang baru didaftarkan
        const res = await request(app).post("/api/v1/auth/login").send({
            email: testUser.email,
            password: testUser.password,
        });

        // [Assert] Pastikan status 200 (OK) dan simpan accessToken ke variabel `token`
        expect(res.status).toBe(200);
        expect(res.body.data.tokens).toHaveProperty("accessToken");
        token = res.body.data.tokens.accessToken; // Disimpan untuk dipakai di Skenario 4
    });

    // Skenario 3: Proteksi Endpoint / Middleware Security (Tanpa JWT Token)
    it("GET /api/v1/auth/profile -> ditolak 401 jika tanpa token", async () => {
        // [Act] Request rute private tanpa header Authorization
        const res = await request(app).get("/api/v1/auth/profile");

        // [Assert] Middleware auth harus memblokir request dan return HTTP 401 Unauthorized
        expect(res.status).toBe(401);
    });

    // Skenario 4: Akses Endpoint Terproteksi Menggunakan Bearer Token yang Valid
    it("GET /api/v1/auth/profile -> berhasil 200 jika membawa Bearer token", async () => {
        // [Act] Request rute private dengan header 'Authorization: Bearer <token>' via .set()
        const res = await request(app)
            .get("/api/v1/auth/profile")
            .set("Authorization", `Bearer ${token}`);

        // [Assert] Middleware lolos -> controller membaca data user dari token -> return status 200
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("userId");
    });
});

