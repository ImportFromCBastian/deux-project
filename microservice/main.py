from fastapi import FastAPI, UploadFile, File
import easyocr
import io
from PIL import Image
import numpy as np

app = FastAPI()

# gpu=False porque configurar CUDA en Docker para dev local es complejo.
reader = easyocr.Reader(['es', 'en'], gpu=False)


@app.post("/extract")
async def analyze_image(file: UploadFile = File(...)):
    # 1. Leemos los bytes crudos de la imagen (súper rápido)
    contents = await file.read()

    # 2. Convertimos los bytes en una imagen que EasyOCR entienda
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    image_np = np.array(image)

    # detail=0 nos devuelve solo una lista limpia de palabras, sin coordenadas
    results = reader.readtext(image_np, detail=0)

    return {"words": results}
