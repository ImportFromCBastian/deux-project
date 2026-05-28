import io
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException

from image_service import ImageProcessor
from ocr_service import OcrEngine

app = FastAPI(title="OCR Service con PaddleOCR")

# Instanciamos los servicios globales
processor = ImageProcessor()
ocr_engine = OcrEngine()


@app.post("/extract")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="El archivo debe ser una imagen")

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        image_np = np.array(image)
    except Exception:
        raise HTTPException(
            status_code=422, detail="No se pudo decodificar la imagen")

    # Flujo declarativo y fácil de leer
    processed_image = processor.preprocess_for_label(image_np)
    detected_words = ocr_engine.extract_clean_words(processed_image)

    return {"words": detected_words}


@app.get("/health")
async def health():
    return {"status": "ok"}
