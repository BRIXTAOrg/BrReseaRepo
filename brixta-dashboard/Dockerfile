# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY brixta-dashboard/package*.json ./
RUN npm ci
COPY brixta-dashboard/ .

RUN npm run build 

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY brixta-dashboard/package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Add a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000
CMD ["npm", "start"]