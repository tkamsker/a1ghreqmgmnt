# Base stage
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.1 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules
COPY --from=dependencies /app/shared/node_modules ./shared/node_modules
COPY . .
WORKDIR /app/backend
RUN pnpm prisma generate
RUN pnpm build

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules
COPY --from=dependencies /app/shared/node_modules ./shared/node_modules
COPY . .
WORKDIR /app/backend
EXPOSE 4000
CMD ["pnpm", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY backend/package.json ./backend/
WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/main"]
