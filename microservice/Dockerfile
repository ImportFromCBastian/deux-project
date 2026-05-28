FROM python:3.11-slim-bookworm

WORKDIR /app

# Mantenemos las librerías esenciales del sistema
RUN apt-get update && apt-get install -y \
  libglib2.0-0 \
  libgl1-mesa-glx \
  libsm6 \
  libxext6 \
  libgomp1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código (El modelo se descargará automáticamente al iniciar Uvicorn)
COPY . .

EXPOSE 6060

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "6060"]