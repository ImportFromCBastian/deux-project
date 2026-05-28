FROM oven/bun:1-alpine

WORKDIR /app

# El comodín (*) evita que Docker falle si aún no tienes el archivo bun.lock
COPY package.json bun.lock ./

# Bun instala las dependencias a la velocidad de la luz
RUN bun install

COPY . .

EXPOSE 3000

# Arrancamos Next.js asegurando la conexión de red correcta
CMD ["bun", "run", "dev", "--hostname", "0.0.0.0"]