# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/frontend/node_modules ./frontend/node_modules
COPY --from=dependencies /app/shared/node_modules ./shared/node_modules
COPY . .
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/frontend/node_modules ./frontend/node_modules
COPY --from=dependencies /app/shared/node_modules ./shared/node_modules
COPY . .
WORKDIR /app/frontend
EXPOSE 3000
CMD ["pnpm", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built assets
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
COPY --from=build /app/frontend/public ./frontend/public

WORKDIR /app/frontend
EXPOSE 3000
CMD ["node", "server.js"]
