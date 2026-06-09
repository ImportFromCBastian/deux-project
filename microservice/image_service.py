import cv2
import numpy as np


class ImageProcessor:
    @staticmethod
    def preprocess_for_label(image_np: np.ndarray) -> np.ndarray:
        """Optimiza el contraste y nitidez de fotos de etiquetas de productos."""
        h, w = image_np.shape[:2]

        # 1. Redimensionar si es muy grande para acelerar el OCR
        if w > 1000:
            scale = 1000 / w
            image_np = cv2.resize(image_np, (1000, int(
                h * scale)), interpolation=cv2.INTER_AREA)

        # 2. Escala de grises
        gray = cv2.cvtColor(image_np, cv2.COLOR_RGB2GRAY)

        # 3. CLAHE: Contraste adaptativo local (ideal para reflejos en plástico)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # 4. Enfoque (Sharpening): Resalta bordes de letras borrosas
        kernel = np.array([[0, -1, 0],
                           [-1, 5, -1],
                           [0, -1, 0]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)

        # 5. Volver a RGB que es lo que espera PaddleOCR
        return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2RGB)
