# Stage 1: Dependencies and Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies for building
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

# Copy application code
COPY . .

# Build the Next.js app
RUN yarn build

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
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/.env* ./

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3001

# Start the app
CMD ["yarn", "start"]
