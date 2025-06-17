# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies for building
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

# Copy application code
COPY . .

# Fix file case sensitivity issues
RUN find src/components/ui -name "*.tsx*" -exec sh -c 'mv "$1" "${1%.tsx*}.tsx"' _ {} \;

# Generate Prisma client
RUN yarn prisma generate

# Build the Next.js app with verbose output to debug issues
RUN yarn build || (echo "Build failed, showing component directory:" && ls -la src/components/ui && exit 1)

# Stage 2: Run-time image
FROM node:18-alpine AS runner
WORKDIR /app

# Set to production environment
ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy package.json and yarn.lock
COPY package.json yarn.lock* ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true

# Copy built app from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/.env* ./

# Copy Prisma client and engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3001

# Start the app
CMD ["yarn", "start"]
