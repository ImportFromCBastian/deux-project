import numpy as np
from paddleocr import PaddleOCR


class OcrEngine:
    def __init__(self):
        # Se inicializa de manera perezosa (Lazy) al levantar el servicio
        self.reader = PaddleOCR(
            use_angle_cls=True,
            lang='es',
            use_gpu=False,
            show_log=False
        )

    def extract_clean_words(self, processed_image: np.ndarray) -> list[str]:
        result = self.reader.ocr(processed_image, cls=True)
        words: list[str] = []

        if result and result[0]:
            for line in result[0]:
                text, confidence = line[1]
                # Filtramos lecturas con baja confianza o ruido de un solo carácter
                if confidence > 0.6 and len(text.strip()) > 1:
                    words.append(text.strip())

        return words
