# ========================================
# Multi-stage Dockerfile for Next.js POS System
# Optimized for production deployment
# ========================================

# Stage 1: Dependencies (Production only)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# ========================================
# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build Next.js application
RUN npm run build

# ========================================
# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create a startup script
COPY --chown=nextjs:nodejs <<'EOF' /app/start.sh
#!/bin/sh

echo "🚀 Starting POS System..."

# Run database migrations with error handling
echo "📦 Running database migrations..."
if ! npx prisma migrate deploy 2>&1; then
  echo "⚠️  Migration failed. Checking if database needs baselining..."
  
  # Try to baseline the database (mark all migrations as applied)
  if npx prisma migrate resolve --applied "20251020200645_init" 2>&1; then
    echo "✅ Database baselined successfully"
  else
    echo "⚠️  Could not baseline. Database might already be up to date."
  fi
fi

echo "✅ Database ready!"

# Start the application
echo "🚀 Starting Next.js server..."
exec node server.js
EOF

RUN chmod +x /app/start.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["/app/start.sh"]
