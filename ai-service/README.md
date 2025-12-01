# KYC AI Scoring Service

Python FastAPI service for KYC document scoring using AI models.

## Features

- **OCR Extraction**: Vietnamese + English text extraction using EasyOCR and Tesseract
- **Face Detection & Matching**: Face recognition for selfie verification
- **Tampering Detection**: Error Level Analysis, noise pattern analysis, geometry checks
- **Image Quality Analysis**: Sharpness, contrast, brightness, resolution checks
- **Blur Detection**: Laplacian variance method
- **Document Hashing**: SHA-256 and perceptual hashing for duplicate detection

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Note: For face_recognition, you may need to install dlib separately:
# On Ubuntu/Debian:
sudo apt-get install cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
pip install dlib

# For Tesseract OCR:
sudo apt-get install tesseract-ocr tesseract-ocr-vie
```

## Running the Service

```bash
# Development
python -m uvicorn app.main:app --reload --port 8001

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## API Endpoints

### POST /score-document
Score a KYC document.

**Request:**
- `file`: Image file (multipart/form-data)
- `document_type`: Type of document (ID_CARD_FRONT, ID_CARD_BACK, SELFIE, etc.)
- `reference_selfie`: Optional selfie for face matching

**Response:**
```json
{
  "total_score": 85,
  "image_quality_score": 90,
  "ocr_accuracy_score": 88,
  "blur_detection_score": 92,
  "tampering_detection_score": 95,
  "face_quality_score": 85,
  "data_consistency_score": 90,
  "expiration_check_score": 100,
  "ocr_confidence": 0.88,
  "face_match_score": 0.92,
  "face_match_confidence": 0.95,
  "ocr_extracted_name": "Nguyen Van A",
  "ocr_extracted_id_number": "123456789012",
  "is_tampered": false,
  "is_blurry": false,
  "is_expired": false,
  "ai_explanations": [...],
  "document_hash": "...",
  "perceptual_hash": "..."
}
```

### POST /check-duplicate
Check for duplicate documents.

### GET /health
Health check endpoint.

## Integration with Java Backend

The Java backend will call this service via HTTP. See `KycAiServiceClient.java` in the server module.

