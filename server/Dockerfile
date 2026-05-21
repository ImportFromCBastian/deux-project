FROM oven/bun:1.2.13-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM node:24-alpine
WORKDIR /app

# Instalamos Bun en la imagen de Node para poder usarlo como runner
RUN npm install -g bun

# Traemos los node_modules instalados
COPY --from=deps /app/node_modules ./node_modules

# Copiamos el resto del código
COPY . .

EXPOSE 3000

CMD ["bun", "run", "start:dev"]