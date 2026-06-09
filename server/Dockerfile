FROM oven/bun:1.2.13-alpine
WORKDIR /app

# Antes tenia el bun.lockb por el autogenerado de Next.js, ahora se actualizo a bun.lock
COPY package.json bun.lock ./
RUN bun install

# Copiamos el resto del código
COPY . .

EXPOSE 3000

CMD ["bun", "run", "start:dev"]