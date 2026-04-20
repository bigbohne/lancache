FROM oven/bun:latest AS builder

WORKDIR /app
COPY . .
COPY package.json ./
RUN bun install --frozen-lockfile
RUN bun build ./src/lancache.ts --target bun --outfile dist/lancache.js

FROM oven/bun:latest AS runner
WORKDIR /app
RUN mkdir /cache
COPY --from=builder /app/dist/lancache.js ./lancache.js
EXPOSE 8080
CMD ["bun", "run", "lancache.js"]