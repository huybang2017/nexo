"""
FastAPI service for KYC Document Scoring using AI models
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from utils.document_scorer import DocumentScorer
from utils.ocr_extractor import OCRExtractor
from utils.face_matcher import FaceMatcher
from utils.tampering_detector import TamperingDetector
from utils.image_quality import ImageQualityAnalyzer
import io
from PIL import Image
import numpy as np

app = FastAPI(title="KYC AI Scoring Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI models
document_scorer = DocumentScorer()
ocr_extractor = OCRExtractor()
face_matcher = FaceMatcher()
tampering_detector = TamperingDetector()
image_quality = ImageQualityAnalyzer()


class DocumentScoreRequest(BaseModel):
    document_type: str  # ID_CARD_FRONT, ID_CARD_BACK, SELFIE, etc.
    file_path: Optional[str] = None
    reference_selfie_path: Optional[str] = None  # For face matching


class DocumentScoreResponse(BaseModel):
    total_score: int
    image_quality_score: int
    ocr_accuracy_score: int
    blur_detection_score: int
    tampering_detection_score: int
    face_quality_score: int
    data_consistency_score: int
    expiration_check_score: int
    ocr_confidence: float
    face_match_score: Optional[float] = None
    face_match_confidence: Optional[float] = None
    ocr_extracted_name: Optional[str] = None
    ocr_extracted_id_number: Optional[str] = None
    ocr_extracted_dob: Optional[str] = None
    is_tampered: bool
    is_blurry: bool
    is_expired: bool
    ai_explanations: List[str]
    document_hash: str
    perceptual_hash: str


class DuplicateCheckRequest(BaseModel):
    document_hash: str
    perceptual_hash: str
    extracted_id_number: Optional[str] = None


class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    similarity_score: float
    matched_hashes: List[str]


@app.get("/")
async def root():
    return {"message": "KYC AI Scoring Service", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/score-document", response_model=DocumentScoreResponse)
async def score_document(
    file: UploadFile = File(...),
    document_type: str = "ID_CARD_FRONT",
    reference_selfie: Optional[UploadFile] = None
):
    """
    Score a KYC document using AI models
    """
    try:
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)

        # 1. Image Quality Analysis
        quality_result = image_quality.analyze(image_array)
        
        # 2. OCR Extraction
        ocr_result = ocr_extractor.extract(image_array, document_type)
        
        # 3. Tampering Detection
        tampering_result = tampering_detector.detect(image_array)
        
        # 4. Blur Detection
        blur_score = image_quality.detect_blur(image_array)
        
        # 5. Face Quality/Detection (for selfie or ID card with face)
        face_quality_score = 100
        face_match_score = None
        face_match_confidence = None
        
        if document_type in ["SELFIE", "ID_CARD_FRONT"]:
            face_result = face_matcher.analyze_face(image_array)
            face_quality_score = face_result["quality_score"]
            
            # Face matching if reference selfie provided
            if reference_selfie:
                ref_bytes = await reference_selfie.read()
                ref_image = Image.open(io.BytesIO(ref_bytes))
                ref_array = np.array(ref_image)
                match_result = face_matcher.match_faces(image_array, ref_array)
                face_match_score = match_result["match_score"]
                face_match_confidence = match_result["confidence"]

        # 6. Expiration Check (from OCR data)
        expiration_check = ocr_extractor.check_expiration(ocr_result)

        # 7. Calculate Document Hash
        document_hash = document_scorer.calculate_hash(image_bytes)
        perceptual_hash = document_scorer.calculate_perceptual_hash(image_array)

        # 8. Calculate component scores
        image_quality_score = int(quality_result["score"])
        ocr_accuracy_score = int(ocr_result["confidence"] * 100)
        blur_detection_score = int(blur_score)
        tampering_detection_score = 100 if not tampering_result["is_tampered"] else 0
        data_consistency_score = ocr_extractor.check_consistency(ocr_result)
        expiration_check_score = 100 if not expiration_check["is_expired"] else 0

        # 9. Calculate total score (weighted)
        total_score = int(
            image_quality_score * 0.15 +
            ocr_accuracy_score * 0.25 +
            blur_detection_score * 0.10 +
            tampering_detection_score * 0.25 +
            face_quality_score * 0.10 +
            data_consistency_score * 0.10 +
            expiration_check_score * 0.05
        )

        # 10. Build explanations
        explanations = [
            f"Image Quality: {image_quality_score}%",
            f"OCR Accuracy: {ocr_accuracy_score}%",
            f"Blur Detection: {blur_detection_score}% (lower is better)",
            f"Tampering Check: {'PASSED' if not tampering_result['is_tampered'] else 'FAILED'}",
            f"Face Quality: {face_quality_score}%",
            f"Data Consistency: {data_consistency_score}%",
            f"Expiration Check: {'VALID' if not expiration_check['is_expired'] else 'EXPIRED'}"
        ]

        if face_match_score is not None:
            explanations.append(f"Face Match: {face_match_score:.2%} (confidence: {face_match_confidence:.2%})")

        return DocumentScoreResponse(
            total_score=total_score,
            image_quality_score=image_quality_score,
            ocr_accuracy_score=ocr_accuracy_score,
            blur_detection_score=blur_detection_score,
            tampering_detection_score=tampering_detection_score,
            face_quality_score=face_quality_score,
            data_consistency_score=data_consistency_score,
            expiration_check_score=expiration_check_score,
            ocr_confidence=ocr_result["confidence"],
            face_match_score=face_match_score,
            face_match_confidence=face_match_confidence,
            ocr_extracted_name=ocr_result.get("name"),
            ocr_extracted_id_number=ocr_result.get("id_number"),
            ocr_extracted_dob=ocr_result.get("dob"),
            is_tampered=tampering_result["is_tampered"],
            is_blurry=blur_score < 50,
            is_expired=expiration_check["is_expired"],
            ai_explanations=explanations,
            document_hash=document_hash,
            perceptual_hash=perceptual_hash
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@app.post("/check-duplicate", response_model=DuplicateCheckResponse)
async def check_duplicate(request: DuplicateCheckRequest):
    """
    Check if document is duplicate based on hash
    """
    # In production, this would check against a database
    # For now, return not duplicate
    return DuplicateCheckResponse(
        is_duplicate=False,
        similarity_score=0.0,
        matched_hashes=[]
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

