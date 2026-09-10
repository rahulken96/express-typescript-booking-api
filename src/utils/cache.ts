import { redis } from "../config/redis";

/**
 * Mengambil data dari cache dengan proteksi Anti-Stampede (TTL Jitter) & Anti-Penetration (Null Caching).
 * @param key Redis cache key
 * @param ttlSeconds Durasi kadaluwarsa dasar dalam detik
 * @param fetcher Fungsi fallback mengambil data asli dari Database jika cache miss
 */
export async function getOrSetCache<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    try {
        const cached = await redis.get(key);
        // Anti-Penetration: cached !== null berarti key ada di Redis (walau isinya string "null")
        if (cached !== null) {
            console.info(`[✅ Cache HIT] Key "${key}"`);
            return JSON.parse(cached) as T;
        }
    } catch (error) {
        // Jika Redis down, log warning dan bypass ke Database (Graceful Degradation)
        console.warn(`[⚠️ Cache Warning] Gagal membaca key "${key}":`, error);
    }

    // Cache MISS -> ambil data asli dari Database
    const freshData = await fetcher();

    try {
        // 1. Anti-Stampede: Tambahkan acak (jitter) 1-10 detik agar ribuan key tidak expired serempak
        const jitter = Math.floor(Math.random() * 10);
        const actualTtl = ttlSeconds + jitter;

        if (freshData !== null && freshData !== undefined) {
            console.info(
                `[✅ Cache SET] Menulis key "${key}" (TTL: ${actualTtl}s)`,
            );
            await redis.set(key, JSON.stringify(freshData), "EX", actualTtl);
        } else {
            // 2. Anti-Penetration: Data tidak ada di DB, simpan "null" dengan TTL pendek (30 detik)
            console.info(
                `[🛡️ Cache Anti-Penetration] Menulis key kosong "${key}" (TTL: 30s)`
            );
            await redis.set(key, JSON.stringify(null), "EX", 30);
        }
    } catch (error) {
        console.warn(`[⚠️ Cache Warning] Gagal menulis key "${key}":`, error);
    }

    return freshData;
}

/**
 * Menghapus cache key saat data diperbarui / ditambah (Cache Invalidation)
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
    try {
        if (keys.length > 0) {
            console.info(
                `[✅ Cache] Berhasil menghapus cache keys: ${keys.join(", ")}`,
            );
            await redis.del(...keys);
        }
    } catch (error) {
        console.warn("[⚠️ Cache Warning] Gagal menghapus cache keys:", error);
    }
}
