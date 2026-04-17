FROM node:24-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json patches/ ./patches/
RUN npm ci

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
