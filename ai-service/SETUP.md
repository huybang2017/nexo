# Python AI Service Setup Guide

## Installation

### 1. Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv
sudo apt-get install -y tesseract-ocr tesseract-ocr-vie
sudo apt-get install -y cmake libopenblas-dev liblapack-dev libx11-dev libgtk-3-dev
```

**macOS:**
```bash
brew install python3 tesseract tesseract-lang
brew install cmake dlib
```

### 2. Create Virtual Environment

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python Dependencies

```bash
pip install -r requirements.txt
```

**Note:** `dlib` và `face_recognition` có thể cần build từ source. Nếu gặp lỗi:
```bash
# Install dlib separately
pip install dlib
pip install face-recognition
```

## Running the Service

### Development Mode (with auto-reload)
```bash
./start.sh
# hoặc
python -m uvicorn app.main:app --reload --port 8001
```

### Production Mode
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## Configuration

Service chạy mặc định trên port 8001. Để thay đổi, sửa trong `app/main.py` hoặc dùng environment variable:

```bash
export PORT=8001
python -m uvicorn app.main:app --port $PORT
```

## Testing

### Health Check
```bash
curl http://localhost:8001/health
```

### Test Document Scoring
```bash
curl -X POST "http://localhost:8001/score-document" \
  -F "file=@/path/to/document.jpg" \
  -F "document_type=ID_CARD_FRONT"
```

## Integration with Java Backend

Java backend tự động gọi Python service khi:
- Upload KYC document
- Calculate KYC score
- Check document quality

Nếu Python service không available, hệ thống sẽ tự động fallback về simulation methods.

## Troubleshooting

### 1. dlib installation fails
```bash
# Install cmake first
sudo apt-get install cmake
pip install dlib
```

### 2. Tesseract not found
```bash
# Install tesseract
sudo apt-get install tesseract-ocr tesseract-ocr-vie
# Verify
tesseract --version
```

### 3. EasyOCR download models slowly
First run sẽ download models (~100MB). Đợi hoàn tất.

### 4. Port already in use
```bash
# Find process using port 8001
lsof -i :8001
# Kill process
kill -9 <PID>
```

## Performance Tips

1. **GPU Support**: Nếu có GPU, cài CUDA và cuDNN để tăng tốc EasyOCR và face_recognition
2. **Model Caching**: Models được cache tự động sau lần đầu download
3. **Worker Processes**: Dùng `--workers` trong production để xử lý parallel requests

