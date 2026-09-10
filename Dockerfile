# ==========================================
# STAGE 1: Builder (Compile TypeScript ke JS)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Salin manifest dependensi & config ts
COPY package*.json tsconfig*.json ./

# Install dependensi (resolve native binary sesuai OS Linux)
RUN npm install -g npm@latest && npm install

# Salin source code
COPY src/ ./src

# Compile TypeScript menjadi file JavaScript murni di folder dist/
RUN npm run build

# ==========================================
# STAGE 2: Runner (Production Image Bersih)
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment production
ENV NODE_ENV=production

# Salin manifest package
COPY package*.json ./

# Install HANYA dependencies production
RUN npm install --omit=dev && npm cache clean --force

# Ambil hasil build JS murni dari Stage 1
COPY --from=builder /app/dist ./dist

# Keamanan: Gunakan user non-root 'node' bawaan image Alpine
USER node

# Expose port aplikasi
EXPOSE 3000

# Perintah menjalankan server production
CMD ["node", "dist/app.js"]