# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files and env early so prisma can access env vars during build
COPY package.json yarn.lock* ./
COPY .env .env

# Install dependencies for building
RUN yarn install --frozen-lockfile --production=false

# Copy the rest of the application code
COPY . .

# Generate Prisma client (needs DB connection)
RUN yarn prisma generate

# Build the Next.js app
RUN yarn build

# Stage 2: Run-time image
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy package files and env to runner
COPY package.json yarn.lock* ./
COPY .env .env

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true

# Copy built app and static files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Copy Prisma client and engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Start the app
CMD ["yarn", "start"]
