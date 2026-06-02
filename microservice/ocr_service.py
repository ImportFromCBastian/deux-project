import numpy as np
import re
import os
import json
from collections import Counter
from paddleocr import PaddleOCR


class CeliacSpellingCorrector:
    def __init__(self, catalog_path="/app/data/anmat_celiac_catalog.json"):
        self.words_votes = Counter()
        self.catalog_path = catalog_path
        self.last_loaded_mtime = 0
        # Palabras de octógonos negros que no forman parte del nombre del producto y deben ser filtradas
        self.blacklist_words = {
            "EXCESO", "AZUCARES", "GRASAS", "SATURADAS", "SODIO", "CALORIAS", 
            "MINISTERIO", "SALUD", "EXCES", "CALO", "AZUCAR", "EXCESQEN", 
            "TOTALES", "GRASASSODIO", "CRASAS"
        }
        self.load_catalog_vocabulary()

    def load_catalog_vocabulary(self):
        if not os.path.exists(self.catalog_path):
            return

        try:
            mtime = os.path.getmtime(self.catalog_path)
            # Solo recargar si el archivo fue modificado o no hemos cargado nada
            if mtime <= self.last_loaded_mtime and len(self.words_votes) > 0:
                return

            with open(self.catalog_path, 'r', encoding='utf-8') as f:
                catalog = json.load(f)
            
            text_pool = []
            for prod in catalog:
                text_pool.append(prod.get('brand', ''))
                text_pool.append(prod.get('description', ''))
            
            joined_text = " ".join(text_pool).upper()
            words = re.findall(r'[A-ZÁÉÍÓÚÑ]{3,}', joined_text)
            
            # Limpiar y actualizar los votos/conteo de frecuencia
            self.words_votes.clear()
            self.words_votes.update(words)
            self.last_loaded_mtime = mtime
            print(f"[Corrector] Entrenado/Recargado exitosamente con {len(self.words_votes)} palabras del catálogo.")
        except Exception as e:
            print(f"[Corrector] Error al recargar catálogo: {e}")

    def P(self, word): 
        total = sum(self.words_votes.values())
        return self.words_votes[word] / total if total > 0 and word in self.words_votes else 0

    def correction(self, word): 
        word = word.upper()
        if word in self.words_votes and len(word) > 3:
            return word
        candidates = self.known([word]) or self.known(self.edits1(word)) or self.known(self.edits2(word)) or [word]
        return max(candidates, key=self.P)

    def known(self, words): 
        return set(w for w in words if w in self.words_votes)

    def edits1(self, word):
        letters    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ'
        splits     = [(word[:i], word[i:])    for i in range(len(word) + 1)]
        deletes    = [L + R[1:]               for L, R in splits if R]
        transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R)>1]
        replaces   = [L + c + R[1:]           for L, R in splits if R for c in letters]
        inserts    = [L + c + R               for L, R in splits for c in letters]
        return set(deletes + transposes + replaces + inserts)

    def edits2(self, word): 
        return (e2 for e1 in self.edits1(word) for e2 in self.edits1(e1))

    def clean_and_correct_text(self, text):
        """Corrige errores de OCR, separa palabras pegadas y remueve sellos negros (EXCESO EN, etc.)"""
        self.load_catalog_vocabulary() # Intentar recargar si hay modificaciones
        text = text.upper()
        
        # Eliminar de forma robusta los textos comunes de octógonos
        text = re.sub(r'EXCES[OQ]?\s*(EN)?', ' ', text)
        text = re.sub(r'AZUCARE?S?', ' ', text)
        text = re.sub(r'GRASA?S?\s*(SATURADA?S?)?', ' ', text)
        text = re.sub(r'SODIO', ' ', text)
        text = re.sub(r'CALORIA?S?', ' ', text)
        
        words = text.split()
        result = []

        for word in words:
            # Eliminar puntuaciones
            clean_word = re.sub(r'[^\w]', '', word)
            if len(clean_word) < 2:
                continue

            # Filtrar si está en la lista negra
            if clean_word in self.blacklist_words:
                continue

            # Si no hay vocabulario entrenado, devolvemos tal cual
            if not self.words_votes:
                result.append(clean_word)
                continue

            # Separador de palabras pegadas (Segmenter)
            if clean_word not in self.words_votes and len(clean_word) >= 7:
                best_split = None
                max_prob = 0
                for i in range(3, len(clean_word) - 2):
                    left = clean_word[:i]
                    right = clean_word[i:]
                    if left in self.words_votes and right in self.words_votes:
                        prob = self.P(left) * self.P(right)
                        if prob > max_prob:
                            max_prob = prob
                            best_split = (left, right)
                if best_split:
                    print(f"[DEBUG OCR] Segmentador de palabras: dividió '{clean_word}' en '{best_split[0]}' + '{best_split[1]}'")
                    if best_split[0] not in self.blacklist_words:
                        result.append(self.correction(best_split[0]))
                    if best_split[1] not in self.blacklist_words:
                        result.append(self.correction(best_split[1]))
                    continue

            # Corrección normal
            corrected = self.correction(clean_word)
            if corrected != clean_word:
                print(f"[DEBUG OCR] Corrector ortográfico: '{clean_word}' -> '{corrected}'")
            if corrected not in self.blacklist_words:
                result.append(corrected)

        return " ".join(result).strip()


class OcrEngine:
    def __init__(self):
        # Modelos optimizados para velocidad
        self.reader = PaddleOCR(
            use_angle_cls=True,
            lang='es',
            use_gpu=False,
            show_log=False,
            det_limit_side_len=2000, 
            det_db_unclip_ratio=2.2,
            rec_char_thresh=0.4
        )
        self.corrector = CeliacSpellingCorrector()

    def calculate_relevance(self, text: str, h: float, y: float) -> float:
        """Calcula qué tan probable es que un texto sea el NOMBRE de un producto."""
        score = 1.0
        t = text.upper()
        
        # 1. Heurística de Tamaño (Evitar penalizar textos pequeños si escaneamos góndolas con muchos productos)
        # En vez de h * 20 lineal, damos un leve bonus a textos muy grandes y una leve penalización a textos extremadamente diminutos (<1% de la pantalla)
        if h > 0.15:
            score *= 1.3
        elif h < 0.01:
            score *= 0.5
        else:
            score *= 1.0  # Sin penalización para tamaños normales en góndolas

        # 2. Heurística de Posición (Nombres suelen estar en la mitad superior del bloque)
        if y < 0.6: score *= 1.1
        else: score *= 0.9

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
            r'WWW\.', r'\.COM',
        ]
        for pattern in useless_patterns:
            if re.search(pattern, t):
                return 0.05

        # 4. Slogan Filter: Filtramos frases de marketing subjetivas
        slogan_patterns = [
            r'RICA', r'RICO', r'SABOR', r'NUEV', r'CALIDAD', r'PREMIUM',
            r'TRADICIONAL', r'CLASIC', r'CLÁSIC', r'IDEAL', r'DISFRUT',
            r'RECETA', r'PASIÓN', r'AMOR', r'ELEGID', r'MÁS', r'MAS',
            r'SENSACIÓN', r'TEXTURA', r'DELICI', r'AUTÉNTIC', r'AUTENTIC'
        ]
        for pattern in slogan_patterns:
            if re.search(pattern, t):
                score *= 0.2  # Menos agresivo para no matar nombres que contengan algo parecido

        # 5. Penalización por palabras cortas (Slogans suelen ser muchas palabras cortas)
        words = t.split()
        if len(words) >= 3:
            short_words = [w for w in words if len(w) <= 3]
            if len(short_words) / len(words) > 0.7:
                score *= 0.3

        # 6. Bonus por Palabras de Marca o Producto
        if t.isalpha() and len(t) > 4: score *= 1.2
        
        return score

    def extract_clean_words(self, processed_image: np.ndarray) -> list[dict]:
        h_img, w_img = processed_image.shape[:2]
        result = self.reader.ocr(processed_image, cls=True)
        
        if not result or not result[0]:
            print("[DEBUG OCR] PaddleOCR no detectó ningún texto en la imagen.")
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
            
            print(f"[DEBUG OCR] Visto por PaddleOCR: '{text}' (Conf: {confidence:.2f}, H: {bh:.4f}, Y: {by:.2f}, Relevance: {relevance:.2f})")
            
            if confidence > 0.4 and relevance > 0.3: # Bajamos levemente el umbral de relevancia para góndolas
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
            else:
                reasons = []
                if confidence <= 0.4:
                    reasons.append(f"baja confianza ({confidence:.2f} <= 0.4)")
                if relevance <= 0.3:
                    reasons.append(f"baja relevancia ({relevance:.2f} <= 0.3)")
                print(f"[DEBUG OCR] DESCARTADO '{text}' por: {', '.join(reasons)}")

        if not raw_blocks:
            print("[DEBUG OCR] No quedó ningún bloque de texto tras aplicar los filtros de confianza y relevancia.")
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

        # 3. Clustering de "Entidad Producto" (Agrupación Agresiva)
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
            
            main_block = group[0]
            others = sorted(group[1:], key=lambda b: (b['y1'], b['x1']))
            
            full_text_parts = [main_block['text']]
            for b in others:
                if b['text'] not in full_text_parts:
                    full_text_parts.append(b['text'])
            
            clean_text = " ".join(full_text_parts)
            corrected_text = self.corrector.clean_and_correct_text(clean_text)
            print(f"[DEBUG OCR] Grupo agrupado: '{clean_text}' -> Texto Corregido: '{corrected_text}'")

            if len(corrected_text) > 3:
                final_products.append({
                    "text": corrected_text,
                    "box": [
                        min(b['x1'] for b in group),
                        min(b['y1'] for b in group),
                        max(b['x2'] for b in group),
                        max(b['y2'] for b in group)
                    ],
                    "confidence": sum(b['conf'] for b in group) / len(group)
                })

        print(f"[DEBUG OCR] Extracción finalizada. {len(final_products)} productos detectados.")
        return final_products

    def _are_near(self, b1, b2) -> bool:
        dx = abs(b1['cx'] - b2['cx'])
        dy = abs(b1['cy'] - b2['cy'])
        
        # ¿Están en la misma línea? (centros y alineados)
        is_same_line = dy < max(b1['h'], b2['h']) * 0.7
        # ¿Están cerca horizontalmente? (hueco relativo a su ancho)
        is_close_horizontally = dx < (b1['w'] + b2['w']) * 0.8

        # ¿Están apilados verticalmente? (centros x alineados)
        is_same_column = dx < max(b1['w'], b2['w']) * 0.6
        # ¿Están cerca verticalmente? (hueco relativo a su altura)
        is_close_vertically = dy < (b1['h'] + b2['h']) * 1.2

        return (is_same_line and is_close_horizontally) or (is_same_column and is_close_vertically)
