# Stage 1: Build React Admin Console SPA
FROM node:20-alpine AS admin-builder
WORKDIR /app/admin-console
COPY admin-console/package*.json ./
RUN npm ci
COPY admin-console/ ./
RUN npm run build

# Stage 2: Build NestJS backend
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Copy the built React assets so serve-static has them during testing/compiling
COPY --from=admin-builder /app/admin-console/dist ./admin-console/dist
RUN npx prisma generate
RUN npm run build

# Stage 3: Production minimal runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install curl for healthchecks
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy required assets and pre-built code
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=admin-builder /app/admin-console/dist ./admin-console/dist

EXPOSE 3000

# Run container as a non-root node user
USER node

CMD ["node", "dist/main"]
