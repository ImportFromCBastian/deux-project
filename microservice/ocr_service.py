import numpy as np
import re
from paddleocr import PaddleOCR


class OcrEngine:
    def __init__(self):
        self.reader = PaddleOCR(
            use_angle_cls=True,
            lang='es',
            use_gpu=False,
            show_log=False,
            det_limit_side_len=1200,
            det_db_unclip_ratio=2.0,
            rec_char_thresh=0.5
        )

    def calculate_relevance(self, text: str, h: float, y: float) -> float:
        """Calcula qué tan probable es que un texto sea el NOMBRE de un producto."""
        score = 1.0
        t = text.upper()
        
        # 1. Heurística de Tamaño (Lo más importante suele ser más grande)
        # h es la altura relativa (0 a 1). En góndola, nombres suelen ser > 0.05
        score *= (h * 20) 

        # 2. Heurística de Posición (Nombres suelen estar en la mitad superior del bloque)
        if y < 0.6: score *= 1.2
        else: score *= 0.8

        # 3. Penalización de "Datos Inútiles" (Palabras técnicas o medidas)
        useless_patterns = [
            r'\d+\s?(G|KG|ML|L|CC|CM3)', # Pesos y medidas (500g, 1L)
            r'CONT(ENIDO)?\.?\s?NETO',    # Texto de contenido
            r'VENC(IMIENTO)?',            # Fechas
            r'LOTE',                      # Lotes
            r'INDUSTRIA',                 # Origen
            r'INGREDIENTES',              # Listas de ingredientes
            r'EXCESO', 'CONTIENE',         # Sellos (mantener penalización fuerte)
            r'SERVING', 'PORCIÓN',         # Tablas nutricionales
            r'HTTPS?://',                 # URLs
        ]
        for pattern in useless_patterns:
            if re.search(pattern, t):
                return 0.1 # Muy baja relevancia

        # 4. Bonus por Palabras de Marca o Producto (Propia del contexto)
        # Si tiene muchas mayúsculas o caracteres alfabéticos limpios
        if t.isalpha() and len(t) > 4: score *= 1.3
        
        return score

    def extract_clean_words(self, processed_image: np.ndarray) -> list[dict]:
        h_img, w_img = processed_image.shape[:2]
        result = self.reader.ocr(processed_image, cls=True)
        
        if not result or not result[0]:
            return []

        raw_blocks = []
        for line in result[0]:
            box, (text, confidence) = line
            x_coords = [p[0] for p in box]
            y_coords = [p[1] for p in box]
            
            bh = (max(y_coords) - min(y_coords)) / h_img
            by = (sum(y_coords) / 4) / h_img
            
            # Calculamos relevancia antes de filtrar
            relevance = self.calculate_relevance(text, bh, by)
            
            if confidence > 0.4 and relevance > 0.3:
                raw_blocks.append({
                    "text": text.strip().upper(),
                    "x1": min(x_coords) / w_img,
                    "y1": min(y_coords) / h_img,
                    "x2": max(x_coords) / w_img,
                    "y2": max(y_coords) / h_img,
                    "cx": (sum(x_coords) / 4) / w_img,
                    "cy": by,
                    "h": bh,
                    "w": (max(x_coords) - min(x_coords)) / w_img,
                    "conf": confidence,
                    "rel": relevance
                })

        if not raw_blocks:
            return []

        # 2. NMS (Eliminar cajas contenidas)
        unique_blocks = []
        raw_blocks.sort(key=lambda b: b['w'] * b['h'], reverse=True)
        for b in raw_blocks:
            is_contained = False
            for target in unique_blocks:
                if b['x1'] > target['x1']-0.01 and b['x2'] < target['x2']+0.01 and \
                   b['y1'] > target['y1']-0.01 and b['y2'] < target['y2']+0.01:
                    is_contained = True
                    break
            if not is_contained: unique_blocks.append(b)

        # 3. Clustering de "Entidad Producto"
        groups = []
        used = [False] * len(unique_blocks)
        for i in range(len(unique_blocks)):
            if used[i]: continue
            current_group = [unique_blocks[i]]
            used[i] = True
            found_more = True
            while found_more:
                found_more = False
                for j in range(len(unique_blocks)):
                    if used[j]: continue
                    for member in current_group:
                        if self._are_near(member, unique_blocks[j]):
                            current_group.append(unique_blocks[j])
                            used[j] = True
                            found_more = True
                            break
            groups.append(current_group)

        # 4. Selección del Nombre Maestro
        final_products = []
        for group in groups:
            # Ordenamos por relevancia y tamaño para elegir qué mostrar
            group.sort(key=lambda b: b['rel'], reverse=True)
            
            # El texto principal es el de mayor relevancia (ej: la marca)
            # El texto secundario son palabras cercanas que lo completan
            main_block = group[0]
            others = sorted(group[1:], key=lambda b: (b['y1'], b['x1']))
            
            # Construimos el nombre inteligente
            # Si el "main" es muy fuerte, lo ponemos primero
            full_text_parts = [main_block['text']]
            for b in others:
                if b['text'] not in full_text_parts:
                    full_text_parts.append(b['text'])
            
            clean_text = " ".join(full_text_parts)

            if len(clean_text) > 3:
                final_products.append({
                    "text": clean_text,
                    "box": [
                        min(b['x1'] for b in group),
                        min(b['y1'] for b in group),
                        max(b['x2'] for b in group),
                        max(b['y2'] for b in group)
                    ],
                    "confidence": sum(b['conf'] for b in group) / len(group)
                })

        return final_products

    def _are_near(self, b1, b2) -> bool:
        dx = abs(b1['cx'] - b2['cx'])
        dy = abs(b1['cy'] - b2['cy'])
        limit_y = max(b1['h'], b2['h']) * 1.5
        limit_x = max(b1['w'], b2['w']) * 1.2
        if dy < max(b1['h'], b2['h']) * 0.5 and dx < 0.3: return True
        if dx < max(b1['w'], b2['w']) * 0.6 and dy < limit_y: return True
        return False
