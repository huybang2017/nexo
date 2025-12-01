"""
Image quality analysis
"""
import cv2
import numpy as np
from typing import Dict, Any


class ImageQualityAnalyzer:
    """Analyze image quality metrics"""
    
    def analyze(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Comprehensive image quality analysis"""
        try:
            # Convert to grayscale if needed
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = image_array
            
            # 1. Sharpness (Laplacian variance)
            sharpness = self._calculate_sharpness(gray)
            
            # 2. Contrast
            contrast = self._calculate_contrast(gray)
            
            # 3. Brightness
            brightness = self._calculate_brightness(gray)
            
            # 4. Resolution adequacy
            resolution_score = self._check_resolution(image_array)
            
            # Combine scores
            overall_score = (
                sharpness * 0.3 +
                contrast * 0.3 +
                brightness * 0.2 +
                resolution_score * 0.2
            )
            
            return {
                "score": int(overall_score),
                "sharpness": sharpness,
                "contrast": contrast,
                "brightness": brightness,
                "resolution": resolution_score
            }
        except Exception as e:
            print(f"Image quality analysis error: {e}")
            return {
                "score": 50,
                "sharpness": 50,
                "contrast": 50,
                "brightness": 50,
                "resolution": 50
            }
    
    def _calculate_sharpness(self, gray: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance"""
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        # Normalize to 0-100 (typical good images: 100-500)
        return min(100, variance / 5)
    
    def _calculate_contrast(self, gray: np.ndarray) -> float:
        """Calculate image contrast"""
        # Standard deviation of pixel values
        std = np.std(gray)
        # Normalize to 0-100 (good contrast: 30-60)
        return min(100, std / 0.6)
    
    def _calculate_brightness(self, gray: np.ndarray) -> float:
        """Calculate brightness adequacy"""
        mean = np.mean(gray)
        # Ideal brightness: 100-150 (out of 255)
        if 100 <= mean <= 150:
            return 100
        elif mean < 100:
            # Too dark
            return mean
        else:
            # Too bright
            return 200 - mean
    
    def _check_resolution(self, image_array: np.ndarray) -> float:
        """Check if resolution is adequate"""
        height, width = image_array.shape[:2]
        total_pixels = height * width
        
        # Minimum: 500x500 = 250k pixels
        # Good: 1000x1000 = 1M pixels
        if total_pixels >= 1_000_000:
            return 100
        elif total_pixels >= 250_000:
            return 50 + (total_pixels - 250_000) / 750_000 * 50
        else:
            return total_pixels / 250_000 * 50
    
    def detect_blur(self, image_array: np.ndarray) -> float:
        """Detect blur level (higher = less blur)"""
        try:
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = image_array
            
            # Laplacian variance method
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            variance = laplacian.var()
            
            # Threshold: < 100 = blurry, > 500 = sharp
            if variance < 100:
                blur_score = variance / 100 * 50  # 0-50
            elif variance < 500:
                blur_score = 50 + (variance - 100) / 400 * 50  # 50-100
            else:
                blur_score = 100
            
            return float(blur_score)
        except:
            return 50.0

