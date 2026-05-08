# Dev container for ZeroDay GRC platform
# Run: docker compose up
# Then open http://localhost:8080
FROM oven/bun:1.2-alpine

WORKDIR /app

# Install deps first for better caching
COPY package.json bun.lockb* ./
RUN bun install

# Copy the rest of the source
COPY . .

EXPOSE 8080

# Vite dev server — host 0.0.0.0 so it's reachable from the host
ENV HOST=0.0.0.0
ENV PORT=8080

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
