"""
Face detection and matching using face_recognition
"""
import face_recognition
import numpy as np
from typing import Dict, Any


class FaceMatcher:
    """Face detection and matching"""
    
    def analyze_face(self, image_array: np.ndarray) -> Dict[str, Any]:
        """Analyze face quality in image"""
        try:
            # Convert to RGB if needed
            if len(image_array.shape) == 3 and image_array.shape[2] == 4:
                rgb_image = image_array[:, :, :3]
            elif len(image_array.shape) == 3:
                rgb_image = image_array
            else:
                return {"quality_score": 0, "faces_detected": 0}
            
            # Detect faces
            face_locations = face_recognition.face_locations(rgb_image)
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if len(face_locations) == 0:
                return {"quality_score": 0, "faces_detected": 0}
            
            if len(face_locations) > 1:
                return {"quality_score": 30, "faces_detected": len(face_locations)}
            
            # Calculate face quality based on size and position
            face_location = face_locations[0]
            top, right, bottom, left = face_location
            
            face_height = bottom - top
            face_width = right - left
            image_height, image_width = rgb_image.shape[:2]
            
            # Face should be reasonably sized (at least 10% of image)
            face_size_ratio = (face_height * face_width) / (image_height * image_width)
            
            # Face should be centered
            face_center_x = (left + right) / 2
            face_center_y = (top + bottom) / 2
            image_center_x = image_width / 2
            image_center_y = image_height / 2
            
            center_offset = np.sqrt(
                (face_center_x - image_center_x)**2 + 
                (face_center_y - image_center_y)**2
            ) / max(image_width, image_height)
            
            # Calculate quality score
            size_score = min(100, face_size_ratio * 500)  # 20% face = 100 score
            center_score = max(0, 100 - center_offset * 200)
            
            quality_score = int((size_score + center_score) / 2)
            
            return {
                "quality_score": quality_score,
                "faces_detected": 1,
                "face_location": face_location
            }
            
        except Exception as e:
            print(f"Face analysis error: {e}")
            return {"quality_score": 50, "faces_detected": 0}
    
    def match_faces(self, image1: np.ndarray, image2: np.ndarray) -> Dict[str, Any]:
        """Match faces between two images"""
        try:
            # Convert to RGB
            rgb1 = image1[:, :, :3] if len(image1.shape) == 3 else image1
            rgb2 = image2[:, :, :3] if len(image2.shape) == 3 else image2
            
            # Get face encodings
            encodings1 = face_recognition.face_encodings(rgb1)
            encodings2 = face_recognition.face_encodings(rgb2)
            
            if len(encodings1) == 0 or len(encodings2) == 0:
                return {"match_score": 0.0, "confidence": 0.0}
            
            # Calculate distance
            distance = face_recognition.face_distance([encodings1[0]], encodings2[0])[0]
            
            # Convert distance to match score (lower distance = higher match)
            # Typical threshold: < 0.6 = same person
            match_score = max(0.0, 1.0 - distance)
            confidence = 1.0 - distance if distance < 0.6 else 0.0
            
            return {
                "match_score": float(match_score),
                "confidence": float(confidence),
                "distance": float(distance)
            }
            
        except Exception as e:
            print(f"Face matching error: {e}")
            return {"match_score": 0.0, "confidence": 0.0}

