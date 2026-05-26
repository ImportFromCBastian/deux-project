FROM python:3.10-slim

WORKDIR /app

# Instalamos las dependencias de C++ necesarias para OpenCV y EasyOCR
RUN apt-get update && apt-get install -y \
  libglib2.0-0 \
  libsm6 \
  libxext6 \
  libxrender-dev \
  && rm -rf /var/lib/apt/lists/*

# Copiamos e instalamos las librerías de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos nuestro código
COPY main.py .

EXPOSE 6060

# Levantamos FastAPI con Uvicorn en modo auto-recarga para dev
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "6060", "--reload"]