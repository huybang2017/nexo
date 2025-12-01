"""
Document tampering/forgery detection
"""
import cv2
import numpy as np
from typing import Dict, Any


class TamperingDetector:
    """Detect document tampering and forgery"""
    
    def detect(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Detect if document has been tampered"""
        try:
            # Convert to grayscale
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = image_array
            
            # 1. Check for copy-paste artifacts (Error Level Analysis)
            ela_score = self._error_level_analysis(gray)
            
            # 2. Check for inconsistent noise patterns
            noise_score = self._noise_analysis(gray)
            
            # 3. Check for geometric inconsistencies
            geometry_score = self._geometry_analysis(image_array)
            
            # 4. Check for color inconsistencies
            color_score = self._color_analysis(image_array) if len(image_array.shape) == 3 else 100
            
            # Combine scores
            tampering_probability = (
                (100 - ela_score) * 0.4 +
                (100 - noise_score) * 0.3 +
                (100 - geometry_score) * 0.2 +
                (100 - color_score) * 0.1
            ) / 100
            
            is_tampered = tampering_probability > 0.3  # Threshold
            
            return {
                "is_tampered": is_tampered,
                "tampering_probability": float(tampering_probability),
                "ela_score": ela_score,
                "noise_score": noise_score,
                "geometry_score": geometry_score,
                "color_score": color_score
            }
            
        except Exception as e:
            print(f"Tampering detection error: {e}")
            return {
                "is_tampered": False,
                "tampering_probability": 0.0
            }
    
    def _error_level_analysis(self, gray: np.ndarray) -> float:
        """Error Level Analysis for copy-paste detection"""
        try:
            # Resize for consistency
            resized = cv2.resize(gray, (500, 500))
            
            # Re-compress and compare
            quality = 90
            _, compressed = cv2.imencode('.jpg', resized, [cv2.IMWRITE_JPEG_QUALITY, quality])
            decompressed = cv2.imdecode(compressed, cv2.IMREAD_GRAYSCALE)
            
            # Calculate difference
            diff = cv2.absdiff(resized, decompressed)
            ela_score = np.mean(diff)
            
            # Normalize to 0-100 (higher = more suspicious)
            return min(100, ela_score / 2)
        except:
            return 50.0
    
    def _noise_analysis(self, gray: np.ndarray) -> float:
        """Analyze noise patterns for inconsistencies"""
        try:
            # Calculate local variance
            kernel = np.ones((5, 5), np.float32) / 25
            local_mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
            local_variance = cv2.filter2D((gray.astype(np.float32) - local_mean)**2, -1, kernel)
            
            # Check for inconsistent variance (sign of tampering)
            variance_std = np.std(local_variance)
            normalized_std = min(100, variance_std / 10)
            
            return normalized_std
        except:
            return 50.0
    
    def _geometry_analysis(self, image_array: np.ndarray) -> float:
        """Check for geometric inconsistencies"""
        try:
            # Detect edges
            if len(image_array.shape) == 3:
                gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = image_array
            
            edges = cv2.Canny(gray, 50, 150)
            
            # Check for straight lines (document edges should be straight)
            lines = cv2.HoughLines(edges, 1, np.pi/180, 100)
            
            if lines is None or len(lines) == 0:
                return 50.0
            
            # Analyze line angles
            angles = []
            for line in lines[:10]:  # Check first 10 lines
                rho, theta = line[0]
                angle = theta * 180 / np.pi
                angles.append(angle)
            
            # Check angle consistency
            angle_variance = np.var(angles)
            inconsistency_score = min(100, angle_variance / 10)
            
            return inconsistency_score
        except:
            return 50.0
    
    def _color_analysis(self, image_array: np.ndarray) -> float:
        """Check for color inconsistencies"""
        try:
            # Convert to LAB color space
            lab = cv2.cvtColor(image_array, cv2.COLOR_RGB2LAB)
            
            # Analyze color distribution
            l_channel = lab[:, :, 0]
            a_channel = lab[:, :, 1]
            b_channel = lab[:, :, 2]
            
            # Check for abrupt color changes (sign of tampering)
            l_gradient = cv2.Sobel(l_channel, cv2.CV_64F, 1, 1, ksize=3)
            gradient_magnitude = np.abs(l_gradient)
            
            # High gradient variance = suspicious
            gradient_variance = np.var(gradient_magnitude)
            inconsistency_score = min(100, gradient_variance / 1000)
            
            return inconsistency_score
        except:
            return 50.0

