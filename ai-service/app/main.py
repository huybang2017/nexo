"""
FastAPI service for KYC Document Scoring using AI models
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import logging
from datetime import datetime
from utils.document_scorer import DocumentScorer
from utils.ocr_extractor import OCRExtractor
try:
    from utils.face_matcher import FaceMatcher
    FACE_MATCHER_AVAILABLE = True
except ImportError:
    FACE_MATCHER_AVAILABLE = False
    FaceMatcher = None
from utils.tampering_detector import TamperingDetector
from utils.image_quality import ImageQualityAnalyzer
import io
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="KYC AI Scoring Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "KYC AI Scoring Service"}

# Initialize AI models
document_scorer = DocumentScorer()
ocr_extractor = OCRExtractor()
face_matcher = FaceMatcher() if FACE_MATCHER_AVAILABLE else None
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


@app.post("/score-document", response_model=DocumentScoreResponse)
async def score_document(
    file: UploadFile = File(...),
    document_type: str = "ID_CARD_FRONT",
    reference_selfie: Optional[UploadFile] = None
):
    """
    Score a KYC document using AI models
    """
    start_time = datetime.now()
    logger.info("=" * 80)
    logger.info(f"📄 AI Model Request - Document Scoring Started")
    logger.info(f"   Document Type: {document_type}")
    logger.info(f"   File Name: {file.filename}")
    logger.info(f"   File Size: {file.size} bytes")
    logger.info(f"   Reference Selfie: {'Yes' if reference_selfie else 'No'}")
    
    try:
        # Read image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        logger.info(f"   Image Size: {image.size[0]}x{image.size[1]} pixels")

        # 1. Image Quality Analysis
        logger.info("🔍 Step 1: Analyzing image quality...")
        quality_result = image_quality.analyze(image_array)
        logger.info(f"   ✓ Image Quality Score: {quality_result['score']}%")
        
        # 2. OCR Extraction
        logger.info("📝 Step 2: Extracting text with OCR...")
        ocr_result = ocr_extractor.extract(image_array, document_type)
        logger.info(f"   ✓ OCR Confidence: {ocr_result['confidence']:.2%}")
        if ocr_result.get("name"):
            logger.info(f"   ✓ Extracted Name: {ocr_result.get('name')}")
        if ocr_result.get("id_number"):
            logger.info(f"   ✓ Extracted ID Number: {ocr_result.get('id_number')}")
        
        # 3. Tampering Detection
        logger.info("🔒 Step 3: Detecting tampering...")
        tampering_result = tampering_detector.detect(image_array)
        logger.info(f"   ✓ Tampering Detected: {tampering_result['is_tampered']}")
        
        # 4. Blur Detection
        logger.info("📸 Step 4: Detecting blur...")
        blur_score = image_quality.detect_blur(image_array)
        logger.info(f"   ✓ Blur Score: {blur_score:.2f} (lower is better)")
        
        # 5. Face Quality/Detection (for selfie or ID card with face)
        face_quality_score = 100
        face_match_score = None
        face_match_confidence = None
        
        if document_type in ["SELFIE", "ID_CARD_FRONT"]:
            logger.info("👤 Step 5: Analyzing face quality...")
            if face_matcher:
                face_result = face_matcher.analyze_face(image_array)
                face_quality_score = face_result["quality_score"]
                logger.info(f"   ✓ Face Quality Score: {face_quality_score}%")
                
                # Face matching if reference selfie provided
                if reference_selfie:
                    logger.info("🔗 Step 5b: Matching faces with reference selfie...")
                    ref_bytes = await reference_selfie.read()
                    ref_image = Image.open(io.BytesIO(ref_bytes))
                    ref_array = np.array(ref_image)
                    match_result = face_matcher.match_faces(image_array, ref_array)
                    face_match_score = match_result["match_score"]
                    face_match_confidence = match_result["confidence"]
                    logger.info(f"   ✓ Face Match Score: {face_match_score:.2%}")
                    logger.info(f"   ✓ Face Match Confidence: {face_match_confidence:.2%}")
            else:
                # Fallback if face_matcher not available
                face_quality_score = 80  # Default score
                logger.warning("   ⚠ Face matcher not available, using default score: 80%")

        # 6. Expiration Check (from OCR data)
        logger.info("📅 Step 6: Checking expiration...")
        expiration_check = ocr_extractor.check_expiration(ocr_result)
        logger.info(f"   ✓ Document Expired: {expiration_check['is_expired']}")

        # 7. Calculate Document Hash
        logger.info("🔐 Step 7: Calculating document hashes...")
        document_hash = document_scorer.calculate_hash(image_bytes)
        perceptual_hash = document_scorer.calculate_perceptual_hash(image_array)
        logger.info(f"   ✓ Document Hash: {document_hash[:16]}...")
        logger.info(f"   ✓ Perceptual Hash: {perceptual_hash[:16]}...")

        # 8. Calculate component scores
        image_quality_score = int(quality_result["score"])
        ocr_accuracy_score = int(ocr_result["confidence"] * 100)
        blur_detection_score = int(blur_score)
        tampering_detection_score = 100 if not tampering_result["is_tampered"] else 0
        data_consistency_score = ocr_extractor.check_consistency(ocr_result)
        expiration_check_score = 100 if not expiration_check["is_expired"] else 0

        # 9. Calculate total score (weighted)
        logger.info("📊 Step 8: Calculating component scores...")
        logger.info(f"   - Image Quality: {image_quality_score}% (weight: 15%)")
        logger.info(f"   - OCR Accuracy: {ocr_accuracy_score}% (weight: 25%)")
        logger.info(f"   - Blur Detection: {blur_detection_score}% (weight: 10%)")
        logger.info(f"   - Tampering Detection: {tampering_detection_score}% (weight: 25%)")
        logger.info(f"   - Face Quality: {face_quality_score}% (weight: 10%)")
        logger.info(f"   - Data Consistency: {data_consistency_score}% (weight: 10%)")
        logger.info(f"   - Expiration Check: {expiration_check_score}% (weight: 5%)")
        
        total_score = int(
            image_quality_score * 0.15 +
            ocr_accuracy_score * 0.25 +
            blur_detection_score * 0.10 +
            tampering_detection_score * 0.25 +
            face_quality_score * 0.10 +
            data_consistency_score * 0.10 +
            expiration_check_score * 0.05
        )
        logger.info(f"   ✓ TOTAL SCORE: {total_score}%")

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

