# Nexo P2P Lending Platform

Platform cho vay ngang hàng (P2P Lending) với các tính năng quản lý KYC, credit scoring, và AI document verification.

## 🏗️ Kiến trúc hệ thống

Hệ thống bao gồm 4 thành phần chính:

- **Frontend (React + TypeScript)**: Giao diện người dùng
- **Backend (Spring Boot)**: API server và business logic
- **AI Service (FastAPI)**: Xử lý document verification và KYC scoring
- **Database (PostgreSQL)**: Lưu trữ dữ liệu

## 📋 Yêu cầu hệ thống

- **Java**: JDK 24+
- **Node.js**: 18+
- **Python**: 3.11+
- **PostgreSQL**: 16+
- **Docker & Docker Compose**: (Khuyến nghị) để chạy toàn bộ hệ thống

## 🚀 Cách 1: Chạy bằng Docker Compose (Khuyến nghị)

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd nexo
```

### Bước 2: Tạo file `.env` (tùy chọn)

Tạo file `.env` ở root để override các biến môi trường mặc định:

```bash
# Database
POSTGRES_DB=nexo
POSTGRES_USER=nexo
POSTGRES_PASSWORD=nexo123
POSTGRES_PORT=5432

# Server
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/nexo
SPRING_DATASOURCE_USERNAME=nexo
SPRING_DATASOURCE_PASSWORD=nexo123

# JWT
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# AI Service
AI_SERVICE_URL=http://ai-service:8001
AI_SERVICE_PORT=8001

# Frontend
APP_PORT=3000
VITE_API_URL=http://localhost:8080
```

### Bước 3: Build và chạy

```bash
# Build và start tất cả services
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build
```

### Bước 4: Kiểm tra services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **AI Service**: http://localhost:8001
- **Database**: localhost:5432

### Các lệnh Docker Compose hữu ích

```bash
# Xem logs
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f server
docker-compose logs -f ai-service
docker-compose logs -f app

# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa database)
docker-compose down -v

# Rebuild một service cụ thể
docker-compose build server
docker-compose up -d server
```

---

## 🛠️ Cách 2: Chạy thủ công (Development)

### Bước 1: Setup Database

```bash
# Tạo database
createdb nexo

# Hoặc sử dụng PostgreSQL client
psql -U postgres
CREATE DATABASE nexo;
CREATE USER nexo WITH PASSWORD 'nexo123';
GRANT ALL PRIVILEGES ON DATABASE nexo TO nexo;
\q
```

### Bước 2: Chạy AI Service

```bash
cd ai-service

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Chạy service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

AI Service sẽ chạy tại: http://localhost:8001

### Bước 3: Chạy Backend Server

```bash
cd server

# Build project
./mvnw clean package -DskipTests

# Chạy server
./mvnw spring-boot:run

# Hoặc chạy JAR file
java -jar target/server-0.0.1-SNAPSHOT.jar
```

Backend sẽ chạy tại: http://localhost:8080

**Lưu ý**: Đảm bảo đã cấu hình database connection trong `application.yml` hoặc environment variables.

### Bước 4: Chạy Frontend

```bash
cd app

# Install dependencies
npm install

# Chạy development server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:3000

**Lưu ý**: Đảm bảo `VITE_API_URL` trong `.env` hoặc `vite.config.ts` trỏ đúng đến backend URL.

---

## 🔧 Cấu hình

### Environment Variables

Hệ thống sử dụng environment variables để cấu hình. Các biến quan trọng:

#### Database
- `SPRING_DATASOURCE_URL`: JDBC URL (mặc định: `jdbc:postgresql://localhost:5432/nexo`)
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password

#### JWT
- `JWT_SECRET`: Secret key để sign JWT tokens
- `JWT_ACCESS_EXPIRATION`: Access token expiration (ms)
- `JWT_REFRESH_EXPIRATION`: Refresh token expiration (ms)

#### AI Service
- `AI_SERVICE_URL`: URL của AI service (mặc định: `http://localhost:8001`)
- `AI_SERVICE_ENABLED`: Enable/disable AI service (true/false)
- `AI_SERVICE_TIMEOUT`: Request timeout (ms)

#### CORS
- `CORS_ALLOWED_ORIGINS`: Allowed origins, phân cách bởi dấu phẩy

#### OAuth2 (Google)
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret

#### Email (SMTP)
- `MAIL_HOST`: SMTP host
- `MAIL_PORT`: SMTP port
- `MAIL_USERNAME`: SMTP username
- `MAIL_PASSWORD`: SMTP password

### Application Properties

Các cấu hình chi tiết có thể được override trong:
- `server/src/main/resources/application.yml`
- `server/src/main/resources/application.properties`

---

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### KYC
- `POST /api/kyc/profile` - Tạo/update KYC profile
- `POST /api/kyc/documents` - Upload KYC documents
- `GET /api/kyc/me` - Lấy KYC profile của user
- `GET /api/kyc-score/me` - Lấy KYC score

### Loans
- `GET /api/loans` - Danh sách loans
- `POST /api/loans` - Tạo loan request
- `GET /api/loans/{id}` - Chi tiết loan
- `PUT /api/loans/{id}` - Update loan

### Admin
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/loans` - Quản lý loans
- `GET /api/admin/tickets` - Quản lý support tickets
- `PUT /api/admin/kyc/{id}/approve` - Approve KYC
- `PUT /api/admin/kyc/{id}/reject` - Reject KYC

Xem thêm API documentation tại: http://localhost:8080/swagger-ui.html (nếu có)

---

## 🧪 Testing

### Test Backend

```bash
cd server
./mvnw test
```

### Test Frontend

```bash
cd app
npm test
```

### Test AI Service

```bash
cd ai-service
pytest
```

---

## 🐛 Troubleshooting

### Lỗi: Port đã được sử dụng

```bash
# Linux/Mac: Tìm và kill process
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Lỗi: Database connection failed

- Kiểm tra PostgreSQL đang chạy
- Kiểm tra credentials trong environment variables
- Kiểm tra database đã được tạo chưa

### Lỗi: AI Service không kết nối được

- Kiểm tra AI service đang chạy tại port 8001
- Kiểm tra `AI_SERVICE_URL` trong environment variables
- Kiểm tra network connectivity giữa services

### Lỗi: Frontend không kết nối được Backend

- Kiểm tra `VITE_API_URL` trong `.env` hoặc `vite.config.ts`
- Kiểm tra CORS configuration trong backend
- Kiểm tra backend đang chạy

### Lỗi: Module not found (Python)

```bash
cd ai-service
pip install -r requirements.txt
```

### Lỗi: Build failed (Maven)

```bash
cd server
./mvnw clean install -DskipTests
```

### Lỗi: Build failed (Node)

```bash
cd app
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Cấu trúc Project

```
nexo/
├── app/                 # Frontend (React + TypeScript)
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Backend (Spring Boot)
│   ├── src/
│   └── pom.xml
├── ai-service/         # AI Service (FastAPI)
│   ├── app/
│   └── requirements.txt
├── docker-compose.yml  # Docker Compose configuration
└── README.md           # File này
```

---

## 🔐 Default Accounts (Development)

Sau khi chạy lần đầu, bạn có thể tạo account test bằng API:

```bash
# Tạo admin account
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nexo.com",
    "password": "Admin123!@#",
    "confirmPassword": "Admin123!@#",
    "firstName": "Admin",
    "lastName": "System",
    "phone": "0901234567",
    "role": "BORROWER"
  }'

# Sau đó update role thành ADMIN trong database
```

**Lưu ý**: Trong production, đảm bảo thay đổi các default credentials!

---

## 📚 Tài liệu thêm

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

