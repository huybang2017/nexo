"""
OCR extraction using EasyOCR and Tesseract
"""
import easyocr
import pytesseract
import cv2
import numpy as np
import re
from datetime import datetime
from typing import Dict, Any


class OCRExtractor:
    """Extract text from documents using OCR"""
    
    def __init__(self):
        # Initialize EasyOCR reader (supports Vietnamese)
        try:
            self.reader = easyocr.Reader(['vi', 'en'], gpu=False)
        except:
            self.reader = None
            print("Warning: EasyOCR not available, using Tesseract only")
    
    def extract(self, image_array: np.ndarray, document_type: str) -> Dict[str, Any]:
        """Extract text from image"""
        # Preprocess image
        processed_image = self._preprocess_image(image_array)
        
        # Try EasyOCR first (better for Vietnamese)
        if self.reader:
            try:
                results = self.reader.readtext(processed_image)
                text = " ".join([result[1] for result in results])
                confidence = np.mean([result[2] for result in results]) if results else 0.5
            except:
                text = ""
                confidence = 0.5
        else:
            # Fallback to Tesseract
            text = pytesseract.image_to_string(processed_image, lang='vie+eng')
            confidence = 0.7
        
        # Extract specific fields based on document type
        extracted_data = {
            "text": text,
            "confidence": float(confidence),
            "name": None,
            "id_number": None,
            "dob": None,
            "expiry_date": None
        }
        
        if document_type in ["ID_CARD_FRONT", "ID_CARD_BACK"]:
            # Extract ID number (Vietnamese ID format: 12 digits)
            id_match = re.search(r'\d{9,12}', text)
            if id_match:
                extracted_data["id_number"] = id_match.group()
            
            # Extract name (usually before ID number)
            lines = text.split('\n')
            for line in lines:
                if any(char.isalpha() for char in line) and len(line) > 5:
                    extracted_data["name"] = line.strip()
                    break
            
            # Extract date of birth
            dob_match = re.search(r'\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}', text)
            if dob_match:
                extracted_data["dob"] = dob_match.group()
        
        # Extract expiry date
        expiry_match = re.search(r'(Hết hạn|Expiry|EXP|HSD)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})', text, re.IGNORECASE)
        if expiry_match:
            extracted_data["expiry_date"] = expiry_match.group(2)
        
        return extracted_data
    
    def _preprocess_image(self, image_array: np.ndarray) -> np.ndarray:
        """Preprocess image for better OCR"""
        # Convert to grayscale if needed
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Enhance contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(enhanced, None, 10, 7, 21)
        
        return denoised
    
    def check_expiration(self, ocr_result: Dict[str, Any]) -> Dict[str, Any]:
        """Check if document is expired"""
        expiry_date = ocr_result.get("expiry_date")
        is_expired = False
        
        if expiry_date:
            try:
                # Parse date (handle different formats)
                date_str = expiry_date.replace('/', '-')
                if len(date_str.split('-')) == 3:
                    parts = date_str.split('-')
                    if len(parts[2]) == 2:
                        parts[2] = '20' + parts[2]
                    parsed_date = datetime.strptime('-'.join(parts), '%d-%m-%Y')
                    is_expired = parsed_date < datetime.now()
            except:
                pass
        
        return {
            "is_expired": is_expired,
            "expiry_date": expiry_date
        }
    
    def check_consistency(self, ocr_result: Dict[str, Any]) -> int:
        """Check data consistency"""
        score = 100
        
        # Check if required fields are present
        if not ocr_result.get("id_number"):
            score -= 30
        if not ocr_result.get("name"):
            score -= 20
        if not ocr_result.get("dob"):
            score -= 10
        
        # Check format validity
        id_number = ocr_result.get("id_number")
        if id_number and (len(id_number) < 9 or len(id_number) > 12):
            score -= 20
        
        return max(0, score)

