"""
Document scoring utilities
"""
import hashlib
import imagehash
from PIL import Image
import numpy as np


class DocumentScorer:
    """Main document scoring class"""
    
    def calculate_hash(self, image_bytes: bytes) -> str:
        """Calculate SHA-256 hash of document"""
        return hashlib.sha256(image_bytes).hexdigest()
    
    def calculate_perceptual_hash(self, image_array: np.ndarray) -> str:
        """Calculate perceptual hash for similarity detection"""
        try:
            # Convert to PIL Image
            if len(image_array.shape) == 3:
                image = Image.fromarray(image_array)
            else:
                image = Image.fromarray(image_array, mode='L')
            
            # Calculate perceptual hash
            phash = imagehash.phash(image, hash_size=16)
            return str(phash)
        except Exception as e:
            # Fallback to simple hash
            return hashlib.md5(image_array.tobytes()).hexdigest()

