FROM oven/bun:1.2.13-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" bunx prisma generate

EXPOSE 3001
CMD ["bun", "run", "start:dev"]