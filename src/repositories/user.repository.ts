import { pool } from "../config/database";
import { User, RegisterDTO } from "../types/auth.types";

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const query = `
            SELECT id, name, email, password, role, created_at as "createdAt", updated_at as "updatedAt"
            FROM users
            WHERE email = $1;
        `;
        const result = await pool.query<User>(query, [email]);
        return result.rows[0] || null;
    }

    async findById(id: string): Promise<User | null> {
        const query = `
            SELECT id, name, email, role, created_at as "createdAt", updated_at as "updatedAt"
            FROM users
            WHERE id = $1;
        `;
        const result = await pool.query<User>(query, [id]);
        return result.rows[0] || null;
    }

    async create(data: RegisterDTO & { id: string; passwordHash: string }): Promise<User> {
        const query = `
            INSERT INTO users (id, name, email, password, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, role, created_at as "createdAt", updated_at as "updatedAt";
        `;
        const role = data.role || "USER";
        const result = await pool.query<User>(query, [
            data.id,
            data.name,
            data.email,
            data.passwordHash,
            role,
        ]);
        return result.rows[0];
    }
}
