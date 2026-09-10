import { describe, it, expect } from "vitest";
import request from "supertest"; // Library simulasi request HTTP Express
import app from "@/app"; // Instance Express Application

describe("Booking API (Integration Test)", () => {
    // Skenario 1: Query API Publik Booking (Router -> Controller -> Service -> Cache/DB)
    it("GET /api/v1/booking -> harus mengembalikan status 200 dan array daftar booking", async () => {
        // [Act] Kirim request GET ke endpoint booking
        const res = await request(app).get("/api/v1/booking");

        // [Assert] Validasi status 200, format envelope JSON ('status: success'), dan data bertipe Array
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // Skenario 2: System Health Check Endpoint
    it("GET /check -> endpoint health check sistem", async () => {
        // [Act] Request ke endpoint health check
        const res = await request(app).get("/check");

        // [Assert] Server running normal dan mengembalikan pesan status
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
    });
});

