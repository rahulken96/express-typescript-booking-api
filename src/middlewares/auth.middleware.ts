import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'supersecret_access_key';

// Middleware Autentikasi: Memastikan Bearer Token valid
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'fail', message: 'Token otentikasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
    req.user = decoded; // Setara Auth::user() di Laravel
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Token tidak valid atau telah kedaluwarsa' });
  }
};

// Middleware Otorisasi (RBAC): Membatasi hak akses role tertentu
export const authorizeRole = (allowedRoles: Array<'ADMIN' | 'USER'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req?.user?.role)) {
      return res.status(403).json({ status: 'fail', message: 'Akses ditolak: Hak akses hanya boleh [admin, user]' });
    }
    next();
  };
};