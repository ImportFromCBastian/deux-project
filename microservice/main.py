from fastapi import FastAPI, UploadFile, File
import easyocr
import io
from PIL import Image
import numpy as np

app = FastAPI()

# Inicializamos el lector al arrancar.
# Usamos español ('es') e inglés ('en').
# gpu=False porque configurar CUDA en Docker para dev local es complejo.
reader = easyocr.Reader(['es', 'en'], gpu=False)


@app.post("/extract")
async def analyze_image(file: UploadFile = File(...)):
    # 1. Leemos los bytes crudos de la imagen (súper rápido)
    contents = await file.read()

    # 2. Convertimos los bytes en una imagen que EasyOCR entienda
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    image_np = np.array(image)

    # 3. La magia de la IA: extraemos el texto
    # detail=0 nos devuelve solo una lista limpia de palabras, sin coordenadas
    results = reader.readtext(image_np, detail=0)

    # Retornamos el JSON hacia NestJS
    return {"words": results}
