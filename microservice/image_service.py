import cv2
import numpy as np


class ImageProcessor:
    @staticmethod
    def preprocess_for_label(image_np: np.ndarray) -> np.ndarray:
        """Optimiza el contraste y nitidez para lectura de góndolas."""
        # 1. Aseguramos un tamaño base para letras pequeñas
        h, w = image_np.shape[:2]
        target_w = 1200
        if w < target_w:
            scale = target_w / w
            image_np = cv2.resize(image_np, (target_w, int(h * scale)), interpolation=cv2.INTER_CUBIC)

        # 2. Mejora de iluminación (CLAHE) en el canal de luminancia
        # Convertimos a LAB para no distorsionar colores pero mejorar contraste de letras
        lab = cv2.cvtColor(image_np, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2RGB)

        # 3. Denoising ligero para eliminar grano de cámara móvil
        denoised = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)

        # 4. Sharpening adaptativo (Unsharp Mask)
        gaussian_3 = cv2.GaussianBlur(denoised, (0, 0), 2.0)
        unsharp_mask = cv2.addWeighted(denoised, 1.5, gaussian_3, -0.5, 0)

        return unsharp_mask
