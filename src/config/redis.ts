import Redis from "ioredis";

export const redis = new Redis({
 host: process.env.REDIS_HOST || "127.0.0.1",
 port: Number(process.env.REDIS_PORT) || 6379,
 password: process.env.REDIS_PASSWORD || undefined,
 lazyConnect: true, // Tidak langsung crash aplikasi jika Redis belum menyala
 maxRetriesPerRequest: 3,
 family: 4, // Paksa IPv4 agar DNS Docker di Alpine Linux tidak timeout (EAI_AGAIN)
});

redis.on("connect", () => { console.log("✅ Redis Client Connected") });

redis.on("error", (err) => { console.error("❌ Redis Connection Error:", err.message) });
